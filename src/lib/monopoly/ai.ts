import type { AIDifficulty, GameState } from "./types";
import { rng } from "./rng";
import { getSpace, hasMonopoly, getColorSetSpaces, countRailroads } from "./utils";
import { COLOR_SETS, getPrice } from "./boardData";
import { creditLimit, totalDebt, loanInterestRate, LOAN_TERMS } from "./bank";
import { BRIBE_GUARD_COST, LOBBY_COST } from "./government";

// ===== Shared strategic helpers =====

// Ownership breakdown of a property's colour set, from `playerId`'s perspective.
function setInfo(state: GameState, playerId: number, spaceIndex: number) {
  const space = getSpace(spaceIndex);
  const colorSet = (space as { colorSet: string }).colorSet;
  const setIndices = COLOR_SETS[colorSet] || [];
  const total = setIndices.length;
  const ownedInSet = setIndices.filter((idx) => state.ownership[idx]?.ownerId === playerId).length;
  const othersOwned = setIndices.filter((idx) => {
    const o = state.ownership[idx];
    return o && o.ownerId !== null && o.ownerId !== playerId;
  }).length;
  return { colorSet, setIndices, total, ownedInSet, othersOwned };
}

// High-traffic colour sets land-on most often → worth a richer price.
function isHotSet(colorSet: string): boolean {
  return colorSet === "Orange" || colorSet === "Red" || colorSet === "Yellow" || colorSet === "LightBlue";
}

// Strategic worth of a space to a buyer, as a multiple of its face price. Used by
// both the buy and auction logic so Hard pays up only for what actually helps it
// (completing/advancing monopolies, railroads) and ignores dead, contested sets.
export function strategicValue(state: GameState, playerId: number, spaceIndex: number): number {
  const space = getSpace(spaceIndex);
  if (space.type === "RAILROAD") {
    const owned = countRailroads(state, playerId);
    return [0.85, 1.0, 1.15, 1.3][Math.min(owned, 3)]; // more valuable as the set grows
  }
  if (space.type === "UTILITY") return 0.5; // weak asset, never overpay
  if (space.type === "PROPERTY") {
    const { total, ownedInSet, othersOwned } = setInfo(state, playerId, spaceIndex);
    if (othersOwned === 0) {
      if (ownedInSet === total - 1) return 1.6; // completes a monopoly → premium
      if (ownedInSet > 0) return 1.1; // advances an uncontested set
      return isHotSet((space as { colorSet: string }).colorSet) ? 0.8 : 0.6; // open set
    }
    // Contested set: only worth a denial buy when the rival is one tile from a
    // monopoly; otherwise it's a dead property the AI can never complete.
    if (ownedInSet === 0 && othersOwned === total - 1) return 0.5;
    return 0; // dead — skip
  }
  return 0;
}

// Cash cushion Hard keeps in reserve: a base plus the opponents' current rent
// threat, so it never spends itself into a single-rent bankruptcy. Scales with
// the game (thin boards keep ~60, developed boards demand much more).
function hardReserve(state: GameState, playerId: number): number {
  return 60 + opponentThreat(state, playerId);
}

// ===== AI Decision Functions (Difficulty-based) =====

/**
 * Decide whether AI should buy the property it landed on.
 * Returns true to buy, false to decline (triggers auction).
 */
export function aiShouldBuyProperty(
  state: GameState & { players: GameState["players"] },
  playerId: number,
  spaceIndex: number,
): boolean {
  const player = state.players[playerId];
  if (!player) return false;
  const space = getSpace(spaceIndex);
  const price = getPrice(space);
  if (player.balance < price) return false;

  switch (player.difficulty) {
    case "EASY":
      return aiShouldBuyEasy(state, playerId, spaceIndex);
    case "HARD":
      return aiShouldBuyHard(state, playerId, spaceIndex);
    case "MEDIUM":
    default:
      return aiShouldBuyMedium(state, playerId, spaceIndex);
  }
}

