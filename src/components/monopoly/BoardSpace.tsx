"use client";

import { getColorHex, getSpace, getPrice } from "@/lib/monopoly/utils";
import { useGame } from "@/lib/monopoly/gameStore";
import { COLOR_SETS } from "@/lib/monopoly/boardData";
import type { BoardSpace, PropertySpace } from "@/lib/monopoly/types";
import { cn } from "@/lib/utils";
import type { ReactElement } from "react";
import { HelpCircle, Gift, Train, Zap, Droplet, CircleParking, Siren, ArrowBigLeft, type LucideIcon } from "lucide-react";
import { JailBarsIcon } from "./icons";
import { useT } from "@/lib/i18n";

type IconCmp = LucideIcon | ((p: { className?: string; strokeWidth?: number }) => ReactElement);

// Icon + label key for the four corner spaces (label resolved via i18n).
function cornerVisual(space: BoardSpace): { Icon: IconCmp; labelKey: string; sub?: string; iconClass: string } {
  switch (space.type) {
    case "GO":
      return { Icon: ArrowBigLeft, labelKey: "ui.cell.go", sub: "+$200", iconClass: "text-red-600 fill-red-600" };
    case "JAIL":
      return { Icon: JailBarsIcon, labelKey: "ui.cell.jail", iconClass: "text-orange-600" };
    case "FREE_PARKING":
      return { Icon: CircleParking, labelKey: "ui.cell.parking", iconClass: "text-sky-600" };
    case "GO_TO_JAIL":
      return { Icon: Siren, labelKey: "ui.cell.gotojail", iconClass: "text-red-600" };
    default:
      return { Icon: HelpCircle, labelKey: `board.${space.index}.name`, iconClass: "text-zinc-600" };
  }
}

// Icon for railroad/utility spaces (station, electricity, water).
function typeIcon(space: BoardSpace): { Icon: LucideIcon; color: string } | null {
  if (space.type === "RAILROAD") return { Icon: Train, color: "text-zinc-600 dark:text-zinc-300" };
  if (space.type === "UTILITY") {
    return /water|air/i.test(space.name)
      ? { Icon: Droplet, color: "text-sky-500" }
      : { Icon: Zap, color: "text-amber-500" };
  }
  return null;
}

interface Props {
  spaceIndex: number;
  orientation: "bottom" | "left" | "top" | "right";
  onSpaceClick: (index: number) => void;
}

