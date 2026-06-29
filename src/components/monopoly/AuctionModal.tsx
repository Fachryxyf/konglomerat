"use client";

import { useState, useEffect } from "react";
import { useGame } from "@/lib/monopoly/gameStore";
import { getSpace, getPrice, getColorHex } from "@/lib/monopoly/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { PropertySpace } from "@/lib/monopoly/types";
import { aiAuctionBid } from "@/lib/monopoly/ai";
import { cn } from "@/lib/utils";
import { Gavel } from "lucide-react";

interface Props {
  onClose: () => void;
}

export default function AuctionModal({ onClose }: Props) {
  const auction = useGame((s) => s.auction);
  const players = useGame((s) => s.players);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);
  const auctionBid = useGame((s) => s.auctionBid);
  const auctionLeave = useGame((s) => s.auctionLeave);
  const endAuction = useGame((s) => s.endAuction);
  const lastDiceRoll = useGame((s) => s.lastDiceRoll);

  const [bidInput, setBidInput] = useState("");

  useEffect(() => {
    if (!auction.isActive) return;
    const currentBidderId = auction.participants[auction.turnIndex];
    if (currentBidderId === undefined) return;
    const player = players[currentBidderId];
    if (!player || player.type !== "AI") return;

    const timer = setTimeout(() => {
      // Use full game state for AI decision
      const fullState = useGame.getState();
      let aiBid = aiAuctionBid(fullState, currentBidderId, auction.currentBid);
      // If only 1 participant left and no bid yet, force minimum bid of $1
      if (auction.participants.length === 1 && auction.currentBid === 0) {
        aiBid = 1;
      }
      if (aiBid > 0) {
        auctionBid(currentBidderId, aiBid);
      } else {
        auctionLeave(currentBidderId);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [auction, players, auctionBid, auctionLeave, lastDiceRoll]);

  if (!auction.isActive || auction.propertyIndex === null) return null;

  const space = getSpace(auction.propertyIndex);
  const price = getPrice(space);
  const currentBidderId = auction.participants[auction.turnIndex];
  const isHumanTurn = currentBidderId !== undefined && players[currentBidderId]?.type === "HUMAN";
  const humanPlayer = players[currentBidderId];
  const minNextBid = auction.currentBid + 1;
  const colorHex = space.type === "PROPERTY" ? getColorHex((space as PropertySpace).colorSet) : "#374151";

  const handleBid = () => {
    const amount = parseInt(bidInput, 10);
    if (isNaN(amount) || amount < minNextBid) return;
    if (humanPlayer && amount > humanPlayer.balance) return;
    auctionBid(currentBidderId, amount);
    setBidInput("");
  };

  const quickBids = [
    auction.currentBid + 10,
    auction.currentBid + 25,
    auction.currentBid + 50,
  ].filter((v) => humanPlayer && v <= humanPlayer.balance);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-pink-500" /> Lelang: {space.name}
          </DialogTitle>
          <DialogDescription>
            Harga asli ${price} • {auction.participants.length} peserta aktif
          </DialogDescription>
        </DialogHeader>

        {/* Property mini-card */}
        <div className="border-2 rounded-lg overflow-hidden shadow" style={{ borderColor: colorHex }}>
          <div className="text-white text-center py-1 text-xs font-bold" style={{ backgroundColor: colorHex }}>
            {space.name}
          </div>
          <div className="p-2 bg-white dark:bg-zinc-900 text-xs text-center">
            Harga: ${price}
          </div>
        </div>

        {/* Current bid */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-center">
          <div className="text-xs text-amber-700 dark:text-amber-400">Tawaran Tertinggi</div>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            ${auction.currentBid}
          </div>
          {auction.currentBidderId !== null && (
            <div className="text-xs mt-1">
              oleh {players[auction.currentBidderId]?.token} {players[auction.currentBidderId]?.name}
            </div>
          )}
        </div>

        {/* Participants */}
        <div className="flex flex-wrap gap-1.5">
          {players.filter((p) => !p.bankrupt).map((p) => {
            const inAuction = auction.participants.includes(p.id);
            const passed = auction.passedPlayers.includes(p.id);
            return (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border",
                  inAuction
                    ? "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800"
                    : passed
                    ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 opacity-50"
                    : "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800",
                )}
              >
                <span>{p.token}</span>
                <span>{p.name}</span>
              </div>
            );
          })}
        </div>

        {/* Bid interface */}
        {isHumanTurn && humanPlayer ? (
          <div className="space-y-2">
            <div className="text-sm text-center font-medium">
              Giliran {humanPlayer.name} menawar
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                value={bidInput}
                onChange={(e) => setBidInput(e.target.value)}
                placeholder={`Min $${minNextBid}`}
                min={minNextBid}
                max={humanPlayer.balance}
              />
              <Button
                onClick={handleBid}
                disabled={!bidInput || parseInt(bidInput, 10) < minNextBid || parseInt(bidInput, 10) > humanPlayer.balance}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Tawar
              </Button>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {quickBids.map((v) => (
                <Button
                  key={v}
                  size="sm"
                  variant="outline"
                  onClick={() => setBidInput(String(v))}
                  className="text-xs"
                >
                  ${v}
                </Button>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => auctionLeave(currentBidderId)}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Keluar dari lelang
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground italic">
            {currentBidderId !== undefined && players[currentBidderId]
              ? `${players[currentBidderId].name} sedang menawar...`
              : "Menunggu..."}
          </div>
        )}

        {/* End auction button (debug / manual) */}
        {auction.participants.length === 1 && auction.currentBid > 0 && (
          <Button onClick={endAuction} className="w-full bg-blue-600 hover:bg-blue-700">
            Selesaikan Lelang
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