// ===== EASY AI =====
// - Buys ~60% of properties randomly
// - Rarely considers color set completion
// - Often declines expensive properties
function aiShouldBuyEasy(
  state: GameState & { players: GameState["players"] },
  playerId: number,
  spaceIndex: number,
): boolean {
  const player = state.players[playerId];
  const space = getSpace(spaceIndex);
  const price = getPrice(space);

  // Always decline if it would leave less than $100
  if (player.balance - price < 100) return false;

  // 70% chance to decline expensive properties (>$200)
  if (price > 200 && rng() < 0.7) return false;

  // 60% chance to buy otherwise
  return rng() < 0.6;
}

// ===== MEDIUM AI (default, balanced) =====
// - Buys if: balance > price + $200 reserve
// - Always buys railroads (good value)
// - Always buys if it completes a color set
// - Buys utilities only if balance > price + $300
// - Declines if buying would leave < $200
function aiShouldBuyMedium(
  state: GameState & { players: GameState["players"] },
  playerId: number,
  spaceIndex: number,
): boolean {
  const player = state.players[playerId];
  const space = getSpace(spaceIndex);
  const price = getPrice(space);

  // Keep $200 reserve
  if (player.balance - price < 120) return false;

  // Always buy railroads (consistent income)
  if (space.type === "RAILROAD") return true;

  // Buy utilities only with bigger reserve
  if (space.type === "UTILITY") {
    return player.balance - price > 300;
  }

  // For properties: check color set status
  if (space.type === "PROPERTY") {
    const colorSet = (space as { colorSet: string }).colorSet;
    const setIndices = COLOR_SETS[colorSet] || [];
    const ownedInSet = setIndices.filter((idx) => state.ownership[idx]?.ownerId === playerId).length;
    const othersOwned = setIndices.filter((idx) => {
      const o = state.ownership[idx];
      return o && o.ownerId !== null && o.ownerId !== playerId;
    }).length;

    // If buying completes the set → definitely buy
    if (ownedInSet === setIndices.length - 1 && othersOwned === 0) return true;

    // If we already own 1+ in set and no one else owns → buy to build toward monopoly
    if (ownedInSet > 0 && othersOwned === 0) return true;

    // If others own part of set → buy to block their monopoly
    if (othersOwned > 0 && ownedInSet === 0) {
      // Only block if affordable
      return player.balance - price > 300;
    }

    // Otherwise: buy if price is reasonable relative to balance
    return price < player.balance * 0.4;
  }

  return false;
}

// ===== HARD AI (aggressive but disciplined) =====
// Buys with PURPOSE, not reflex: chases monopolies and railroads, denies rivals
// only when it's worth it, and skips dead/contested sets it can never complete.
// Keeps a threat-scaled cash cushion so it doesn't bankrupt itself — the old
// version spent down to ~$100 and died first, especially on a $300 start.
function aiShouldBuyHard(
  state: GameState & { players: GameState["players"] },
  playerId: number,
  spaceIndex: number,
): boolean {
  const player = state.players[playerId];
  const space = getSpace(spaceIndex);
  const price = getPrice(space);
  const after = player.balance - price;
  const reserve = hardReserve(state, playerId);
  const value = strategicValue(state, playerId, spaceIndex);

  // Worthless here (dead contested set, weak utility with no money) → skip.
  if (value <= 0) return false;

  if (space.type === "PROPERTY") {
    const { total, ownedInSet, othersOwned } = setInfo(state, playerId, spaceIndex);

    // Completing a monopoly is the whole game — take it even on a thin wallet
    // (it can mortgage/sell elsewhere afterwards), keeping only a tiny buffer.
    if (othersOwned === 0 && ownedInSet === total - 1) return after > -reserve * 0.4;

    // Advancing an uncontested set: buy with a modest cushion.
    if (othersOwned === 0 && ownedInSet > 0) return after > reserve * 0.6;

    // A denial buy against a rival one tile from a monopoly: only when flush.
    if (othersOwned === total - 1 && ownedInSet === 0) return after > reserve + 80;

    // A fresh, open set: worth it for high-traffic colours, pickier otherwise.
    if (othersOwned === 0 && ownedInSet === 0) {
      const need = isHotSet((space as { colorSet: string }).colorSet) ? reserve : reserve + 50;
      return after > need;
    }
    return false;
  }

  if (space.type === "RAILROAD") {
    // Railroads compound; get keener as the set grows, but still keep a cushion.
    const owned = countRailroads(state, playerId);
    return after > reserve - owned * 25;
  }

  if (space.type === "UTILITY") {
    // Low priority — only when comfortably ahead.
    return after > reserve + 60;
  }

  return false;
}

