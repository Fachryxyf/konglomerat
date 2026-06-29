"use client";

import { useGame } from "@/lib/monopoly/gameStore";
import {
  CRIMES, catchChance, heatLabel, jailBail,
  BRIBE_GUARD_COST, BRIBE_GUARD_FINE, LOBBY_COST, LOBBY_FINE, RIG_AUCTION_FINE, rigAuctionCost,
  EVADE_PAY_FRACTION, MAX_HEAT,
} from "@/lib/monopoly/government";
import { getNetWorthPublic } from "@/lib/monopoly/gameStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Landmark, ShieldAlert, Gavel, Handshake, FileWarning, KeyRound } from "lucide-react";

interface Props {
  playerId: number;
  onClose: () => void;
}

export default function GovernmentModal({ playerId, onClose }: Props) {
  const state = useGame();
  const player = state.players[playerId];
  const bribeGuard = useGame((s) => s.bribeGuard);
  const lobbyRegulation = useGame((s) => s.lobbyRegulation);
  const armEvasion = useGame((s) => s.armEvasion);
  const rigAuction = useGame((s) => s.rigAuction);

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
            <Landmark className="w-5 h-5 text-rose-600" /> Pemerintahan &amp; "Jalur Belakang"
          </DialogTitle>
        </DialogHeader>

        {/* Suspicion meter */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-semibold"><ShieldAlert className="w-4 h-4 text-rose-500" /> Tingkat Kecurigaan</span>
            <span className={`font-bold ${heatText}`}>{hl.label} ({heat}/{MAX_HEAT})</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div className={`h-full ${heatColor} transition-all`} style={{ width: `${heat}%` }} />
          </div>
          <p className="text-[11px] text-zinc-500">Makin tinggi kecurigaan, makin besar peluang aksimu ketahuan. Kecurigaan turun perlahan tiap ronde kalau kamu tidak berulah.</p>
        </div>

        {player.inJail && (
          <div className="text-xs rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-2 text-amber-700 dark:text-amber-300">
            Kamu sedang <strong>dipenjara</strong>. Aktivitas (bangun, trade, lobi) dibekukan. Jaminan resmi saat ini: <strong>${bail}</strong>.
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <CrimeCard
            icon={<KeyRound className="w-4 h-4" />}
            title={CRIMES.BRIBE_GUARD.label}
            desc={CRIMES.BRIBE_GUARD.desc}
            meta={`Biaya $${BRIBE_GUARD_COST} • risiko ketahuan ${pct(CRIMES.BRIBE_GUARD.baseRisk)}% • denda $${BRIBE_GUARD_FINE}`}
            disabled={!isActor || !player.inJail || player.balance < BRIBE_GUARD_COST}
            cta={`Suap $${BRIBE_GUARD_COST}`}
            onClick={() => bribeGuard(playerId)}
            hint={!player.inJail ? "Hanya saat dipenjara." : undefined}
          />
          <CrimeCard
            icon={<Handshake className="w-4 h-4" />}
            title={CRIMES.LOBBY.label}
            desc={CRIMES.LOBBY.desc}
            meta={`Biaya $${LOBBY_COST} • risiko ${pct(CRIMES.LOBBY.baseRisk)}% • denda $${LOBBY_FINE}`}
            disabled={!isActor || player.inJail || player.lobbyActive || player.balance < LOBBY_COST}
            cta={player.lobbyActive ? "Perk aktif" : `Lobi $${LOBBY_COST}`}
            onClick={() => lobbyRegulation(playerId)}
          />
          <CrimeCard
            icon={<FileWarning className="w-4 h-4" />}
            title={CRIMES.EVADE.label}
            desc={CRIMES.EVADE.desc}
            meta={`Bayar hanya ${Math.round(EVADE_PAY_FRACTION * 100)}% sewa berikutnya • risiko audit ${pct(CRIMES.EVADE.baseRisk)}%`}
            disabled={!isActor || player.inJail}
            cta={player.evadeNextRent ? "Batalkan" : "Aktifkan"}
            active={player.evadeNextRent}
            onClick={() => armEvasion(playerId)}
          />
          <CrimeCard
            icon={<Gavel className="w-4 h-4" />}
            title={CRIMES.RIG_AUCTION.label}
            desc={CRIMES.RIG_AUCTION.desc}
            meta={auctionActive ? `Biaya $${rigAuctionCost(state.auction.currentBid)} • risiko ${pct(CRIMES.RIG_AUCTION.baseRisk)}% • denda $${RIG_AUCTION_FINE}` : `Hanya saat ada lelang berjalan • risiko ${pct(CRIMES.RIG_AUCTION.baseRisk)}%`}
            disabled={!isActor || player.inJail || !inAuction}
            cta="Manipulasi"
            onClick={() => rigAuction(playerId)}
            hint={!auctionActive ? "Tidak ada lelang berjalan." : !inAuction ? "Kamu tidak ikut lelang ini." : undefined}
          />
        </div>

        <Button variant="outline" className="w-full" onClick={onClose}>Tutup</Button>
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
