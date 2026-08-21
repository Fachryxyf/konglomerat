"use client";

import { useGame } from "@/lib/monopoly/gameStore";
import {
  CRIMES, catchChance, heatLabel, jailBail,
  BRIBE_GUARD_COST, BRIBE_GUARD_FINE, LOBBY_COST, LOBBY_FINE, RIG_AUCTION_FINE, rigAuctionCost,
  EVADE_PAY_FRACTION, MAX_HEAT,
} from "@/lib/monopoly/government";
import { getNetWorthPublic } from "@/lib/monopoly/gameStore";
import { useIntent } from "@/lib/monopoly/use-intent";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Landmark, ShieldAlert, Gavel, Handshake, FileWarning, KeyRound } from "lucide-react";
import { useT } from "@/lib/i18n";

interface Props {
  playerId: number;
  onClose: () => void;
}

export default function GovernmentModal({ playerId, onClose }: Props) {
  const t = useT();
  const state = useGame();
  const player = state.players[playerId];
  const send = useIntent();

  if (!player) return null;

  const isActor = player.type === "HUMAN"; // actions gate on the player's own turn in-store
  const heat = player.heat ?? 0;
  const hl = heatLabel(heat);
  const heatColor = hl.tone === "good" ? "bg-emerald-500" : hl.tone === "warn" ? "bg-amber-500" : "bg-red-500";
  const heatText = hl.tone === "good" ? "text-emerald-600 dark:text-emerald-400" : hl.tone === "warn" ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";

  const auctionActive = state.auction.isActive && state.auction.propertyIndex !== null;
  const inAuction = auctionActive && state.auction.participants.includes(playerId);
  const bail = jailBail(player.jailCount, getNetWorthPublic(state, playerId));

  const pct = (base: number) => Math.round(catchChance(base, heat) * 100);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-rose-600" /> {t("ui.gov.title")}
          </DialogTitle>
        </DialogHeader>

        {/* Suspicion meter */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-semibold"><ShieldAlert className="w-4 h-4 text-rose-500" /> {t("ui.gov.suspicion")}</span>
            <span className={`font-bold ${heatText}`}>{t("ui.gov.heatVal", { label: t(hl.key), n: heat, max: MAX_HEAT })}</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div className={`h-full ${heatColor} transition-all`} style={{ width: `${heat}%` }} />
          </div>
          <p className="text-[11px] text-zinc-500">{t("ui.gov.suspicionNote")}</p>
        </div>

        {player.inJail && (
          <div className="text-xs rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-2 text-amber-700 dark:text-amber-300">
            {t("ui.gov.jailedNote", { bail })}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <CrimeCard
            icon={<KeyRound className="w-4 h-4" />}
            title={t("gov.crime.BRIBE_GUARD.label")}
            desc={t("gov.crime.BRIBE_GUARD.desc")}
            meta={t("ui.gov.metaCostRiskFine", { cost: BRIBE_GUARD_COST, pct: pct(CRIMES.BRIBE_GUARD.baseRisk), fine: BRIBE_GUARD_FINE })}
            disabled={!isActor || !player.inJail || player.balance < BRIBE_GUARD_COST}
            cta={t("ui.gov.cta.bribe", { cost: BRIBE_GUARD_COST })}
            onClick={() => send({ type: "BRIBE_GUARD" }, playerId)}
            hint={!player.inJail ? t("ui.gov.hint.jailOnly") : undefined}
          />
          <CrimeCard
            icon={<Handshake className="w-4 h-4" />}
            title={t("gov.crime.LOBBY.label")}
            desc={t("gov.crime.LOBBY.desc")}
            meta={t("ui.gov.metaCostRiskFine", { cost: LOBBY_COST, pct: pct(CRIMES.LOBBY.baseRisk), fine: LOBBY_FINE })}
            disabled={!isActor || player.inJail || player.lobbyActive || player.balance < LOBBY_COST}
            cta={player.lobbyActive ? t("ui.gov.cta.perkActive") : t("ui.gov.cta.lobby", { cost: LOBBY_COST })}
            onClick={() => send({ type: "LOBBY" }, playerId)}
          />
          <CrimeCard
            icon={<FileWarning className="w-4 h-4" />}
            title={t("gov.crime.EVADE.label")}
            desc={t("gov.crime.EVADE.desc")}
            meta={t("ui.gov.metaEvade", { pct: Math.round(EVADE_PAY_FRACTION * 100), risk: pct(CRIMES.EVADE.baseRisk) })}
            disabled={!isActor || player.inJail}
            cta={player.evadeNextRent ? t("ui.gov.cta.evadeOff") : t("ui.gov.cta.evadeOn")}
            active={player.evadeNextRent}
            onClick={() => send({ type: "ARM_EVASION" }, playerId)}
          />
          <CrimeCard
            icon={<Gavel className="w-4 h-4" />}
            title={t("gov.crime.RIG_AUCTION.label")}
            desc={t("gov.crime.RIG_AUCTION.desc")}
            meta={auctionActive ? t("ui.gov.metaCostRiskFine", { cost: rigAuctionCost(state.auction.currentBid), pct: pct(CRIMES.RIG_AUCTION.baseRisk), fine: RIG_AUCTION_FINE }) : t("ui.gov.metaRigInactive", { pct: pct(CRIMES.RIG_AUCTION.baseRisk) })}
            disabled={!isActor || player.inJail || !inAuction}
            cta={t("ui.gov.cta.rig")}
            onClick={() => send({ type: "RIG_AUCTION" }, playerId)}
            hint={!auctionActive ? t("ui.gov.hint.noAuction") : !inAuction ? t("ui.gov.hint.notInAuction") : undefined}
          />
        </div>

        <Button variant="outline" className="w-full" onClick={onClose}>{t("ui.common.close")}</Button>
      </DialogContent>
    </Dialog>
  );
}

function CrimeCard({ icon, title, desc, meta, disabled, cta, onClick, hint, active }: {
  icon: React.ReactNode; title: string; desc: string; meta: string;
  disabled: boolean; cta: string; onClick: () => void; hint?: string; active?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 ${active ? "border-rose-400 bg-rose-50 dark:bg-rose-950/30" : "border-zinc-200 dark:border-zinc-800"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">{icon}{title}</div>
          <p className="text-[11px] text-zinc-500 mt-0.5">{desc}</p>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 font-medium">{meta}</p>
          {hint && <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 italic">{hint}</p>}
        </div>
        <Button
          size="sm"
          variant={active ? "default" : "outline"}
          className={`h-8 text-xs shrink-0 ${active ? "" : "border-rose-300 text-rose-700 hover:bg-rose-50 dark:text-rose-300"}`}
          disabled={disabled}
          onClick={onClick}
        >
          {cta}
        </Button>
      </div>
    </div>
  );
}
