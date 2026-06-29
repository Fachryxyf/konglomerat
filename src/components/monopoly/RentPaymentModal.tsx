"use client";

import { useState, useEffect } from "react";
import { useGame } from "@/lib/monopoly/gameStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Banknote, ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n";

interface Props {
  onClose: () => void;
  data: {
    payerId: number;
    payeeId: number;
    spaceIndex: number;
    amount: number;
    diceTotal: number;
    isUtility: boolean;
    multiplier: number;
  };
}

export default function RentPaymentModal({ onClose, data }: Props) {
  const t = useT();
  const players = useGame((s) => s.players);
  const space = useGame((s) => s.board[data.spaceIndex]);
  const buildings = useGame((s) => s.buildings[data.spaceIndex]);
  const [countdown, setCountdown] = useState(3);

  const payer = players[data.payerId];
  const payee = players[data.payeeId];

  useEffect(() => {
    let c = 3;
    const interval = setInterval(() => {
      c -= 1;
      if (c <= 0) {
        clearInterval(interval);
        setTimeout(() => onClose(), 0);
      } else {
        setCountdown(c);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [onClose]);

  if (!payer || !payee || !space) return null;

  // Determine rent breakdown
  let rentDetail = "";
  if (data.isUtility) {
    rentDetail = t("ui.rentpay.detail.util", { mult: data.multiplier, dice: data.diceTotal, amount: data.amount });
  } else if (space.type === "RAILROAD") {
    // Count railroads owned by payee
    let rrCount = 0;
    for (let i = 0; i < 40; i++) {
      const sp = useGame.getState().board[i];
      const o = useGame.getState().ownership[i];
      if (sp.type === "RAILROAD" && o.ownerId === data.payeeId) rrCount++;
    }
    rentDetail = t("ui.rentpay.detail.railroad", { count: rrCount, each: [25, 50, 100, 200][rrCount - 1], amount: data.amount });
  } else if (buildings?.hotel) {
    rentDetail = t("ui.rentpay.detail.hotel", { amount: data.amount });
  } else if (buildings && buildings.houses > 0) {
    rentDetail = t("ui.rentpay.detail.houses", { houses: buildings.houses, amount: data.amount });
  } else {
    rentDetail = t("ui.rentpay.detail.base", { amount: data.amount });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("ui.rentpay.title")}</DialogTitle>
          <DialogDescription>
            {t("ui.rentpay.desc", { payer: payer.name, amount: data.amount, payee: payee.name })}
          </DialogDescription>
        </DialogHeader>
        <div className="text-center">
          <div className="flex justify-center mb-2"><Banknote className="w-10 h-10 text-amber-500" /></div>
          <h2 className="text-lg font-bold mb-1">{t("ui.rentpay.title")}</h2>
          <div className="text-xs text-muted-foreground mb-4">
            {t("ui.rentpay.autoClose", { s: countdown })}
          </div>
        </div>

        {/* Player transfer visualization */}
        <div className="flex items-center justify-between gap-2 mb-4 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
          {/* Payer */}
          <div className="text-center flex-1">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl mx-auto shadow ring-2 ring-white"
              style={{ backgroundColor: payer.color }}
            >
              {payer.token}
            </div>
            <div className="text-xs font-semibold mt-1 truncate">{payer.name}</div>
            <div className="text-[10px] text-muted-foreground">{t("ui.rentpay.balance", { v: payer.balance })}</div>
          </div>

          {/* Arrow + amount */}
          <div className="flex flex-col items-center">
            <ArrowRight className="w-6 h-6 text-zinc-400" />
            <div className="text-base font-bold text-red-600 dark:text-red-400">
              -${data.amount}
            </div>
            <div className="text-[10px] text-muted-foreground">{t("ui.rentpay.rentLabel")}</div>
          </div>

          {/* Payee */}
          <div className="text-center flex-1">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl mx-auto shadow ring-2 ring-white"
              style={{ backgroundColor: payee.color }}
            >
              {payee.token}
            </div>
            <div className="text-xs font-semibold mt-1 truncate">{payee.name}</div>
            <div className="text-[10px] text-muted-foreground">{t("ui.rentpay.balance", { v: payee.balance })}</div>
          </div>
        </div>

        {/* Property info */}
        <div className="border rounded-lg p-3 bg-white dark:bg-zinc-900">
          <div className="text-xs text-muted-foreground">{t("ui.rentpay.property")}</div>
          <div className="font-semibold text-sm">{t(`board.${data.spaceIndex}.name`)}</div>
          <div className="text-[10px] text-muted-foreground mt-1">{t("ui.rentpay.rentDetail")}</div>
          <div className="text-xs font-medium">{rentDetail}</div>
          {buildings && (buildings.houses > 0 || buildings.hotel) && (
            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
              {buildings.hotel ? t("ui.rentpay.onProp.hotel") : t("ui.rentpay.onProp.houses", { houses: buildings.houses })}
            </div>
          )}
        </div>

        <Button onClick={onClose} className="w-full" variant="outline">
          {t("ui.common.close")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