export default function BoardSpace({ spaceIndex, orientation, onSpaceClick }: Props) {
  const t = useT();
  const space = getSpace(spaceIndex);
  const ownership = useGame((s) => s.ownership[spaceIndex]);
  const buildings = useGame((s) => s.buildings[spaceIndex]);
  const players = useGame((s) => s.players);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);

  const isHorizontal = orientation === "bottom" || orientation === "top";
  const isCorner = space.type === "GO" || space.type === "JAIL" || space.type === "FREE_PARKING" || space.type === "GO_TO_JAIL";

  const playersHere = players.filter((p) => !p.bankrupt && p.position === spaceIndex);
  const colorBar = getColorBar(space);
  const isCurrentTarget = useGame((s) => s.pendingSpaceAction === spaceIndex);

  const handleClick = () => onSpaceClick(spaceIndex);

  // Corner spaces are bigger
  if (isCorner) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "relative bg-amber-50 dark:bg-amber-950/40 border-2 border-emerald-900/30 flex items-center justify-center text-center p-1 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/50 transition shadow-inner aspect-square w-full h-full min-h-0 min-w-0",
        )}
      >
        {(() => {
          const { Icon, labelKey, sub, iconClass } = cornerVisual(space);
          return (
            <div className="flex flex-col items-center justify-center gap-0.5 leading-none">
              <Icon className={cn("w-6 h-6 sm:w-7 sm:h-7", iconClass)} strokeWidth={2} />
              <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-tight text-emerald-900 dark:text-emerald-100">{t(labelKey)}</div>
              {sub && <div className="text-[8px] sm:text-[9px] font-bold text-emerald-600 dark:text-emerald-400">{sub}</div>}
            </div>
          );
        })()}
        {playersHere.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <TokenCluster players={playersHere} currentPlayerIndex={currentPlayerIndex} spaceIndex={spaceIndex} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative bg-white dark:bg-zinc-900 border border-emerald-900/30 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition group w-full h-full min-h-0 min-w-0 overflow-hidden",
        isCurrentTarget && "ring-2 ring-yellow-400 animate-pulse",
      )}
    >
      {/* Color bar */}
      {colorBar && (
        <div
          className={cn(
            "absolute bg-opacity-100",
            orientation === "bottom" && "top-0 left-0 right-0 h-3 sm:h-3.5",
            orientation === "top" && "bottom-0 left-0 right-0 h-3 sm:h-3.5",
            orientation === "left" && "right-0 top-0 bottom-0 w-2.5 sm:w-3",
            orientation === "right" && "left-0 top-0 bottom-0 w-2.5 sm:w-3",
          )}
          style={{ backgroundColor: colorBar }}
        />
      )}

      {/* Owner indicator */}
      {ownership?.ownerId !== null && ownership?.ownerId !== undefined && (
        <div
          className={cn(
            "absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-white shadow",
            orientation === "bottom" && "bottom-0 right-0",
            orientation === "top" && "top-0 left-0",
            orientation === "left" && "bottom-0 left-0",
            orientation === "right" && "top-0 right-0",
          )}
          style={{ backgroundColor: players[ownership.ownerId]?.color || "#888" }}
          title={t("ui.badge.owned", { name: players[ownership.ownerId]?.name ?? "" })}
        />
      )}

      {/* Mortgaged indicator */}
      {ownership?.mortgaged && (
        <div className={cn(
          "absolute inset-0 bg-red-500/30 pointer-events-none",
        )}>
          <div className="absolute inset-0 flex items-center justify-center text-[8px] text-red-700 font-bold rotate-[-20deg]">
            {t("ui.badge.mortgaged")}
          </div>
        </div>
      )}

      {/* Buildings indicator — sits ON the color bar (like a real board) */}
      {buildings && (buildings.houses > 0 || buildings.hotel) && (
        <div className={cn(
          "absolute z-10 flex gap-px",
          orientation === "bottom" && "top-0 left-0 right-0 h-3 sm:h-3.5 items-center justify-center",
          orientation === "top" && "bottom-0 left-0 right-0 h-3 sm:h-3.5 items-center justify-center",
          orientation === "left" && "right-0 top-0 bottom-0 w-2.5 sm:w-3 flex-col items-center justify-center",
          orientation === "right" && "left-0 top-0 bottom-0 w-2.5 sm:w-3 flex-col items-center justify-center",
        )}>
          {buildings.hotel ? (
            <div className="w-2.5 h-1.5 sm:w-3 sm:h-2 bg-red-600 rounded-[1px] ring-1 ring-white shadow-sm" title={t("ui.badge.hotel")} />
          ) : (
            Array.from({ length: buildings.houses }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-[1px] ring-1 ring-white shadow-sm" title={t("ui.badge.house")} />
            ))
          )}
        </div>
      )}

      {/* Space content */}
      <div className={cn(
        "absolute inset-0 flex flex-col items-center justify-center px-0.5 py-0.5 text-center",
        colorBar && (orientation === "bottom" ? "pt-3.5 sm:pt-4" : orientation === "top" ? "pb-3.5 sm:pb-4" : orientation === "left" ? "pr-3 sm:pr-3.5" : "pl-3 sm:pl-3.5"),
      )}>
        <div className="shrink-0 w-full text-[8px] sm:text-[10px] md:text-[11px] font-semibold leading-[1.1] line-clamp-2 break-words hyphens-auto text-zinc-700 dark:text-zinc-300">
          {t(`board.${spaceIndex}.name`)}
        </div>
        {(space.type === "PROPERTY" || space.type === "RAILROAD" || space.type === "UTILITY") && (
          <div className="text-[8px] sm:text-[10px] md:text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 tabular-nums inline-flex items-center justify-center gap-0.5">
            {(() => { const ti = typeIcon(space); return ti ? <ti.Icon className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", ti.color)} strokeWidth={2.5} /> : null; })()}
            ${getPrice(space)}
          </div>
        )}
        {space.type === "TAX" && (
          <div className="text-[8px] sm:text-[10px] text-red-600 dark:text-red-400 mt-0.5 font-bold">
            ${(space as { amount: number }).amount}
          </div>
        )}
        {space.type === "CHANCE" && (
          <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" strokeWidth={2.5} />
        )}
        {space.type === "COMMUNITY_CHEST" && (
          <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" strokeWidth={2.5} />
        )}
      </div>

      {/* Player tokens — centered in the cell (offset only to clear the color
          bar) so the pawn sits in the middle of its tile while moving */}
      {playersHere.length > 0 && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center pointer-events-none z-20",
          colorBar && (orientation === "bottom" ? "pt-3.5 sm:pt-4" : orientation === "top" ? "pb-3.5 sm:pb-4" : orientation === "left" ? "pr-3 sm:pr-3.5" : "pl-3 sm:pl-3.5"),
        )}>
          <TokenCluster players={playersHere} currentPlayerIndex={currentPlayerIndex} spaceIndex={spaceIndex} />
        </div>
      )}
    </div>
  );
}

