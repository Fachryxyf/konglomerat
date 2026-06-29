import type { EventTier, Player } from "./types";
import { rng } from "./rng";

export interface EventCtx {
  // Houses & hotels a player currently owns (for builder-reward events).
  buildingCount: (player: Player) => { houses: number; hotels: number };
}

export interface WaveEvent {
  tier: EventTier;
  // Stable i18n key; localized title/detail live in dict/events.ts
  // (`event.<key>.title` / `.detail`).
  key: string;
  // Returns the updated players array. Implementations must leave bankrupt
  // players untouched and never push a balance below 0.
  apply: (players: Player[], ctx: EventCtx) => Player[];
}

// Helper: apply a per-player delta to every non-bankrupt player.
const each = (players: Player[], delta: (p: Player) => number): Player[] =>
  players.map((p) => (p.bankrupt ? p : { ...p, balance: Math.max(0, p.balance + Math.round(delta(p))) }));

const active = (players: Player[]) => players.filter((p) => !p.bankrupt);
const richestId = (players: Player[]) =>
  active(players).reduce((a, b) => (b.balance > a.balance ? b : a)).id;
const poorestId = (players: Player[]) =>
  active(players).reduce((a, b) => (b.balance < a.balance ? b : a)).id;

// ===== REGULAR (50%) — small, friendly cash relief =====
const REGULAR: WaveEvent[] = [
  { tier: "REGULAR", key: "allPassGo", apply: (p) => each(p, () => 200) },
  { tier: "REGULAR", key: "bankDividend", apply: (p) => each(p, () => 150) },
  { tier: "REGULAR", key: "stockSale", apply: (p) => each(p, (pl) => Math.max(60, pl.properties.length * 40)) },
  { tier: "REGULAR", key: "socialFund", apply: (p) => each(p, (pl) => (pl.balance < 200 ? 300 : 100)) },
  { tier: "REGULAR", key: "inheritance", apply: (p) => each(p, () => 200) },
];

// ===== SPECIAL (30%) — bigger or more targeted boosts =====
const SPECIAL: WaveEvent[] = [
  { tier: "SPECIAL", key: "realEstateBoom", apply: (p) => each(p, (pl) => Math.max(100, pl.properties.length * 70)) },
  { tier: "SPECIAL", key: "taxRebate", apply: (p) => each(p, (pl) => Math.ceil(pl.balance * 0.15)) },
  { tier: "SPECIAL", key: "buildBonus", apply: (p, ctx) => each(p, (pl) => { const b = ctx.buildingCount(pl); return b.houses * 70 + b.hotels * 160; }) },
  {
    tier: "SPECIAL", key: "cityLottery",
    apply: (p) => { const id = active(p)[Math.floor(rng() * active(p).length)].id; return p.map((pl) => pl.id === id ? { ...pl, balance: pl.balance + 500 } : pl); },
  },
];

// ===== RARE (15%) — dramatic, two-way swings =====
const RARE: WaveEvent[] = [
  {
    tier: "RARE", key: "wealthTax",
    apply: (p) => {
      const others = active(p); if (others.length < 2) return p;
      const rid = richestId(p);
      const rich = p.find((x) => x.id === rid)!;
      const levy = Math.floor(rich.balance * 0.25);
      const share = Math.floor(levy / (others.length - 1));
      return p.map((pl) => pl.bankrupt ? pl : pl.id === rid ? { ...pl, balance: pl.balance - levy } : { ...pl, balance: pl.balance + share });
    },
  },
  { tier: "RARE", key: "monetaryCrisis", apply: (p) => each(p, (pl) => -Math.floor(pl.balance * 0.2)) },
  {
    tier: "RARE", key: "jackpot",
    apply: (p) => { const id = poorestId(p); return p.map((pl) => pl.id === id ? { ...pl, balance: pl.balance + 700 } : pl); },
  },
];

// ===== MYTHOS (5%) — legendary, game-shaking =====
const MYTHOS: WaveEvent[] = [
  {
    tier: "MYTHOS", key: "invisibleHand",
    apply: (p) => {
      const act = active(p); if (act.length === 0) return p;
      const pot = act.reduce((s, pl) => s + pl.balance, 0);
      const split = Math.floor(pot / act.length);
      return p.map((pl) => pl.bankrupt ? pl : { ...pl, balance: split });
    },
  },
  {
    tier: "MYTHOS", key: "tycoonEmpire",
    apply: (p) => { const id = richestId(p); return p.map((pl) => pl.id === id ? { ...pl, balance: pl.balance + 1200 } : pl); },
  },
  { tier: "MYTHOS", key: "goldenRain", apply: (p) => each(p, () => 600) },
];

const POOLS: Record<EventTier, WaveEvent[]> = { REGULAR, SPECIAL, RARE, MYTHOS };

// Roll a tier by weight (50/30/15/5), then a random event within it.
export function rollWaveEvent(): WaveEvent {
  const r = rng() * 100;
  const tier: EventTier = r < 50 ? "REGULAR" : r < 80 ? "SPECIAL" : r < 95 ? "RARE" : "MYTHOS";
  const pool = POOLS[tier];
  return pool[Math.floor(rng() * pool.length)];
}
