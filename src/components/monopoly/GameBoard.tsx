"use client";

import { useGame } from "@/lib/monopoly/gameStore";
import BoardSpace from "./BoardSpace";
import GameControl from "./GameControl";
import { cn } from "@/lib/utils";
import { HelpCircle, Gift } from "lucide-react";
import { useT } from "@/lib/i18n";

// A tilted stack of cards in the center of the board (purely decorative — the
// real draw flow stays in the modal). Chance pile (orange) + Community Chest
// (gold), placed diagonally like a classic Monopoly board.
function CardDeck({ kind, className, tilt }: { kind: "CHANCE" | "CC"; className?: string; tilt: number }) {
  const t = useT();
  const isChance = kind === "CHANCE";
  const color = isChance ? "#ea580c" : "#ca8a04";
  const Icon = isChance ? HelpCircle : Gift;
  const label = t(isChance ? "card.deck.CHANCE" : "card.deck.COMMUNITY_CHEST");
  return (
    <div className={cn("absolute pointer-events-none select-none", className)}>
      {/* white frame / slot the deck sits in */}
      <div className="relative w-[38%] min-w-[110px] max-w-[220px] aspect-[3/4] rounded-lg bg-white/85 shadow-lg ring-1 ring-black/10 p-[10%]" style={{ rotate: `${tilt}deg` }}>
        <div className="relative w-full h-full">
          {/* stacked backs */}
          <div className="absolute inset-0 rounded-md bg-white rotate-6 shadow-md" />
          <div className="absolute inset-0 rounded-md bg-white -rotate-3 shadow-md" />
          {/* top card */}
          <div className="absolute inset-0 rounded-md shadow-lg flex flex-col items-center justify-center gap-1 text-white ring-1 ring-black/10" style={{ backgroundColor: color }}>
            <Icon className="w-[42%] h-[42%]" strokeWidth={2.25} />
            <span className="text-[8px] sm:text-[10px] font-bold tracking-tight leading-none text-center px-1 uppercase">{label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  onSpaceClick: (index: number) => void;
}

export default function GameBoard({ onSpaceClick }: Props) {
  const players = useGame((s) => s.players);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);

  // Layout: 11 columns x 11 rows = 121 cells, but corners shared
  // Bottom row (10 spaces + 2 corners): 0(GO) - 1-9 - 10(Jail)
  // Left column: 10 - 11-19 - 20(Free Parking) - going up
  // Top row: 20 - 21-29 - 30(GoToJail)
  // Right column: 30 - 31-39 - 0(GO)
  // We'll lay out as 11x11 grid

  return (
    <div className="relative w-full aspect-[15/11] mx-auto bg-emerald-700 p-1.5 sm:p-2 rounded-lg shadow-2xl border-2 sm:border-4 border-emerald-900">
      {/* Board is wider than tall so the top/bottom tiles get more width. The
          side-column tracks are kept modest so the side tiles stay about the
          same while the extra width flows into the middle (top/bottom) tiles. */}
      <div
        className="grid w-full h-full gap-0"
        style={{
          gridTemplateColumns: "1.3fr repeat(9, 1fr) 1.3fr",
          gridTemplateRows: "1.35fr repeat(9, 1fr) 1.35fr",
        }}
      >
        {/* Row 0 (top): indices 20, 21, 22, ..., 30 - top row */}
        <div className="col-span-1 row-span-1 min-h-0 min-w-0"><BoardSpace spaceIndex={20} orientation="top" onSpaceClick={onSpaceClick} /></div>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={`top-${i}`} className="col-span-1 row-span-1 min-h-0 min-w-0">
            <BoardSpace spaceIndex={21 + i} orientation="top" onSpaceClick={onSpaceClick} />
          </div>
        ))}
        <div className="col-span-1 row-span-1 min-h-0 min-w-0"><BoardSpace spaceIndex={30} orientation="top" onSpaceClick={onSpaceClick} /></div>

        {/* Middle rows (rows 1-9): right column has 31..39 going down, left column has 19..11 going down */}
        {Array.from({ length: 9 }).map((_, rowIdx) => {
          const leftIdx = 19 - rowIdx;
          const rightIdx = 31 + rowIdx;
          return (
            <div key={`mid-${rowIdx}`} className="contents">
              <div className="col-span-1 row-span-1 min-h-0 min-w-0">
                <BoardSpace spaceIndex={leftIdx} orientation="left" onSpaceClick={onSpaceClick} />
              </div>
              {/* Center area spanning 9 columns */}
              {rowIdx === 0 && (
                <div className="col-span-9 row-span-9 relative bg-emerald-600 min-h-0 min-w-0 overflow-hidden">
                  {/* soft radial highlight */}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(255,255,255,0.12), rgba(0,0,0,0.06) 78%)" }} />
                  {/* faint diagonal weave */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 2px, transparent 2px, transparent 16px)" }} />
                  {/* inner frame accent */}
                  <div className="absolute inset-2 sm:inset-4 pointer-events-none rounded-xl border border-white/15" />
                  {/* card decks, centered on the left & right edges so they don't
                      sit under the control buttons */}
                  <CardDeck kind="CC" tilt={-10} className="top-1/2 -translate-y-1/2 left-[13%]" />
                  <CardDeck kind="CHANCE" tilt={10} className="top-1/2 -translate-y-1/2 right-[13%]" />
                  {/* control (scrolls if the jail buttons need it) */}
                  <div className="absolute inset-0 flex items-start justify-center p-1.5 sm:p-3 overflow-y-auto scrollbar-thin">
                    <GameControl />
                  </div>
                </div>
              )}
              <div className="col-span-1 row-span-1 min-h-0 min-w-0">
                <BoardSpace spaceIndex={rightIdx} orientation="right" onSpaceClick={onSpaceClick} />
              </div>
            </div>
          );
        })}

        {/* Bottom row: GO (0) at bottom-right, 1..9 going left-to-right from corner 10 */}
        <div className="col-span-1 row-span-1 min-h-0 min-w-0"><BoardSpace spaceIndex={10} orientation="bottom" onSpaceClick={onSpaceClick} /></div>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={`bot-${i}`} className="col-span-1 row-span-1 min-h-0 min-w-0">
            <BoardSpace spaceIndex={9 - i} orientation="bottom" onSpaceClick={onSpaceClick} />
          </div>
        ))}
        <div className="col-span-1 row-span-1 min-h-0 min-w-0"><BoardSpace spaceIndex={0} orientation="bottom" onSpaceClick={onSpaceClick} /></div>
      </div>
    </div>
  );
}
