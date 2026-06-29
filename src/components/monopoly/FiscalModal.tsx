"use client";

import { useGame } from "@/lib/monopoly/gameStore";
import { getNetWorthPublic } from "@/lib/monopoly/gameStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Landmark, TrendingUp } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function FiscalModal() {
  const t = useT();
  const pendingFiscal = useGame((s) => s.pendingFiscal);
  const players = useGame((s) => s.players);
  const resolveFiscalChoice = useGame((s) => s.resolveFiscalChoice);
  const game = useGame();

  if (!pendingFiscal || pendingFiscal.queue.length === 0) return null;
  const playerId = pendingFiscal.queue[0];
  const player = players[playerId];
  if (!player) return null;
  const net = getNetWorthPublic(game, playerId);
  const Icon = pendingFiscal.kind === "TAX" ? Landmark : TrendingUp;

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-amber-600" /> {t(pendingFiscal.titleKey)}
          </DialogTitle>
          <DialogDescription>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
              {t("ui.fiscal.decisionForPre")} <strong>{player.name}</strong> {t("ui.fiscal.decisionForPost", { net: net.toLocaleString() })}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="text-sm text-muted-foreground">{t(pendingFiscal.introKey)}</div>

        <div className="space-y-2">
          {pendingFiscal.choices.map((c) => (
            <button
              key={c.id}
              onClick={() => resolveFiscalChoice(c.id)}
              className="w-full text-left rounded-lg border-2 border-zinc-200 dark:border-zinc-700 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition p-3"
            >
              <div className="font-semibold text-sm">{t(c.labelKey)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t(c.descKey)}</div>
            </button>
          ))}
        </div>

        {pendingFiscal.queue.length > 1 && (
          <div className="text-[10px] text-muted-foreground text-center">
            {t("ui.fiscal.othersFollow", { n: pendingFiscal.queue.length - 1 })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