// Overlapping cluster of tokens with a translucent backdrop so they stay
// legible on top of the cell label instead of forming a messy pile.
function TokenCluster({
  players,
  currentPlayerIndex,
  spaceIndex,
}: {
  players: { id: number; name: string; token: string; color: string; position: number }[];
  currentPlayerIndex: number;
  spaceIndex: number;
}) {
  return (
    <div className="flex -space-x-1.5 rounded-full bg-white/75 dark:bg-zinc-900/75 backdrop-blur-[1px] px-0.5 py-px shadow-sm ring-1 ring-black/5">
      {players.map((p) => (
        <PlayerToken
          key={p.id}
          player={p}
          isCurrent={p.id === currentPlayerIndex}
          spaceIndex={spaceIndex}
        />
      ))}
    </div>
  );
}

// Separate component to track position change and trigger animation
function PlayerToken({ player, isCurrent, spaceIndex }: { player: { id: number; name: string; token: string; color: string; position: number }; isCurrent: boolean; spaceIndex: number }) {
  const turnPhase = useGame((s) => s.turnPhase);
  // Use a state keyed by position so React re-mounts the animated element each time
  // the player arrives at a new space — this re-triggers the CSS animation cleanly.
  const isHere = player.position === spaceIndex;
  // Only the token that is actually walking should bob. Previously this keyed off
  // `isCurrent`, so every token belonging to the player on turn bobbed — and a
  // token sitting still on another tile bobbed too.
  const isMoving = turnPhase === "MOVING" && isCurrent && isHere;

  // Use position+id as React key so animation re-runs each arrival
  return (
    <div
      key={`${player.id}-${player.position}-${isHere ? "here" : "away"}`}
      className={cn(
        "w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-xs shadow-md ring-1 ring-white transition-all",
        isCurrent && "ring-2 ring-yellow-400",
        isHere && "animate-step-in",
        isMoving && "animate-bounce-soft",
      )}
      style={{ backgroundColor: player.color }}
      title={player.name}
    >
      {player.token}
    </div>
  );
}

function getColorBar(space: BoardSpace): string | null {
  if (space.type === "PROPERTY") {
    const prop = space as PropertySpace;
    return getColorHex(prop.colorSet);
  }
  if (space.type === "CHANCE") return "#FF6B35";
  if (space.type === "COMMUNITY_CHEST") return "#FFD700";
  if (space.type === "TAX") return "#9CA3AF";
  if (space.type === "RAILROAD") return "#374151";
  if (space.type === "UTILITY") return "#6B7280";
  return null;
}
