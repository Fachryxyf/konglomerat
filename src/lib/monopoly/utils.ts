import { BOARD, COLOR_SETS, COLOR_HEX, JAIL_INDEX, getPrice, getMortgageValue } from "./boardData";
import { rng } from "./rng";
import type { BoardSpace, ColorSet, GameState, Player } from "./types";

// Re-export for convenience
export { getPrice, getMortgageValue };

export function getSpace(index: number): BoardSpace {
  return BOARD[((index % 40) + 40) % 40];
}

export function getColorSetSpaces(colorSet: ColorSet): number[] {
  return COLOR_SETS[colorSet] || [];
}

export function getColorHex(colorSet: string): string {
  return COLOR_HEX[colorSet] || "#888";
}

export function rollDice(): { die1: number; die2: number; isDoubles: boolean; total: number } {
  const die1 = Math.floor(rng() * 6) + 1;
  const die2 = Math.floor(rng() * 6) + 1;
  return { die1, die2, isDoubles: die1 === die2, total: die1 + die2 };
}

export function getOwnedColorSets(state: GameState, playerId: number): ColorSet[] {
  const owned: ColorSet[] = [];
  for (const [setName, indices] of Object.entries(COLOR_SETS)) {
    if (indices.every((idx) => state.ownership[idx]?.ownerId === playerId)) {
      owned.push(setName as ColorSet);
    }
  }
  return owned;
}

export function hasMonopoly(state: GameState, playerId: number, spaceIndex: number): boolean {
  const space = getSpace(spaceIndex);
  if (space.type !== "PROPERTY") return false;
  const colorSet = (space as { colorSet: ColorSet }).colorSet;
  const indices = getColorSetSpaces(colorSet);
  return indices.every((idx) => state.ownership[idx]?.ownerId === playerId);
}

export function countRailroads(state: GameState, playerId: number): number {
  let count = 0;
  for (const space of BOARD) {
    if (space.type === "RAILROAD" && state.ownership[space.index]?.ownerId === playerId) {
      count++;
    }
  }
  return count;
}

export function countUtilities(state: GameState, playerId: number): number {
  let count = 0;
  for (const space of BOARD) {
    if (space.type === "UTILITY" && state.ownership[space.index]?.ownerId === playerId) {
      count++;
    }
  }
  return count;
}

export function calculateRent(
  state: GameState,
  spaceIndex: number,
  diceTotal: number,
  multiplier: number = 1,
): number {
  const space = getSpace(spaceIndex);
  const ownership = state.ownership[spaceIndex];
  if (!ownership || ownership.ownerId === null || ownership.mortgaged) return 0;

  const ownerId = ownership.ownerId;
  // Read houses/hotel from buildings state (source of truth for buildings)
  const buildings = state.buildings[spaceIndex] || { houses: 0, hotel: false };
  const houses = buildings.houses;
  const hasHotel = buildings.hotel;

  if (space.type === "PROPERTY") {
    const prop = space as { rent: number[]; colorSet: ColorSet };
    if (hasHotel) {
      return prop.rent[5] * multiplier;
    }
    const baseRent = prop.rent[houses] * multiplier;
    // Double rent for monopoly with no buildings
    if (
      houses === 0 &&
      !hasHotel &&
      hasMonopoly(state, ownerId, spaceIndex)
    ) {
      return baseRent * 2;
    }
    return baseRent;
  }

  if (space.type === "RAILROAD") {
    const rr = space as { rent: number[] };
    const count = countRailroads(state, ownerId);
    return rr.rent[count - 1] * multiplier;
  }

  if (space.type === "UTILITY") {
    const util = space as { multiplier: number[] };
    const count = countUtilities(state, ownerId);
    const mult = count === 2 ? util.multiplier[1] : util.multiplier[0];
    return mult * diceTotal * (multiplier > 1 ? multiplier / 10 : 1);
    // When card forces 10x, multiplier=10; we apply as: util.multiplier[count-1] * diceTotal * (10/util.multiplier[count-1])
  }

  return 0;
}

export function calculateUtilityRent(state: GameState, spaceIndex: number, diceTotal: number, forceMultiplier?: number): number {
  const space = getSpace(spaceIndex);
  if (space.type !== "UTILITY") return 0;
  const ownership = state.ownership[spaceIndex];
  if (!ownership || ownership.ownerId === null || ownership.mortgaged) return 0;
  const util = space as { multiplier: number[] };
  const count = countUtilities(state, ownership.ownerId);
  if (forceMultiplier) {
    return forceMultiplier * diceTotal;
  }
  const mult = count === 2 ? util.multiplier[1] : util.multiplier[0];
  return mult * diceTotal;
}

export function getNetWorth(state: GameState, playerId: number): number {
  const player = state.players[playerId];
  if (!player) return 0;
  let total = player.balance;
  for (const idx of player.properties) {
    const space = getSpace(idx);
    const ownership = state.ownership[idx];
    if (!ownership) continue;
    const value =
      space.type === "PROPERTY"
        ? (space as { price: number }).price
        : space.type === "RAILROAD"
        ? (space as { price: number }).price
        : (space as { price: number }).price;
    if (ownership.mortgaged) {
      total += Math.floor(value / 2);
    } else {
      total += value;
    }
    const buildings = state.buildings[idx];
    if (buildings) {
      const housePrice =
        space.type === "PROPERTY" ? (space as { housePrice: number }).housePrice : 0;
      total += (buildings.houses + (buildings.hotel ? 5 : 0)) * housePrice;
    }
  }
  return total;
}

export function countPlayerBuildings(state: GameState, playerId: number): { houses: number; hotels: number } {
  let houses = 0;
  let hotels = 0;
  const player = state.players[playerId];
  if (!player) return { houses, hotels };
  for (const idx of player.properties) {
    const b = state.buildings[idx];
    if (b) {
      houses += b.houses;
      if (b.hotel) hotels++;
    }
  }
  return { houses, hotels };
}

export function getNextActivePlayer(state: GameState): number {
  const total = state.players.length;
  let next = (state.currentPlayerIndex + 1) % total;
  let attempts = 0;
  while (state.players[next].bankrupt && attempts < total) {
    next = (next + 1) % total;
    attempts++;
  }
  return next;
}

export function activePlayerCount(state: GameState): number {
  return state.players.filter((p) => !p.bankrupt).length;
}

export function findWinner(state: GameState): number | null {
  const active = state.players.filter((p) => !p.bankrupt);
  if (active.length === 1 && state.players.length > 1) {
    return active[0].id;
  }
  return null;
}

export function nearestSpaceIndex(from: number, type: "RAILROAD" | "UTILITY"): number {
  for (let i = 1; i <= 40; i++) {
    const idx = (from + i) % 40;
    if (BOARD[idx].type === type) return idx;
  }
  return from;
}

export function didPassGo(from: number, to: number): boolean {
  // moving forward and either we wrapped, or just moved forward normally
  if (to < from) return true; // wrapped past 39 to 0+
  return false;
}

export function movePlayer(from: number, steps: number): { to: number; passedGo: boolean } {
  const raw = from + steps;
  const to = ((raw % 40) + 40) % 40;
  const passedGo = steps > 0 && raw >= 40;
  return { to, passedGo };
}

export function moveTo(from: number, target: number): { to: number; passedGo: boolean } {
  // Move forward to target. If target <= from, we passed GO.
  const passedGo = target < from;
  return { to: target, passedGo };
}
