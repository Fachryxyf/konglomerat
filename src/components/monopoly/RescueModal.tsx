"use client";

import { useGame } from "@/lib/monopoly/gameStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { HandCoins, X } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function RescueModal() {
  const t = useT();
  const pendingRescue = useGame((s) => s.pendingRescue);
  const players = useGame((s) => s.players);
  const resolveRescue = useGame((s) => s.resolveRescue);

  if (!pendingRescue || pendingRescue.queue.length === 0) return null;
  const investor = players[pendingRescue.queue[0]];
  const target = players[pendingRescue.targetId];
  if (!investor || !target) return null;
  const debt = pendingRescue.debt;
  const pactTarget = Math.ceil(debt * 1.5);

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-emerald-600" /> {t("ui.rescue.title")}
          </DialogTitle>
          <DialogDescription>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: target.color }} />
              <strong>{target.name}</strong> {t("ui.rescue.desc", { debt: debt.toLocaleString(), investor: investor.name })}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3 text-xs space-y-1.5">
          <div className="font-semibold text-emerald-700 dark:text-emerald-300">{t("ui.rescue.termsTitle")}</div>
          <ul className="space-y-1 text-muted-foreground">
            <li>• {t("ui.rescue.term.pay", { debt: debt.toLocaleString(), name: target.name })}</li>
            <li>• {t("ui.rescue.term.share", { name: target.name, target: pactTarget.toLocaleString() })}</li>
            <li>• {t("ui.rescue.term.vassal", { name: target.name })}</li>
            <li>• {t("ui.rescue.term.free", { name: target.name })}</li>
            <li className="text-amber-600 dark:text-amber-400">• {t("ui.rescue.term.risk")}</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => resolveRescue(true)} disabled={investor.balance < debt} className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-1.5">
            <HandCoins className="w-4 h-4" /> {t("ui.rescue.invest", { debt: debt.toLocaleString() })}
          </Button>
          <Button onClick={() => resolveRescue(false)} variant="outline" className="flex-1 gap-1.5">
            <X className="w-4 h-4" /> {t("ui.rescue.reject")}
          </Button>
        </div>
        {pendingRescue.queue.length > 1 && (
          <div className="text-[10px] text-muted-foreground text-center">{t("ui.rescue.next")}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
