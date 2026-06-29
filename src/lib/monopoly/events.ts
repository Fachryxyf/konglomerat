import type { EventTier, Player } from "./types";
import { rng } from "./rng";

export interface EventCtx {
  // Houses & hotels a player currently owns (for builder-reward events).
  buildingCount: (player: Player) => { houses: number; hotels: number };
}

export interface WaveEvent {
  tier: EventTier;
  title: string;
  detail: string;
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
  { tier: "REGULAR", title: "Semua Lewat GO", detail: "Setiap pemain seakan melewati GO dan menerima $200.", apply: (p) => each(p, () => 200) },
  { tier: "REGULAR", title: "Dividen Bank", detail: "Bank membagikan dividen $150 ke setiap pemain.", apply: (p) => each(p, () => 150) },
  { tier: "REGULAR", title: "Penjualan Saham", detail: "Setiap pemain menerima $40 per properti yang dimiliki (min $60).", apply: (p) => each(p, (pl) => Math.max(60, pl.properties.length * 40)) },
  { tier: "REGULAR", title: "Dana Sosial Bank", detail: "Pemain berkas tipis (< $200) menerima $300, lainnya $100.", apply: (p) => each(p, (pl) => (pl.balance < 200 ? 300 : 100)) },
  { tier: "REGULAR", title: "Warisan Keluarga", detail: "Setiap pemain menerima warisan tak terduga $200.", apply: (p) => each(p, () => 200) },
];

// ===== SPECIAL (30%) — bigger or more targeted boosts =====
const SPECIAL: WaveEvent[] = [
  { tier: "SPECIAL", title: "Boom Real Estat", detail: "Harga properti melonjak — setiap pemain menerima $70 per properti (min $100).", apply: (p) => each(p, (pl) => Math.max(100, pl.properties.length * 70)) },
  { tier: "SPECIAL", title: "Pengembalian Pajak", detail: "Setiap pemain menerima restitusi pajak sebesar 15% dari kasnya.", apply: (p) => each(p, (pl) => Math.ceil(pl.balance * 0.15)) },
  { tier: "SPECIAL", title: "Bonus Pembangunan", detail: "Pengembang dapat insentif: +$70 per rumah dan +$160 per hotel yang dimiliki.", apply: (p, ctx) => each(p, (pl) => { const b = ctx.buildingCount(pl); return b.houses * 70 + b.hotels * 160; }) },
  {
    tier: "SPECIAL", title: "Menang Undian Kota", detail: "Satu pemain beruntung memenangkan undian kota senilai $500!",
    apply: (p) => { const id = active(p)[Math.floor(rng() * active(p).length)].id; return p.map((pl) => pl.id === id ? { ...pl, balance: pl.balance + 500 } : pl); },
  },
];

// ===== RARE (15%) — dramatic, two-way swings =====
const RARE: WaveEvent[] = [
  {
    tier: "RARE", title: "Pajak Kekayaan", detail: "Pemain terkaya menyetor 25% kasnya, dibagi rata ke pemain lain.",
    apply: (p) => {
      const others = active(p); if (others.length < 2) return p;
      const rid = richestId(p);
      const rich = p.find((x) => x.id === rid)!;
      const levy = Math.floor(rich.balance * 0.25);
      const share = Math.floor(levy / (others.length - 1));
      return p.map((pl) => pl.bankrupt ? pl : pl.id === rid ? { ...pl, balance: pl.balance - levy } : { ...pl, balance: pl.balance + share });
    },
  },
  { tier: "RARE", title: "Krisis Moneter", detail: "Resesi melanda — setiap pemain kehilangan 20% kasnya ke bank.", apply: (p) => each(p, (pl) => -Math.floor(pl.balance * 0.2)) },
  {
    tier: "RARE", title: "Jackpot Atlantic City", detail: "Keberuntungan berpihak pada yang tertinggal — pemain termiskin menang $700.",
    apply: (p) => { const id = poorestId(p); return p.map((pl) => pl.id === id ? { ...pl, balance: pl.balance + 700 } : pl); },
  },
];

// ===== MYTHOS (5%) — legendary, game-shaking =====
const MYTHOS: WaveEvent[] = [
  {
    tier: "MYTHOS", title: "Tangan Tak Terlihat", detail: "Pasar diatur ulang — seluruh kas dikumpulkan dan dibagi rata ke semua pemain.",
    apply: (p) => {
      const act = active(p); if (act.length === 0) return p;
      const pot = act.reduce((s, pl) => s + pl.balance, 0);
      const split = Math.floor(pot / act.length);
      return p.map((pl) => pl.bankrupt ? pl : { ...pl, balance: split });
    },
  },
  {
    tier: "MYTHOS", title: "Imperium Sang Taipan", detail: "Sang taipan terkaya mengukuhkan kekuasaan — menerima $1.200!",
    apply: (p) => { const id = richestId(p); return p.map((pl) => pl.id === id ? { ...pl, balance: pl.balance + 1200 } : pl); },
  },
  { tier: "MYTHOS", title: "Hujan Emas", detail: "Keajaiban langka — setiap pemain menerima $600.", apply: (p) => each(p, () => 600) },
];

const POOLS: Record<EventTier, WaveEvent[]> = { REGULAR, SPECIAL, RARE, MYTHOS };

// Roll a tier by weight (50/30/15/5), then a random event within it.
export function rollWaveEvent(): WaveEvent {
  const r = rng() * 100;
  const tier: EventTier = r < 50 ? "REGULAR" : r < 80 ? "SPECIAL" : r < 95 ? "RARE" : "MYTHOS";
  const pool = POOLS[tier];
  return pool[Math.floor(rng() * pool.length)];
}