// ===== Jail Decision =====
export function aiJailDecision(state: GameState, playerId: number): "PAY" | "CARD" | "ROLL" {
  const player = state.players[playerId];
  if (!player) return "ROLL";

  switch (player.difficulty) {
    case "EASY":
      // Easy: mostly rolls, sometimes pays
      if (player.getOutOfJailCards > 0 && player.jailTurns >= 2 && rng() < 0.5) return "CARD";
      if (player.balance > 200 && rng() < 0.3) return "PAY";
      return "ROLL";
    case "HARD":
      // Hard: pays early if has properties to develop, uses card strategically
      // Early game: roll to save money. Late game: pay to keep momentum.
      const turnNumber = state.turn;
      const ownsMonopoly = player.properties.some((idx) => hasMonopoly(state, playerId, idx));
      // If has monopoly and money, pay to get out and develop
      if (ownsMonopoly && player.balance > 200) return "PAY";
      // If late game (turn > 20) and can afford, pay to keep moving
      if (turnNumber > 20 && player.balance > 100) return "PAY";
      // Use card if available and turn 2+ in jail
      if (player.getOutOfJailCards > 0 && player.jailTurns >= 1) return "CARD";
      // Otherwise roll
      return "ROLL";
    case "MEDIUM":
    default:
      // Medium: use card if jailed 2+ turns, pay if has money
      if (player.getOutOfJailCards > 0 && player.jailTurns >= 2) return "CARD";
      if (player.balance > 200) return "PAY";
      return "ROLL";
  }
}

// ===== Auction Bidding =====
export function aiAuctionBid(state: GameState, playerId: number, currentBid: number): number {
  const player = state.players[playerId];
  if (!player) return 0;
  const propertyIndex = state.auction.propertyIndex;
  if (propertyIndex === null) return 0;
  const space = getSpace(propertyIndex);
  const price = getPrice(space);

  switch (player.difficulty) {
    case "EASY": {
      // Easy: rarely bids, max 50% of price
      const maxBid = Math.floor(price * 0.5);
      if (currentBid >= maxBid) return 0;
      if (rng() < 0.4) return 0; // 40% chance to skip
      const nextBid = currentBid + Math.max(10, Math.floor(price * 0.05));
      return nextBid > player.balance ? 0 : nextBid;
    }
    case "HARD": {
      // Hard bids by STRATEGIC value, not blindly: it pays a premium for
      // monopoly-completers and railroads, stays cheap on open sets, and refuses
      // dead/contested ones. It always keeps a threat-scaled cash reserve, so it
      // never bids itself to $0 over a property it doesn't need.
      const value = strategicValue(state, playerId, propertyIndex);
      if (value <= 0) return 0; // not worth winning
      const reserve = hardReserve(state, playerId);
      const maxAffordable = player.balance - reserve;
      const maxBid = Math.min(Math.floor(price * value), maxAffordable);
      if (maxBid < 10 || currentBid >= maxBid) return 0;
      // Push harder (bigger increments) on genuinely strategic lots.
      const strategic = value >= 1.0;
      const nextBid = currentBid + Math.max(10, Math.floor(price * (strategic ? 0.1 : 0.05)));
      return nextBid > maxBid ? 0 : nextBid;
    }
    case "MEDIUM":
    default: {
      // Medium: bids up to 80% of price
      const maxBid = Math.floor(price * 0.8);
      if (currentBid >= maxBid) return 0;
      const nextBid = currentBid + Math.max(10, Math.floor(price * 0.05));
      return nextBid > player.balance ? 0 : nextBid;
    }
  }
}

