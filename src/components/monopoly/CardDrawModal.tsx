"use client";

import { useGame } from "@/lib/monopoly/gameStore";
import { sendIntent } from "@/lib/monopoly/use-intent";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { HelpCircle, Gift, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";

interface Props {
  onClose: () => void;
}

export default function CardDrawModal({ onClose }: Props) {
  const pendingCard = useGame((s) => s.pendingCard);
  const players = useGame((s) => s.players);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);

  const currentPlayer = players[currentPlayerIndex];
  const isAITurn = currentPlayer?.type === "AI";

  // Countdown for AI turn - auto dismiss after 3 seconds
  // Use pendingCard identity as key to reset countdown via remount
  if (!pendingCard) return null;

  return <CardDrawModalInner
    key={pendingCard.id + "-" + (isAITurn ? "ai" : "human")}
    pendingCard={pendingCard}
    // Silent dispatch: dismissing a card is never an illegal move the player
    // needs warned about, and a double-dismiss race would just add toast noise.
    dismissCard={() => sendIntent({ type: "DISMISS_CARD" })}
    isAITurn={isAITurn}
    currentPlayer={currentPlayer}
    onClose={onClose}
  />;
}

interface InnerProps {
  pendingCard: NonNullable<ReturnType<typeof useGame.getState>["pendingCard"]>;
  dismissCard: () => boolean;
  isAITurn: boolean;
  currentPlayer: ReturnType<typeof useGame.getState>["players"][number] | undefined;
  onClose: () => void;
}

function CardDrawModalInner({ pendingCard, dismissCard, isAITurn, currentPlayer, onClose }: InnerProps) {
  const t = useT();
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    if (!isAITurn) return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          // Defer dismissCard to avoid setState-in-effect cascade
          setTimeout(() => dismissCard(), 0);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isAITurn, dismissCard]);

  const isChance = pendingCard.deck === "CHANCE";
  const bgClass = isChance
    ? "bg-gradient-to-br from-orange-500 to-red-600"
    : "bg-gradient-to-br from-yellow-400 to-amber-600";
  const Icon = isChance ? HelpCircle : Gift;
  const deckName = t(`card.deck.${pendingCard.deck}`);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md animate-card-rise">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm ring-2 ring-white"
              style={{ backgroundColor: currentPlayer?.color }}
            >
              {currentPlayer?.token}
            </span>
            {t("ui.carddraw.title", { deck: deckName })}
          </DialogTitle>
        </DialogHeader>
        <div className={cn("rounded-lg p-6 text-white shadow-lg", bgClass)}>
          <div className="text-center mb-4">
            <div className="flex justify-center mb-2 animate-card-flip"><Icon className="w-16 h-16" strokeWidth={1.5} /></div>
            <div className="text-lg font-bold uppercase tracking-wider">{deckName}</div>
            <div className="text-xs mt-1 opacity-90">
              {t("ui.carddraw.drawing", { name: currentPlayer?.name ?? "" })}
            </div>
          </div>
          <div className="bg-white/25 backdrop-blur rounded-md p-4 text-center text-base font-medium min-h-[80px] flex items-center justify-center">
            {t(`card.${pendingCard.deck}.${pendingCard.id}`)}
          </div>
        </div>
        {isAITurn ? (
          <div className="text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-0.5 w-full">
            <span className="inline-flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" /> {t("ui.carddraw.aiProcessing", { s: countdown })}</span>
            <span className="text-[11px] opacity-70">{t("ui.carddraw.skipPre")} <kbd className="px-1 rounded bg-zinc-200 dark:bg-zinc-700">{t("ui.key.space")}</kbd> {t("ui.carddraw.skipPost")}</span>
          </div>
        ) : (
          <Button
            onClick={() => {
              if (dismissCard()) onClose();
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {t("ui.carddraw.execute")}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
