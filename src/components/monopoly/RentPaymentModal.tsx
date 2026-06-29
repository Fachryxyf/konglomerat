"use client";

import { useState, useEffect } from "react";
import { useGame } from "@/lib/monopoly/gameStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Banknote, ArrowRight } from "lucide-react";

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
    rentDetail = `${data.multiplier}x × dadu (${data.diceTotal}) = $${data.amount}`;
  } else if (space.type === "RAILROAD") {
    // Count railroads owned by payee
    let rrCount = 0;
    for (let i = 0; i < 40; i++) {
      const sp = useGame.getState().board[i];
      const o = useGame.getState().ownership[i];
      if (sp.type === "RAILROAD" && o.ownerId === data.payeeId) rrCount++;
    }
    rentDetail = `${rrCount} stasiun dimiliki × $${[25, 50, 100, 200][rrCount - 1]} = $${data.amount}`;
  } else if (buildings?.hotel) {
    rentDetail = `Sewa Hotel = $${data.amount}`;
  } else if (buildings && buildings.houses > 0) {
    rentDetail = `Sewa ${buildings.houses} rumah = $${data.amount}`;
  } else {
    // Check if monopoly (2x)
    rentDetail = `Sewa dasar (mungkin 2x monopoli) = $${data.amount}`;
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>Pembayaran Sewa</DialogTitle>
          <DialogDescription>
            {payer.name} membayar sewa {data.amount} ke {payee.name}
          </DialogDescription>
        </DialogHeader>
        <div className="text-center">
          <div className="flex justify-center mb-2"><Banknote className="w-10 h-10 text-amber-500" /></div>
          <h2 className="text-lg font-bold mb-1">Pembayaran Sewa</h2>
          <div className="text-xs text-muted-foreground mb-4">
            Modal akan otomatis tutup dalam {countdown}s
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
            <div className="text-[10px] text-muted-foreground">Saldo: ${payer.balance}</div>
          </div>

          {/* Arrow + amount */}
          <div className="flex flex-col items-center">
            <ArrowRight className="w-6 h-6 text-zinc-400" />
            <div className="text-base font-bold text-red-600 dark:text-red-400">
              -${data.amount}
            </div>
            <div className="text-[10px] text-muted-foreground">sewa</div>
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
            <div className="text-[10px] text-muted-foreground">Saldo: ${payee.balance}</div>
          </div>
        </div>

        {/* Property info */}
        <div className="border rounded-lg p-3 bg-white dark:bg-zinc-900">
          <div className="text-xs text-muted-foreground">Properti:</div>
          <div className="font-semibold text-sm">{space.name}</div>
          <div className="text-[10px] text-muted-foreground mt-1">Detail sewa:</div>
          <div className="text-xs font-medium">{rentDetail}</div>
          {buildings && (buildings.houses > 0 || buildings.hotel) && (
            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
              {buildings.hotel ? "Hotel" : `${buildings.houses} rumah`} di properti ini
            </div>
          )}
        </div>

        <Button onClick={onClose} className="w-full" variant="outline">
          Tutup
        </Button>
      </DialogContent>
    </Dialog>
  );
}