// How dangerous the opponents' developed properties are right now. The AI keeps
// a bigger cash cushion before building when rivals already have houses/hotels,
// so it doesn't develop itself straight into bankruptcy on the next rent hit.
function opponentThreat(state: GameState, playerId: number): number {
  let houses = 0;
  let hotels = 0;
  for (const space of state.board) {
    if (space.type !== "PROPERTY") continue;
    const o = state.ownership[space.index];
    if (!o || o.ownerId === null || o.ownerId === playerId || o.mortgaged) continue;
    const b = state.buildings[space.index];
    if (!b) continue;
    houses += b.houses;
    if (b.hotel) hotels += 1;
  }
  return Math.min(280, houses * 15 + hotels * 90);
}

// ===== Building Decision =====
export function aiShouldBuild(
  state: GameState,
  playerId: number,
): { spaceIndex: number; action: "HOUSE" | "HOTEL"; count?: number } | null {
  const player = state.players[playerId];
  if (!player) return null;

  switch (player.difficulty) {
    case "EASY":
      return aiShouldBuildEasy(state, playerId);
    case "HARD":
      return aiShouldBuildHard(state, playerId);
    case "MEDIUM":
    default:
      return aiShouldBuildMedium(state, playerId);
  }
}

function aiShouldBuildEasy(
  state: GameState,
  playerId: number,
): { spaceIndex: number; action: "HOUSE" | "HOTEL"; count?: number } | null {
  const player = state.players[playerId];
  // Easy: builds when comfortably ahead (lower bar than before so houses/hotels
  // actually appear in games).
  if (player.balance < 180) return null;
  // ~65% chance to consider building each turn if possible.
  if (rng() < 0.35) return null;
  const threat = opponentThreat(state, playerId);

  for (const idx of player.properties) {
    const space = getSpace(idx);
    if (space.type !== "PROPERTY") continue;
    if (!hasMonopoly(state, playerId, idx)) continue;
    const buildings = state.buildings[idx] || { houses: 0, hotel: false };
    if (buildings.hotel) continue;
    const prop = space as { housePrice: number };
    if (buildings.houses === 4 && player.balance > prop.housePrice + 90 + threat && state.bank.hotels > 0) {
      return { spaceIndex: idx, action: "HOTEL" };
    }
    if (buildings.houses < 4 && player.balance > prop.housePrice + 90 + threat && state.bank.houses > 0) {
      // Check even build rule
      const colorSet = (space as { colorSet: string }).colorSet;
      const setIndices = getColorSetSpaces(colorSet as "Brown" | "LightBlue" | "Pink" | "Orange" | "Red" | "Yellow" | "Green" | "DarkBlue");
      let canBuild = true;
      for (const sIdx of setIndices) {
        if (sIdx === idx) continue;
        const otherB = state.buildings[sIdx] || { houses: 0, hotel: false };
        if (otherB.hotel) { canBuild = false; break; }
        if (otherB.houses < buildings.houses) { canBuild = false; break; }
      }
      if (canBuild) return { spaceIndex: idx, action: "HOUSE" };
    }
  }
  return null;
}

