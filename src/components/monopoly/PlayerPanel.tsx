"use client";

import { useGame } from "@/lib/monopoly/gameStore";
import { getSpace, getPrice, getColorHex, hasMonopoly } from "@/lib/monopoly/utils";
import { COLOR_SETS } from "@/lib/monopoly/boardData";
import { cn } from "@/lib/utils";
import type { ColorSet } from "@/lib/monopoly/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Coins, MapPin, Lock, Key, Train, Lightbulb, Star } from "lucide-react";
import { useT } from "@/lib/i18n";

interface Props {
  onPlayerAction: (playerId: number) => void;
}

export default function PlayerPanel({ onPlayerAction }: Props) {
  const t = useT();
  const players = useGame((s) => s.players);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);
  const ownership = useGame((s) => s.ownership);
  const buildings = useGame((s) => s.buildings);

  return (
    <div className="grid grid-cols-2 gap-2">
      {players.map((p) => {
        const isCurrent = p.id === currentPlayerIndex;
        const propertiesByColor: Record<string, number[]> = {};
        const otherProperties: number[] = [];
        for (const idx of p.properties) {
          const space = getSpace(idx);
          const o = ownership[idx];
          if (space.type === "PROPERTY") {
            const cs = (space as { colorSet: ColorSet }).colorSet;
            if (!propertiesByColor[cs]) propertiesByColor[cs] = [];
            propertiesByColor[cs].push(idx);
          } else {
            otherProperties.push(idx);
          }
        }
        return (
          <div
            key={p.id}
            className={cn(
              "rounded-lg border-2 p-2 sm:p-3 transition shadow-sm",
              isCurrent ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900",
              p.bankrupt && "opacity-40 grayscale",
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base shadow ring-1 ring-white"
                style={{ backgroundColor: p.color }}
              >
                {p.token}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-semibold truncate flex items-center gap-1">
                  {p.name}
                  {p.type === "AI" && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-px rounded-full bg-zinc-100 dark:bg-zinc-800 text-[9px] font-medium text-zinc-600 dark:text-zinc-300"
                      title={t("ui.player.aiTitle", { diff: t(`ui.ai.${p.difficulty.toLowerCase()}.label`) })}
                    >
                      <span className={cn(
                        "inline-block w-1.5 h-1.5 rounded-full",
                        p.difficulty === "EASY" && "bg-emerald-500",
                        p.difficulty === "MEDIUM" && "bg-amber-500",
                        p.difficulty === "HARD" && "bg-rose-500",
                      )} />
                      AI
                    </span>
                  )}
                  {p.bankrupt && <span className="text-[9px] font-bold text-red-500 px-1 rounded bg-red-50 dark:bg-red-950/40">{t("ui.player.bankrupt")}</span>}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-x-1.5 gap-y-0.5 flex-wrap">
                  <span className="inline-flex items-center gap-0.5 font-medium text-zinc-600 dark:text-zinc-300 tabular-nums">
                    <Coins className="w-3 h-3 text-yellow-500" />${p.balance.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-0.5 truncate max-w-[90px]">
                    <MapPin className="w-3 h-3 text-rose-400 shrink-0" />{t(`board.${p.position}.name`)}
                  </span>
                  {p.inJail && <Lock className="w-3 h-3 text-red-500" />}
                  {p.getOutOfJailCards > 0 && (
                    <span className="inline-flex items-center gap-0.5 px-1 py-0 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-[9px]" title={t("ui.player.goojTitle")}>
                      <Key className="w-2.5 h-2.5" />×{p.getOutOfJailCards}
                    </span>
                  )}
                </div>
              </div>
              {isCurrent && (
                <div className="text-[10px] font-bold text-yellow-600 animate-pulse">●</div>
              )}
            </div>

            {/* Properties */}
            {p.properties.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {/* Color sets */}
                {Object.entries(propertiesByColor).map(([colorSet, indices]) => {
                  const sortedIndices = [...indices].sort((a, b) => a - b);
                  const allIndices = COLOR_SETS[colorSet] || [];
                  const hasAll = allIndices.every((idx) => ownership[idx]?.ownerId === p.id);
                  return (
                    <div key={colorSet} className="flex gap-0.5 items-center" title={t("ui.player.colorTitle", { color: t(`board.color.${colorSet}`), status: hasAll ? t("ui.player.monopoly") : t("ui.player.incomplete") })}>
                      {sortedIndices.map((idx) => {
                        const o = ownership[idx];
                        const b = buildings[idx];
                        return (
                          <button
                            key={idx}
                            onClick={() => onPlayerAction(p.id)}
                            className={cn(
                              "relative w-4 h-5 sm:w-5 sm:h-6 rounded-sm border border-zinc-300 dark:border-zinc-700 hover:scale-110 transition cursor-pointer",
                              o?.mortgaged && "opacity-50",
                            )}
                            style={{ backgroundColor: getColorHex(colorSet) }}
                            title={t(`board.${idx}.name`)}
                          >
                            {b && (b.hotel ? (
                              <span className="absolute inset-0 flex items-center justify-center text-[6px] sm:text-[7px] font-bold text-red-600 bg-white/85 rounded-sm">H</span>
                            ) : b.houses > 0 ? (
                              <span className="absolute inset-0 flex items-center justify-center text-[6px] sm:text-[7px] font-bold text-white drop-shadow">
                                {b.houses}
                              </span>
                            ) : null)}
                            {hasAll && (
                              <Star className="absolute -top-1 -right-1 w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
                {/* Other properties */}
                {otherProperties.map((idx) => {
                  const space = getSpace(idx);
                  const o = ownership[idx];
                  const Icon = space.type === "RAILROAD" ? Train : Lightbulb;
                  return (
                    <button
                      key={idx}
                      onClick={() => onPlayerAction(p.id)}
                      className={cn(
                        "relative w-4 h-5 sm:w-5 sm:h-6 rounded-sm border border-zinc-300 dark:border-zinc-700 bg-zinc-600 hover:scale-110 transition cursor-pointer flex items-center justify-center text-white",
                        o?.mortgaged && "opacity-50",
                      )}
                      title={t(`board.${idx}.name`)}
                    >
                      <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground italic">{t("ui.player.noProps")}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
