"use client";

import { useGame } from "@/lib/monopoly/gameStore";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import {
  Dices, Footprints, Play, Banknote, Layers, Gavel, Settings,
  ArrowLeftRight, Home, Lock, ScrollText, type LucideIcon,
} from "lucide-react";

const KIND_COLORS: Record<string, string> = {
  ROLL: "text-blue-600 dark:text-blue-400 border-blue-400",
  MOVE: "text-emerald-700 dark:text-emerald-300 border-emerald-500",
  ACTION: "text-zinc-700 dark:text-zinc-300 border-zinc-400",
  PAYMENT: "text-amber-700 dark:text-amber-300 border-amber-500",
  CARD: "text-purple-700 dark:text-purple-300 border-purple-500",
  AUCTION: "text-pink-700 dark:text-pink-300 border-pink-500",
  SYSTEM: "text-red-700 dark:text-red-300 border-red-500 font-semibold bg-red-50 dark:bg-red-950/30",
  TRADE: "text-cyan-700 dark:text-cyan-300 border-cyan-500",
  BUILD: "text-orange-700 dark:text-orange-300 border-orange-500",
  JAIL: "text-rose-700 dark:text-rose-300 border-rose-500",
};

const KIND_ICONS: Record<string, LucideIcon> = {
  ROLL: Dices,
  MOVE: Footprints,
  ACTION: Play,
  PAYMENT: Banknote,
  CARD: Layers,
  AUCTION: Gavel,
  SYSTEM: Settings,
  TRADE: ArrowLeftRight,
  BUILD: Home,
  JAIL: Lock,
};

export default function GameLog() {
  const t = useT();
  const log = useGame((s) => s.log);
  const players = useGame((s) => s.players);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when log updates
  useEffect(() => {
    if (scrollRef.current) {
      // Use the scroll container, not window scrollIntoView
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [log]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[220px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 shrink-0">
        <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
          <ScrollText className="w-3.5 h-3.5 text-emerald-600" /> {t("ui.log.title")}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {t("ui.log.entries", { n: log.length })}
        </div>
      </div>

      {/* Scrollable log content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-2 py-1.5 min-h-0"
      >
        {log.length === 0 ? (
          <div className="text-xs text-muted-foreground italic text-center py-4">
            {t("ui.log.empty")}
          </div>
        ) : (
          <div className="space-y-1">
            {log.map((entry) => {
              const player = entry.playerId !== null ? players[entry.playerId] : null;
              const kindClass = KIND_COLORS[entry.kind] || "text-zinc-600 border-zinc-400";
              const Icon = KIND_ICONS[entry.kind] || Play;
              return (
                <div
                  key={entry.id}
                  className={cn(
                    "text-[11px] leading-snug py-1 px-2 rounded border-l-2 bg-zinc-50/50 dark:bg-zinc-800/30",
                    kindClass,
                  )}
                >
                  <div className="flex items-start gap-1.5">
                    <Icon className="shrink-0 w-3 h-3 mt-0.5 opacity-70" />
                    <div className="flex-1 min-w-0">
                      <span className="text-zinc-400 dark:text-zinc-500 mr-1 text-[10px]">
                        T{entry.turn}
                      </span>
                      {player && (
                        <span className="font-medium mr-0.5" style={{ color: player.color }}>
                          {player.token}
                        </span>
                      )}
                      <span>{t(entry.msg.key, entry.msg.params)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        )}
      </div>
    </div>
  );
}