function aiShouldBuildMedium(
  state: GameState,
  playerId: number,
): { spaceIndex: number; action: "HOUSE" | "HOTEL"; count?: number } | null {
  const player = state.players[playerId];
  // Medium: builds when has monopoly and decent reserve
  if (player.balance < 150) return null;
  const threat = opponentThreat(state, playerId);

  for (const idx of player.properties) {
    const space = getSpace(idx);
    if (space.type !== "PROPERTY") continue;
    if (!hasMonopoly(state, playerId, idx)) continue;
    const buildings = state.buildings[idx] || { houses: 0, hotel: false };
    if (buildings.hotel) continue;
    const prop = space as { housePrice: number; colorSet: string };
    if (buildings.houses === 4 && player.balance > prop.housePrice + 100 + threat && state.bank.hotels > 0) {
      return { spaceIndex: idx, action: "HOTEL" };
    }
    if (buildings.houses < 4 && player.balance > prop.housePrice + 100 + threat && state.bank.houses > 0) {
      const setIndices = getColorSetSpaces(prop.colorSet as "Brown" | "LightBlue" | "Pink" | "Orange" | "Red" | "Yellow" | "Green" | "DarkBlue");
      let canBuild = true;
      for (const sIdx of setIndices) {
        if (sIdx === idx) continue;
        const otherB = state.buildings[sIdx] || { houses: 0, hotel: false };
        if (otherB.hotel) { canBuild = false; break; }
        if (otherB.houses < buildings.houses) { canBuild = false; break; }
      }
      if (canBuild) return { spaceIndex: idx, action: "HOUSE" };
    }
  }
  return null;
}

function aiShouldBuildHard(
  state: GameState,
  playerId: number,
): { spaceIndex: number; action: "HOUSE" | "HOTEL"; count?: number } | null {
  const player = state.players[playerId];
  // Hard: aggressively builds, prioritizes 3 houses (biggest rent jump)
  if (player.balance < 80) return null;
  const threat = opponentThreat(state, playerId);

  // Find best property to build on (prioritize getting to 3 houses)
  let bestOption: { spaceIndex: number; action: "HOUSE" | "HOTEL"; count?: number } | null = null;
  let bestPriority = -1;

  for (const idx of player.properties) {
    const space = getSpace(idx);
    if (space.type !== "PROPERTY") continue;
    if (!hasMonopoly(state, playerId, idx)) continue;
    const buildings = state.buildings[idx] || { houses: 0, hotel: false };
    if (buildings.hotel) continue;
    const prop = space as { housePrice: number; colorSet: string };

    // Build hotel if at 4 houses
    if (buildings.houses === 4 && player.balance > prop.housePrice + 50 + threat && state.bank.hotels > 0) {
      // Hotels are high priority
      const priority = 10;
      if (priority > bestPriority) {
        bestPriority = priority;
        bestOption = { spaceIndex: idx, action: "HOTEL" };
      }
      continue;
    }

    if (buildings.houses < 4 && player.balance > prop.housePrice + 50 + threat && state.bank.houses > 0) {
      const setIndices = getColorSetSpaces(prop.colorSet as "Brown" | "LightBlue" | "Pink" | "Orange" | "Red" | "Yellow" | "Green" | "DarkBlue");
      let canBuild = true;
      for (const sIdx of setIndices) {
        if (sIdx === idx) continue;
        const otherB = state.buildings[sIdx] || { houses: 0, hotel: false };
        if (otherB.hotel) { canBuild = false; break; }
        if (otherB.houses < buildings.houses) { canBuild = false; break; }
      }
      if (canBuild) {
        // Priority: getting to 3 houses is highest (biggest rent jump)
        // Orange & Red color sets are highest priority (high traffic)
        let priority = 5 - Math.abs(buildings.houses - 2); // closer to 3 = higher priority
        if (prop.colorSet === "Orange" || prop.colorSet === "Red") priority += 3;
        if (priority > bestPriority) {
          bestPriority = priority;
          // Try to build multiple houses to reach 3 if possible
          const targetHouses = Math.min(3, 4);
          let count = 1;
          if (buildings.houses < 3) {
            // Check if we can build 2 at once (need even rule + money + bank supply)
            const cost2 = prop.housePrice * 2;
            if (player.balance > cost2 + 50 + threat && state.bank.houses >= 2) {
              // Check even rule for 2 houses
              let canBuild2 = true;
              for (const sIdx of setIndices) {
                if (sIdx === idx) continue;
                const otherB = state.buildings[sIdx] || { houses: 0, hotel: false };
                if (otherB.houses < buildings.houses + 1) { canBuild2 = false; break; }
              }
              if (canBuild2) count = 2;
            }
          }
          bestOption = { spaceIndex: idx, action: "HOUSE", count };
        }
      }
    }
  }
  return bestOption;
}

