"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/monopoly/gameStore";
import { useIntent } from "@/lib/monopoly/use-intent";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dices, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function GameControl() {
  const t = useT();
  const players = useGame((s) => s.players);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);
  const turnPhase = useGame((s) => s.turnPhase);
  const lastDiceRoll = useGame((s) => s.lastDiceRoll);
  const doublesCount = useGame((s) => s.doublesCount);
  const lastRollSummary = useGame((s) => s.lastRollSummary);
  const send = useIntent();

  const player = players[currentPlayerIndex];
  const rolling = turnPhase === "ROLLING_DICE";
  const [rollingDice, setRollingDice] = useState<[number, number]>([1, 1]);

  const isHuman = player?.type === "HUMAN";

  useEffect(() => {
    if (turnPhase === "ROLLING_DICE") {
      const interval = setInterval(() => {
        setRollingDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
      }, 80);
      return () => clearInterval(interval);
    }
  }, [turnPhase]);

  if (!player) return null;

  const diceValues: [number, number] = rolling
    ? rollingDice
    : [lastDiceRoll.die1 || 1, lastDiceRoll.die2 || 1];

  const handleRoll = () => {
    if (player.inJail) {
      send({ type: "JAIL_DECISION", decision: "ROLL" });
    } else {
      send({ type: "ROLL_DICE" });
    }
  };

  return (
    <div className="w-full min-h-full flex flex-col items-center justify-between gap-2 p-2 sm:p-4 text-white">
      {/* Top: Current player */}
      <div className="text-center shrink-0">
        <div className="text-[10px] sm:text-xs text-emerald-100 uppercase tracking-wider">{t("ui.control.turn")}</div>
        <div className="flex items-center justify-center gap-2 mt-1">
          <div
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm sm:text-lg shadow-lg ring-2 ring-white"
            style={{ backgroundColor: player.color }}
          >
            {player.token}
          </div>
          <div className="text-sm sm:text-lg font-bold truncate max-w-[140px]">{player.name}</div>
        </div>
        <div className="text-base sm:text-lg mt-1 text-yellow-200 font-bold tabular-nums">
          ${player.balance.toLocaleString()}
        </div>
        {player.type === "AI" && (
          <div className="text-[10px] mt-1 inline-flex items-center gap-1 text-emerald-200">
            <span className={cn(
              "inline-block w-1.5 h-1.5 rounded-full",
              player.difficulty === "EASY" && "bg-emerald-400",
              player.difficulty === "MEDIUM" && "bg-amber-400",
              player.difficulty === "HARD" && "bg-rose-400",
            )} />
            {t("ui.player.aiTitle", { diff: t(`ui.ai.${player.difficulty.toLowerCase()}.label`) })}
          </div>
        )}
        {player.inJail && (
          <div className="text-[10px] sm:text-xs mt-1 inline-flex items-center gap-1 text-red-300 font-semibold"><Lock className="w-3 h-3" /> {t("ui.control.inJail", { n: player.jailTurns })}</div>
        )}
        {doublesCount > 0 && (
          <div className="text-[10px] sm:text-xs mt-1 inline-flex items-center gap-1 text-yellow-300"><Dices className="w-3 h-3" /> {t("ui.control.doubles", { n: doublesCount })}</div>
        )}
      </div>

      {/* Middle: Dice */}
      <div className="flex flex-col items-center gap-2 my-2 shrink-0">
        <div className="flex gap-2 sm:gap-3" style={{ perspective: "400px" }}>
          <Dice3D value={diceValues[0]} rolling={rolling} delay={0} />
          <Dice3D value={diceValues[1]} rolling={rolling} delay={150} />
        </div>
        {lastRollSummary && (
          <div className="text-[10px] sm:text-xs text-emerald-100 text-center font-medium min-h-[2.5em] max-w-[200px]">
            {lastRollSummary}
          </div>
        )}
      </div>

      {/* Bottom: Action button */}
      <div className="w-full space-y-1.5 shrink-0">
        {turnPhase === "WAITING_ROLL" && isHuman && !player.inJail && (
          <Button
            onClick={handleRoll}
            size="lg"
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-sm sm:text-base animate-pulse-button"
          >
            <Dices className="w-4 h-4 mr-1.5" /> {t("ui.control.roll")}
            <span className="ml-1.5 text-[10px] font-normal opacity-70">{t("ui.control.spaceHint")}</span>
          </Button>
        )}
        {turnPhase === "WAITING_ROLL" && isHuman && player.inJail && (
          <div className="space-y-1">
            <div className="text-[10px] text-center text-red-200 font-semibold inline-flex items-center gap-1 justify-center w-full"><Lock className="w-3 h-3" /> {t("ui.control.jailChoice")}</div>
            <Button
              onClick={() => send({ type: "JAIL_DECISION", decision: "PAY" })}
              size="sm"
              variant="secondary"
              className="w-full text-xs h-8"
              disabled={player.balance < 50}
            >
              {t("ui.control.payBail")}
            </Button>
            {player.getOutOfJailCards > 0 && (
              <Button
                onClick={() => send({ type: "JAIL_DECISION", decision: "CARD" })}
                size="sm"
                variant="secondary"
                className="w-full text-xs h-8"
              >
                {t("ui.control.useGooj", { n: player.getOutOfJailCards })}
              </Button>
            )}
            <Button
              onClick={handleRoll}
              size="sm"
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black text-xs h-8"
            >
              <Dices className="w-3.5 h-3.5 mr-1" /> {t("ui.control.rollShort")}
            </Button>
          </div>
        )}
        {turnPhase === "POST_ACTION" && isHuman && (
          <Button
            onClick={() => send({ type: "END_TURN" })}
            size="lg"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm sm:text-base"
          >
            {t("ui.control.endTurn")} <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        )}
        {(turnPhase === "ROLLING_DICE" || turnPhase === "MOVING" || turnPhase === "ACTION" || turnPhase === "CARD_DRAW" || turnPhase === "AUCTION") && (
          <div className="text-center text-[10px] sm:text-xs text-emerald-100 italic animate-pulse">
            {(() => { const k = getPhaseKey(turnPhase); return k ? t(k) : ""; })()}
          </div>
        )}
        {player.type === "AI" && turnPhase === "WAITING_ROLL" && (
          <div className="text-center text-[10px] sm:text-xs text-emerald-100 italic inline-flex items-center gap-1.5 justify-center w-full">
            <Loader2 className="w-3 h-3 animate-spin" /> {t("ui.control.aiThinking")}
          </div>
        )}
        {player.type === "AI" && turnPhase === "POST_ACTION" && (
          <div className="text-center text-[10px] sm:text-xs text-emerald-100 italic inline-flex items-center gap-1.5 justify-center w-full">
            <Loader2 className="w-3 h-3 animate-spin" /> {t("ui.control.aiEnding")}
          </div>
        )}
      </div>
    </div>
  );
}

