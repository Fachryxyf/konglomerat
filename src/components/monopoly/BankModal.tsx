"use client";

import { useState } from "react";
import { useGame, getCreditLimitPublic, getNetWorthPublic } from "@/lib/monopoly/gameStore";
import { useIntent } from "@/lib/monopoly/use-intent";
import { LOAN_TERMS, loanInterestRate, totalDebt } from "@/lib/monopoly/bank";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Landmark, Banknote, Percent, Building2, Scale, TrendingUp, TrendingDown } from "lucide-react";
import { useT } from "@/lib/i18n";

interface Props {
  playerId: number;
  onClose: () => void;
}

export default function BankModal({ playerId, onClose }: Props) {
  const t = useT();
  const state = useGame();
  const player = state.players[playerId];
  const send = useIntent();

  const [term, setTerm] = useState<number>(LOAN_TERMS[1]);
  const [amount, setAmount] = useState<number>(0);

  if (!player) return null;

  const rate = loanInterestRate(state.centralRate); // effective borrow rate / round
  const net = getNetWorthPublic(state, playerId);
  const debt = totalDebt(player.loans ?? []);
  const limit = getCreditLimitPublic(state, playerId);
  const reg = state.regulations;

  const isMyTurnHuman = player.type === "HUMAN";
  const reqAmount = Math.min(Math.max(0, Math.round(amount)), limit);
  const principalPerRound = reqAmount > 0 ? Math.ceil(reqAmount / term) : 0;
  const firstInterest = Math.ceil(reqAmount * rate);
  const estInstallment = principalPerRound + firstInterest;
  const canBorrow = isMyTurnHuman && reqAmount >= 50 && reqAmount <= limit;

  const rentPct = Math.round((reg.rentMod - 1) * 100);
  const taxPct = Math.round(reg.propertyTaxRate * 100);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-600" /> {t("ui.bank.title")}
          </DialogTitle>
        </DialogHeader>

        {/* Policy summary */}
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-3 space-y-1.5 text-xs">
          <div className="font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
            <Scale className="w-4 h-4" /> {t("ui.bank.policyTitle")}
          </div>
          <Row icon={<Percent className="w-3.5 h-3.5" />} label={t("ui.bank.baseRate")} value={t("ui.bank.perRound", { v: Math.round(state.centralRate * 100) })} />
          <Row icon={<Percent className="w-3.5 h-3.5" />} label={t("ui.bank.loanRate")} value={t("ui.bank.perRound", { v: Math.round(rate * 100) })} />
          <Row
            icon={rentPct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            label={t("ui.bank.rentReg")}
            value={rentPct === 0 ? t("ui.bank.neutral") : t("ui.bank.rentVal", { sign: rentPct > 0 ? "+" : "", v: rentPct, mode: rentPct < 0 ? t("ui.bank.rentControl") : t("ui.bank.deregulation") })}
          />
          <Row icon={<Building2 className="w-3.5 h-3.5" />} label={t("ui.bank.propTax")} value={taxPct > 0 ? t("ui.bank.perRound", { v: taxPct }) : t("ui.bank.none")} />
        </div>

        {/* My standing */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Stat label={t("ui.bank.cash")} value={`$${player.balance}`} />
          <Stat label={t("ui.bank.net")} value={`$${net}`} />
          <Stat label={t("ui.bank.debt")} value={`$${debt}`} tone={debt > 0 ? "warn" : undefined} />
          <Stat label={t("ui.bank.creditLeft")} value={`$${limit}`} tone="good" />
        </div>

        {/* Active loans */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t("ui.bank.activeLoans")}</div>
          {(player.loans ?? []).length === 0 ? (
            <div className="text-xs text-zinc-400 italic py-1">{t("ui.bank.noLoans")}</div>
          ) : (
            (player.loans ?? []).map((loan) => {
              const payoff = loan.balance + Math.ceil(loan.balance * rate);
              return (
                <div key={loan.id} className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs">
                  <div>
                    <div className="font-medium">{t("ui.bank.principalLeft", { v: loan.balance })}</div>
                    <div className="text-zinc-500 text-[11px]">
                      {t("ui.bank.loanInfo", { rounds: loan.roundsRemaining, inst: Math.ceil(loan.principalPerRound + loan.balance * rate) })}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px]"
                    disabled={!isMyTurnHuman || player.balance < payoff}
                    onClick={() => send({ type: "REPAY_LOAN", loanId: loan.id }, playerId)}
                  >
                    {t("ui.bank.repay", { v: payoff })}
                  </Button>
                </div>
              );
            })
          )}
        </div>

        {/* Borrow form */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
          <div className="text-xs font-semibold flex items-center gap-1.5">
            <Banknote className="w-4 h-4 text-emerald-600" /> {t("ui.bank.applyLoan")}
          </div>
          {limit < 50 ? (
            <div className="text-xs text-zinc-400 italic">{t("ui.bank.cantBorrow")}</div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={limit}
                  step={10}
                  value={reqAmount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="flex-1 accent-emerald-600"
                />
                <input
                  type="number"
                  min={0}
                  max={limit}
                  value={reqAmount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-20 text-right text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-1.5 py-1"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-500">{t("ui.bank.term")}</span>
                {LOAN_TERMS.map((tm) => (
                  <button
                    key={tm}
                    onClick={() => setTerm(tm)}
                    className={`px-2 py-0.5 rounded text-[11px] border transition ${
                      term === tm ? "bg-emerald-600 text-white border-emerald-600" : "border-zinc-300 dark:border-zinc-700 hover:bg-accent"
                    }`}
                  >
                    {t("ui.bank.termVal", { t: tm })}
                  </button>
                ))}
              </div>
              {reqAmount >= 50 && (
                <div className="text-[11px] text-zinc-500">
                  {t("ui.bank.estLabel")} <strong className="text-zinc-700 dark:text-zinc-300">${estInstallment}</strong> {t("ui.bank.estDetail", { p: principalPerRound, i: firstInterest })}
                </div>
              )}
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={!canBorrow}
                onClick={() => { if (send({ type: "TAKE_LOAN", amount: reqAmount, term }, playerId)) setAmount(0); }}
              >
                {isMyTurnHuman ? t("ui.bank.borrow", { v: reqAmount }) : t("ui.bank.turnOnly")}
              </Button>
            </>
          )}
        </div>

        <Button variant="outline" className="w-full" onClick={onClose}>{t("ui.common.close")}</Button>
      </DialogContent>
    </Dialog>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-emerald-700/80 dark:text-emerald-300/80">{icon}{label}</span>
      <span className="font-semibold text-emerald-900 dark:text-emerald-100">{value}</span>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  const color = tone === "good" ? "text-emerald-600 dark:text-emerald-400" : tone === "warn" ? "text-amber-600 dark:text-amber-400" : "text-zinc-800 dark:text-zinc-200";
  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5">
      <div className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</div>
      <div className={`font-bold ${color}`}>{value}</div>
    </div>
  );
}