// ===== Mortgage Decision =====
export function aiShouldMortgage(state: GameState, playerId: number): number | null {
  const player = state.players[playerId];
  if (!player) return null;

  switch (player.difficulty) {
    case "EASY":
      // Easy: mortgages if very low on cash
      if (player.balance > 50) return null;
      break;
    case "HARD":
      // Hard: mortgages to fund building on monopolies
      if (player.balance > 100) {
        // Check if mortgaging would let us build on a monopoly
        // (simplified: only mortgage if balance is low)
        return null;
      }
      break;
    case "MEDIUM":
    default:
      // Medium: mortgages if balance is low
      if (player.balance > 100) return null;
      break;
  }

  // Find a property that's not in a complete set and has no buildings
  for (const idx of player.properties) {
    const space = getSpace(idx);
    const ownership = state.ownership[idx];
    if (!ownership || ownership.mortgaged) continue;
    const buildings = state.buildings[idx];
    if (buildings && (buildings.houses > 0 || buildings.hotel)) continue;
    if (space.type === "PROPERTY") {
      // Don't mortgage if in a complete color set (would lose monopoly benefit)
      if (hasMonopoly(state, playerId, idx)) continue;
    }
    return idx;
  }
  return null;
}

// ===== Auctioning own property =====
// When badly cash-strapped, an AI may auction a *spare* property (one that isn't
// part of a monopoly it's pursuing and has no buildings) to raise cash — an open
// auction can fetch more than a mortgage if a rival wants it. Returns the index
// to auction, or null. Mortgaging stays the safer fallback.
export function aiShouldAuctionOwn(state: GameState, playerId: number): number | null {
  const me = state.players[playerId];
  if (!me || me.bankrupt) return null;
  if (me.balance >= 80) return null; // only when genuinely short on cash
  // Need at least one rival who could bid.
  if (state.players.filter((p) => !p.bankrupt && p.id !== playerId).length === 0) return null;

  let best: number | null = null;
  let bestVal = Infinity;
  for (const idx of me.properties) {
    const o = state.ownership[idx];
    if (!o || o.mortgaged) continue;
    const space = getSpace(idx);
    if (space.type === "PROPERTY") {
      const setIdx = getColorSetSpaces((space as { colorSet: string }).colorSet as "Brown" | "LightBlue" | "Pink" | "Orange" | "Red" | "Yellow" | "Green" | "DarkBlue");
      // Skip if the set has buildings, or if I'm collecting it (own 2+ → keep it).
      if (setIdx.some((i) => { const b = state.buildings[i]; return b && (b.houses > 0 || b.hotel); })) continue;
      if (setIdx.filter((i) => state.ownership[i]?.ownerId === playerId).length >= 2) continue;
    }
    const val = getPrice(space);
    if (val < bestVal) { bestVal = val; best = idx; }
  }
  return best;
}

// ===== Banking =====
// Rough net worth for AI bank decisions (cash + unmortgaged property + buildings).
function aiNetWorth(state: GameState, playerId: number): number {
  const me = state.players[playerId];
  let total = me.balance;
  for (const idx of me.properties) {
    const o = state.ownership[idx];
    if (!o) continue;
    const space = getSpace(idx);
    total += o.mortgaged ? Math.floor(getPrice(space) / 2) : getPrice(space);
    const b = state.buildings[idx];
    if (b && space.type === "PROPERTY") {
      total += (b.houses + (b.hotel ? 5 : 0)) * (space as { housePrice: number }).housePrice;
    }
  }
  return total;
}

