"use client";

import { useGame } from "@/lib/monopoly/gameStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getNetWorthPublic } from "@/lib/monopoly/gameStore";
import { Trophy, RotateCcw, Crown } from "lucide-react";

interface Props {
  onClose: () => void;
}

export default function GameOverModal({ onClose }: Props) {
  const winnerId = useGame((s) => s.winnerId);
  const players = useGame((s) => s.players);
  const reset = useGame((s) => s.reset);
  const game = useGame();

  if (winnerId === null) return null;
  const winner = players[winnerId];
  const netWorth = getNetWorthPublic(game, winnerId);

  // Rank by net worth
  const ranked = [...players]
    .map((p) => ({ player: p, netWorth: getNetWorthPublic(game, p.id) }))
    .sort((a, b) => b.netWorth - a.netWorth);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-center"><Trophy className="w-12 h-12 text-yellow-500" /></div>
          <DialogTitle className="text-center">Game Selesai!</DialogTitle>
          <DialogDescription className="text-center">
            <span className="text-lg font-bold text-emerald-600">{winner.name}</span> memenangkan permainan!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="text-sm font-semibold text-center mb-2">Klasemen Akhir:</div>
          {ranked.map((r, i) => (
            <div
              key={r.player.id}
              className={`flex items-center gap-2 p-2 rounded-md ${i === 0 ? "bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-300" : "bg-card"}`}
            >
              <div className="text-lg font-bold w-8 flex items-center justify-center">{i === 0 ? <Crown className="w-5 h-5 text-yellow-500" /> : `#${i + 1}`}</div>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm ring-1 ring-white"
                style={{ backgroundColor: r.player.color }}
              >
                {r.player.token}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{r.player.name}</div>
                <div className="text-xs text-muted-foreground">
                  {r.player.bankrupt ? "Bangkrut" : "Aktif"}
                </div>
              </div>
              <div className="text-sm font-bold tabular-nums">${r.netWorth.toLocaleString()}</div>
            </div>
          ))}
        </div>

        <Button onClick={() => { reset(); onClose(); }} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
          <RotateCcw className="w-4 h-4" /> Main Lagi
        </Button>
      </DialogContent>
    </Dialog>
  );
}
