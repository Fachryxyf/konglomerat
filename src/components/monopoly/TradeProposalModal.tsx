"use client";

import { useGame } from "@/lib/monopoly/gameStore";
import { getSpace, getPrice } from "@/lib/monopoly/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeftRight, Coins, Home, Key, Lightbulb, Check, X } from "lucide-react";

interface Props {
  onClose: () => void;
}

export default function TradeProposalModal({ onClose }: Props) {
  const pendingTrade = useGame((s) => s.pendingTrade);
  const players = useGame((s) => s.players);
  const acceptTrade = useGame((s) => s.acceptTrade);
  const rejectTrade = useGame((s) => s.rejectTrade);

  if (!pendingTrade) return null;
  const from = players[pendingTrade.fromId];
  const to = players[pendingTrade.toId];

  // Only show modal if recipient is human
  if (to.type !== "HUMAN") return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-cyan-500" /> Proposal Trade</DialogTitle>
          <DialogDescription>
            {from.name} mengajukan trade kepada {to.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {/* From offers */}
          <div className="border-2 rounded-md p-3" style={{ borderColor: from.color }}>
            <div className="text-xs font-bold mb-2 flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: from.color }} />
              {from.token} {from.name} berikan:
            </div>
            <div className="space-y-1 text-xs">
              {pendingTrade.cashFrom > 0 && <div className="flex items-center gap-1"><Coins className="w-3 h-3 text-yellow-500" /> ${pendingTrade.cashFrom.toLocaleString()}</div>}
              {pendingTrade.propertiesFrom.map((idx) => (
                <div key={idx} className="flex items-center gap-1"><Home className="w-3 h-3 text-zinc-500" /> {getSpace(idx).name}</div>
              ))}
              {pendingTrade.goojFrom > 0 && (
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold">
                  <Key className="w-3 h-3" /> {pendingTrade.goojFrom}× Kartu Bebas Penjara
                </div>
              )}
              {pendingTrade.cashFrom === 0 && pendingTrade.propertiesFrom.length === 0 && pendingTrade.goojFrom === 0 && (
                <div className="italic text-muted-foreground">Tidak ada</div>
              )}
            </div>
          </div>

          {/* To offers */}
          <div className="border-2 rounded-md p-3" style={{ borderColor: to.color }}>
            <div className="text-xs font-bold mb-2 flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: to.color }} />
              {to.token} {to.name} berikan:
            </div>
            <div className="space-y-1 text-xs">
              {pendingTrade.cashTo > 0 && <div className="flex items-center gap-1"><Coins className="w-3 h-3 text-yellow-500" /> ${pendingTrade.cashTo.toLocaleString()}</div>}
              {pendingTrade.propertiesTo.map((idx) => (
                <div key={idx} className="flex items-center gap-1"><Home className="w-3 h-3 text-zinc-500" /> {getSpace(idx).name}</div>
              ))}
              {pendingTrade.goojTo > 0 && (
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold">
                  <Key className="w-3 h-3" /> {pendingTrade.goojTo}× Kartu Bebas Penjara
                </div>
              )}
              {pendingTrade.cashTo === 0 && pendingTrade.propertiesTo.length === 0 && pendingTrade.goojTo === 0 && (
                <div className="italic text-muted-foreground">Tidak ada</div>
              )}
            </div>
          </div>
        </div>

        {/* Info note about GOOJ card */}
        {(pendingTrade.goojFrom > 0 || pendingTrade.goojTo > 0) && (
          <div className="text-[10px] text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-900 flex gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            <span><strong>Kartu Bebas Penjara</strong> bisa diperdagangkan antar pemain. Jika kamu punya kartu ini saat di penjara, kamu bisa keluar tanpa bayar $50.</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={() => { acceptTrade(); onClose(); }} className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-1.5">
            <Check className="w-4 h-4" /> Terima
          </Button>
          <Button onClick={() => { rejectTrade(); onClose(); }} variant="outline" className="flex-1 gap-1.5">
            <X className="w-4 h-4" /> Tolak
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