function getPhaseKey(phase: string): string {
  switch (phase) {
    case "ROLLING_DICE":
      return "ui.phase.rolling";
    case "MOVING":
      return "ui.phase.moving";
    case "ACTION":
      return "ui.phase.action";
    case "CARD_DRAW":
      return "ui.phase.cardDraw";
    case "AUCTION":
      return "ui.phase.auction";
    default:
      return "";
  }
}

// 3D Dice with rotation animation
function Dice3D({ value, rolling, delay }: { value: number; rolling: boolean; delay: number }) {
  const dots = getDots(value);

  return (
    <div
      // Key on the PHASE, not on the value: while rolling, the face changes every
      // 80ms and a value-based key would remount the node each time, restarting
      // the 0.6s tumble so it never actually plays (it just jittered). One mount
      // per phase lets the roll run continuously, then settle once.
      key={rolling ? "rolling" : `settled-${value}`}
      className={cn(
        "w-11 h-11 sm:w-14 sm:h-14 bg-white rounded-lg shadow-xl flex flex-col p-1.5 sm:p-2 preserve-3d",
        rolling ? "animate-dice-roll" : "animate-dice-settle",
      )}
      style={{
        animationDelay: `${delay}ms`,
        transformStyle: "preserve-3d",
      }}
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-0.5 flex-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {dots[i] && (
              <div
                className={cn(
                  "rounded-full bg-zinc-900 transition-all",
                  value === 1 ? "w-2 h-2 sm:w-2.5 sm:h-2.5" : "w-1.5 h-1.5 sm:w-2 sm:h-2",
                  rolling && "animate-pulse",
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getDots(value: number): boolean[] {
  const patterns: Record<number, boolean[]> = {
    1: [false, false, false, false, true, false, false, false, false],
    2: [true, false, false, false, false, false, false, false, true],
    3: [true, false, false, false, true, false, false, false, true],
    4: [true, false, true, false, false, false, true, false, true],
    5: [true, false, true, false, true, false, true, false, true],
    6: [true, false, true, true, false, true, true, false, true],
  };
  return patterns[value] || patterns[1];
}