export type AiBankDecision =
  | { type: "BORROW"; amount: number; term: number }
  | { type: "REPAY"; loanId: number }
  | null;

// How an AI uses the bank each turn: repay early when flush, borrow when
// cash-strapped but asset-rich (so it can keep buying/building). Conservative —
// it avoids over-leveraging and respects the rate (won't borrow when bunga is
// punishing unless it has clear use for the cash).
export function aiBankDecision(state: GameState, playerId: number): AiBankDecision {
  const me = state.players[playerId];
  if (!me || me.bankrupt) return null;
  const loans = me.loans ?? [];
  const debt = totalDebt(loans);

  // Repay early when comfortably cash-rich relative to the debt.
  if (loans.length > 0 && me.balance > debt + 300) {
    const costliest = loans.reduce((a, b) => (b.balance > a.balance ? b : a));
    return { type: "REPAY", loanId: costliest.id };
  }

  // Borrow only when short on cash but holding assets, with capacity to spare.
  const net = aiNetWorth(state, playerId);
  const limit = creditLimit(net, debt);
  const lowCash = me.balance < (me.difficulty === "HARD" ? 160 : me.difficulty === "EASY" ? 90 : 120);
  const overLeveraged = debt > net * 0.4;
  const rate = loanInterestRate(state.centralRate);
  const rateOk = rate < (me.difficulty === "HARD" ? 0.12 : 0.1); // skip when bunga too steep
  const wantsCash = me.properties.length >= 1; // has things to build/develop
  const gate = me.difficulty === "EASY" ? 0.4 : me.difficulty === "HARD" ? 0.8 : 0.6;
  if (lowCash && wantsCash && !overLeveraged && rateOk && limit >= 100 && rng() < gate) {
    const amount = Math.min(limit, me.difficulty === "HARD" ? 260 : 180);
    const term = LOAN_TERMS[1]; // 5 rounds
    if (amount >= 100) return { type: "BORROW", amount, term };
  }
  return null;
}

// ===== Government / corruption =====
export type AiGovDecision = { type: "BRIBE_GUARD" } | { type: "LOBBY" } | { type: "EVADE" } | null;

// How an AI uses the Government menu's "cara curang". Risk-averse by default —
// it only offends while its heat (suspicion) is still low, scaling boldness with
// difficulty. Returns at most one action to attempt this turn.
export function aiGovernmentDecision(state: GameState, playerId: number): AiGovDecision {
  const me = state.players[playerId];
  if (!me || me.bankrupt) return null;
  const heat = me.heat ?? 0;
  const boldness = me.difficulty === "HARD" ? 1.5 : me.difficulty === "EASY" ? 0.5 : 1;
  const heatCeil = me.difficulty === "HARD" ? 55 : me.difficulty === "EASY" ? 30 : 42;
  if (heat >= heatCeil) return null; // lie low when already suspected

  // In jail: bribe the guard out when it's wealthy enough (and cheaper than a
  // repeat-offender bail), rather than waste turns.
  if (me.inJail) {
    if (me.balance > BRIBE_GUARD_COST + 150 && me.jailCount >= 1 && rng() < 0.4 * boldness) {
      return { type: "BRIBE_GUARD" };
    }
    return null;
  }

  // Dominant, cash-comfortable players lobby for favourable regulation.
  const mostProps = Math.max(...state.players.filter((p) => !p.bankrupt).map((p) => p.properties.length));
  if (!me.lobbyActive && me.properties.length >= 4 && me.properties.length === mostProps && me.balance > LOBBY_COST + 200 && rng() < 0.15 * boldness) {
    return { type: "LOBBY" };
  }

  // Cash-strapped players cook the books on their next rent.
  if (!me.evadeNextRent && me.balance < 130 && me.properties.length >= 1 && rng() < 0.2 * boldness) {
    return { type: "EVADE" };
  }
  return null;
}

