"use client";

import { useGame } from "@/lib/monopoly/gameStore";
import { getNetWorthPublic } from "@/lib/monopoly/gameStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Landmark } from "lucide-react";

interface Props {
  onClose: () => void;
}

export default function TaxModal({ onClose }: Props) {
  const pendingSpaceAction = useGame((s) => s.pendingSpaceAction);
  const players = useGame((s) => s.players);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);
  const payTenPercent = useGame((s) => s.payTenPercentTax);
  const payFlat = useGame((s) => s.payFlatTax);
  const game = useGame();

  if (pendingSpaceAction === null) return null;
  const space = game.board[pendingSpaceAction];
  if (space.type !== "TAX" || (space as { taxType: string }).taxType !== "INCOME") return null;

  const player = players[currentPlayerIndex];
  const netWorth = getNetWorthPublic(game, player.id);
  const tenPercent = Math.ceil(netWorth * 0.1);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Landmark className="w-5 h-5 text-amber-600" /> Income Tax</DialogTitle>
          <DialogDescription>
            {player.name} harus memilih opsi pembayaran:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground text-center">
            Net worth saat ini: <span className="font-bold tabular-nums">${netWorth.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => {
                payTenPercent();
                onClose();
              }}
              variant="outline"
              className="flex flex-col items-center h-auto py-3"
            >
              <div className="text-xs text-muted-foreground">10% dari aset</div>
              <div className="text-lg font-bold text-amber-600">${tenPercent}</div>
            </Button>
            <Button
              onClick={() => {
                payFlat();
                onClose();
              }}
              variant="outline"
              className="flex flex-col items-center h-auto py-3"
            >
              <div className="text-xs text-muted-foreground">Bayar flat</div>
              <div className="text-lg font-bold text-amber-600">$200</div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
