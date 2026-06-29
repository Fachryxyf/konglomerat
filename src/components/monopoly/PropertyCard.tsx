"use client";

import { useGame } from "@/lib/monopoly/gameStore";
import { getColorHex, getPrice, getMortgageValue } from "@/lib/monopoly/utils";
import { COLOR_SETS } from "@/lib/monopoly/boardData";
import type { BoardSpace, PropertySpace, RailroadSpace, UtilitySpace } from "@/lib/monopoly/types";
import { cn } from "@/lib/utils";
import { Lock, Hotel, Home, Check, Train, Lightbulb, type LucideIcon } from "lucide-react";

function typeIcon(space: BoardSpace): LucideIcon {
  if (space.type === "RAILROAD") return Train;
  if (space.type === "UTILITY") return Lightbulb;
  return Home;
}

interface Props {
  spaceIndex: number;
  compact?: boolean;
  onClick?: () => void;
}

export default function PropertyCard({ spaceIndex, compact = false, onClick }: Props) {
  const space = useGame((s) => s.board[spaceIndex]);
  const ownership = useGame((s) => s.ownership[spaceIndex]);
  const buildings = useGame((s) => s.buildings[spaceIndex]);
  const players = useGame((s) => s.players);

  if (!space) return null;
  if (!isPurchasable(space)) return null;

  const owner = ownership?.ownerId !== null && ownership?.ownerId !== undefined ? players[ownership.ownerId] : null;
  const isMortgaged = ownership?.mortgaged ?? false;
  const colorHex = getColorBar(space);
  const price = getPrice(space);

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "relative rounded-md overflow-hidden border-2 shadow-sm hover:shadow-md transition text-left w-full",
          isMortgaged && "opacity-60",
        )}
        style={{ borderColor: colorHex }}
      >
        <div className="text-white text-center py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ backgroundColor: colorHex }}>
          {space.type === "PROPERTY" ? "Title Deed" : space.type === "RAILROAD" ? "Railroad" : "Utility"}
        </div>
        <div className="p-1.5 bg-white dark:bg-zinc-900">
          <div className="text-[10px] font-semibold leading-tight line-clamp-2 text-zinc-800 dark:text-zinc-200">
            {space.name}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <div className="text-[10px] text-zinc-600 dark:text-zinc-400">${price}</div>
            {buildings && (buildings.houses > 0 || buildings.hotel) && (
              <div className="text-[9px] flex items-center gap-0.5">
                {buildings.hotel ? <Hotel className="w-3 h-3 text-red-600" /> : <><Home className="w-3 h-3 text-emerald-600" />{buildings.houses}</>}
              </div>
            )}
          </div>
          {owner && (
            <div className="mt-1 flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: owner.color }}
              />
              <div className="text-[9px] text-zinc-500 truncate">{owner.name}</div>
              {isMortgaged && <div className="text-[9px] text-red-500 font-bold">GADAI</div>}
            </div>
          )}
          {!owner && (
            <div className="mt-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-0.5"><Check className="w-2.5 h-2.5" /> Tersedia</div>
          )}
        </div>
      </button>
    );
  }

  // Full card
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-lg overflow-hidden border-2 shadow-md transition w-full bg-white dark:bg-zinc-900",
        onClick && "cursor-pointer hover:shadow-lg hover:-translate-y-0.5",
        isMortgaged && "opacity-70",
      )}
      style={{ borderColor: colorHex }}
    >
      {/* Color bar header */}
      <div className="text-white text-center py-1.5 px-2 font-bold uppercase tracking-wide" style={{ backgroundColor: colorHex }}>
        <div className="text-[10px] opacity-90">
          {space.type === "PROPERTY" ? "Title Deed" : space.type === "RAILROAD" ? "Railroad" : "Utility"}
        </div>
        <div className="text-xs sm:text-sm">{space.name}</div>
      </div>

      {/* Emblem band — the property "crest" */}
      <div
        className="relative flex items-center justify-center py-3"
        style={{ backgroundColor: `${colorHex}22` }}
      >
        <div
          className="flex items-center justify-center w-12 h-12 rounded-full shadow-inner"
          style={{ backgroundColor: colorHex }}
        >
          {(() => { const Icon = typeIcon(space); return <Icon className="w-6 h-6 text-white" />; })()}
        </div>
      </div>

      {/* Body */}
      <div className="p-2.5 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
        {/* Rent details */}
        {space.type === "PROPERTY" && (
          <RentTable prop={space as PropertySpace} houses={buildings?.houses ?? 0} hotel={buildings?.hotel ?? false} />
        )}
        {space.type === "RAILROAD" && <RailroadRentTable rr={space as RailroadSpace} />}
        {space.type === "UTILITY" && <UtilityRentTable util={space as UtilitySpace} />}

        {/* Footer info */}
        <div className="border-t mt-2 pt-2 space-y-0.5 text-[10px] text-zinc-600 dark:text-zinc-400">
          {space.type === "PROPERTY" && (
            <>
              <div className="flex justify-between">
                <span>Harga Rumah / Hotel:</span>
                <span className="font-medium">${(space as PropertySpace).housePrice} masing-masing</span>
              </div>
              <div className="flex justify-between">
                <span>Jual bangunan:</span>
                <span className="font-medium">${Math.floor((space as PropertySpace).housePrice / 2)} / unit (½ harga)</span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span>Nilai Gadai:</span>
            <span className="font-medium">${getMortgageValue(space)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tebus Gadai (+10%):</span>
            <span className="font-medium">${Math.ceil(getMortgageValue(space) * 1.1)}</span>
          </div>
          <div className="flex justify-between font-bold text-xs pt-1 border-t mt-1">
            <span>Harga Beli:</span>
            <span className="text-emerald-600 dark:text-emerald-400">${price}</span>
          </div>
        </div>

        {/* Owner status badge */}
        <div className="mt-2 pt-2 border-t">
          {owner ? (
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium",
              isMortgaged ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300" : "bg-zinc-100 dark:bg-zinc-800",
            )}>
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: owner.color }} />
              <span className="truncate">{owner.token} {owner.name}</span>
              {isMortgaged && <span className="ml-auto font-bold inline-flex items-center gap-0.5"><Lock className="w-3 h-3" /> GADAI</span>}
              {buildings && buildings.hotel && <span className="ml-auto inline-flex items-center gap-0.5"><Hotel className="w-3 h-3 text-red-600" /> Hotel</span>}
              {buildings && !buildings.hotel && buildings.houses > 0 && (
                <span className="ml-auto inline-flex items-center gap-0.5"><Home className="w-3 h-3 text-emerald-600" /> {buildings.houses} rumah</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
              <Check className="w-3 h-3" />
              <span>Tersedia (bisa dibeli/lelang)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RentTable({ prop, houses, hotel }: { prop: PropertySpace; houses: number; hotel: boolean }) {
  const rents = prop.rent;
  const isMonopolyBonus = houses === 0 && !hotel; // Show "2x jika monopoli" hint
  return (
    <div className="text-[10px] space-y-0.5">
      <div className={cn("flex justify-between", houses === 0 && !hotel && "bg-yellow-100 dark:bg-yellow-950/40 -mx-1 px-1 rounded")}>
        <span>Sewa Dasar{isMonopolyBonus && " (2x monopoli)"}:</span>
        <span className="font-medium">${rents[0]}{isMonopolyBonus && " → $"}{isMonopolyBonus && rents[0] * 2}</span>
      </div>
      <div className={cn("flex justify-between", houses === 1 && "bg-yellow-100 dark:bg-yellow-950/40 -mx-1 px-1 rounded")}>
        <span>dengan 1 Rumah:</span>
        <span className="font-medium">${rents[1]}</span>
      </div>
      <div className={cn("flex justify-between", houses === 2 && "bg-yellow-100 dark:bg-yellow-950/40 -mx-1 px-1 rounded")}>
        <span>dengan 2 Rumah:</span>
        <span className="font-medium">${rents[2]}</span>
      </div>
      <div className={cn("flex justify-between", houses === 3 && "bg-yellow-100 dark:bg-yellow-950/40 -mx-1 px-1 rounded")}>
        <span>dengan 3 Rumah:</span>
        <span className="font-medium">${rents[3]}</span>
      </div>
      <div className={cn("flex justify-between", houses === 4 && "bg-yellow-100 dark:bg-yellow-950/40 -mx-1 px-1 rounded")}>
        <span>dengan 4 Rumah:</span>
        <span className="font-medium">${rents[4]}</span>
      </div>
      <div className={cn("flex justify-between font-semibold", hotel && "bg-yellow-100 dark:bg-yellow-950/40 -mx-1 px-1 rounded")}>
        <span>dengan HOTEL:</span>
        <span>${rents[5]}</span>
      </div>
    </div>
  );
}

function RailroadRentTable({ rr }: { rr: RailroadSpace }) {
  return (
    <div className="text-[10px] space-y-0.5">
      <div className="flex justify-between"><span>Sewa (1 stasiun):</span><span className="font-medium">${rr.rent[0]}</span></div>
      <div className="flex justify-between"><span>Sewa (2 stasiun):</span><span className="font-medium">${rr.rent[1]}</span></div>
      <div className="flex justify-between"><span>Sewa (3 stasiun):</span><span className="font-medium">${rr.rent[2]}</span></div>
      <div className="flex justify-between"><span>Sewa (4 stasiun):</span><span className="font-medium">${rr.rent[3]}</span></div>
    </div>
  );
}

function UtilityRentTable({ util }: { util: UtilitySpace }) {
  return (
    <div className="text-[10px] space-y-0.5">
      <div>Jika pemilik punya <strong>1 utilitas</strong>:</div>
      <div className="ml-2">Sewa = <strong>{util.multiplier[0]}x</strong> angka dadu</div>
      <div className="mt-1">Jika pemilik punya <strong>2 utilitas</strong>:</div>
      <div className="ml-2">Sewa = <strong>{util.multiplier[1]}x</strong> angka dadu</div>
    </div>
  );
}

function isPurchasable(space: BoardSpace): boolean {
  return space.type === "PROPERTY" || space.type === "RAILROAD" || space.type === "UTILITY";
}

function getColorBar(space: BoardSpace): string {
  if (space.type === "PROPERTY") {
    return getColorHex((space as PropertySpace).colorSet);
  }
  if (space.type === "RAILROAD") return "#1f2937";
  if (space.type === "UTILITY") return "#6b7280";
  return "#888";
}

// Get all purchasable space indices (28 total: 22 property + 4 railroad + 2 utility)
export const ALL_PURCHASABLE_INDICES = (() => {
  // Import BOARD dynamically to avoid circular dep
  const indices: number[] = [];
  // We hardcode based on standard monopoly board
  return [1, 3, 5, 6, 8, 9, 11, 12, 13, 14, 15, 16, 18, 19, 21, 23, 24, 25, 26, 27, 28, 29, 31, 32, 34, 35, 37, 39];
})();

export function getColorSetSpaces(colorSet: string): number[] {
  return COLOR_SETS[colorSet] || [];
}