// ===== Rescue investment =====
// Whether a cash-rich AI will bail out a bankruptcy-bound player to gain a
// revenue-sharing vassal. Deliberately conservative — only with a comfortable
// surplus, when the target still holds assets, and the game isn't already 1v1.
export function aiShouldInvest(state: GameState, investorId: number, targetId: number, debt: number): boolean {
  const inv = state.players[investorId];
  const target = state.players[targetId];
  if (!inv || !target) return false;
  if (inv.balance < debt * 2.5) return false; // keep a strong reserve
  if (target.properties.length < 2) return false; // little future rent to share
  if (state.players.filter((p) => !p.bankrupt).length <= 2) return false; // no ally value
  return rng() < 0.5;
}

// ===== Trade Initiation =====
export interface AiTradeOffer {
  fromId: number;
  toId: number;
  cashFrom: number;
  cashTo: number;
  propertiesFrom: number[];
  propertiesTo: number[];
  goojFrom: number;
  goojTo: number;
}

// An AI looks for a worthwhile trade to propose: buy the one property it still
// needs to complete a color-set monopoly from whoever owns it, offering cash it
// can afford. Returns null if nothing sensible (or affordable) is available.
export function aiProposeTrade(state: GameState, playerId: number): AiTradeOffer | null {
  const me = state.players[playerId];
  if (!me || me.bankrupt) return null;
  const owner = (i: number) => state.ownership[i]?.ownerId ?? null;

  // The color sets where I'm exactly one piece short, and who holds that piece.
  const myNeeds: { set: string; piece: number; ownerId: number }[] = [];
  for (const [set, indices] of Object.entries(COLOR_SETS)) {
    if (indices.filter((i) => owner(i) === playerId).length !== indices.length - 1) continue;
    const missing = indices.find((i) => owner(i) !== playerId);
    if (missing === undefined) continue;
    const oid = owner(missing);
    if (oid === null || oid === playerId) continue;
    if (!state.players[oid] || state.players[oid].bankrupt) continue;
    myNeeds.push({ set, piece: missing, ownerId: oid });
  }
  if (myNeeds.length === 0) return null;

  // Strategy 1 — mutual monopoly swap (win/win, no cash): I hand over a piece
  // that completes the OTHER player's set in return for the one I need. The two
  // sets must differ, otherwise we'd just be swapping which half each of us holds.
  for (const need of myNeeds) {
    const y = need.ownerId;
    for (const [set, indices] of Object.entries(COLOR_SETS)) {
      if (set === need.set) continue; // must be a different color set
      if (indices.filter((i) => owner(i) === y).length !== indices.length - 1) continue;
      const yMissing = indices.find((i) => owner(i) !== y);
      if (yMissing === undefined || owner(yMissing) !== playerId) continue; // Y needs a piece I own
      return {
        fromId: playerId, toId: y,
        cashFrom: 0, cashTo: 0,
        propertiesFrom: [yMissing], propertiesTo: [need.piece],
        goojFrom: 0, goojTo: 0,
      };
    }
  }

  // Strategy 2 — buy the missing piece for cash (needs a cash buffer).
  if (me.balance >= 120) {
    for (const need of myNeeds) {
      const price = getPrice(getSpace(need.piece));
      const maxOffer = me.balance - 60; // keep a $60 reserve
      if (maxOffer < price) continue;
      const offer = Math.min(maxOffer, Math.ceil(price * 1.4)); // premium up to 1.4×
      return {
        fromId: playerId, toId: need.ownerId,
        cashFrom: offer, cashTo: 0,
        propertiesFrom: [], propertiesTo: [need.piece],
        goojFrom: 0, goojTo: 0,
      };
    }
  }
  return null;
}
