import type { GameState } from "./types";

// ===== Government, Corruption & Crime =====
// A menu of "cara curang" (bribery, lobbying, evasion, auction rigging). Each
// crime rolls a catch chance that scales with the player's HEAT (suspicion). Get
// caught and you pay a fine — and, if you're already notorious, go to jail.
// Heat decays slowly each round if you lie low.

export const MAX_HEAT = 100;
export const HEAT_DECAY = 6; // suspicion cooled per round when not offending
export const HEAT_PER_CRIME = 12; // committing a crime always raises suspicion a bit
export const HEAT_ON_CAUGHT = 28; // ...and a lot more when caught
export const HEAT_ON_RELEASE = 25; // a jail record follows you out
export const HEAT_JAIL_THRESHOLD = 60; // above this, getting caught can mean prison

export const LOBBY_RENT_BONUS = 0.1; // +10% rent on your properties while lobby perk is active

// Catch probability for a crime given its base risk and the offender's heat.
// Heat adds up to +55 percentage points on top of the base risk.
export function catchChance(baseRisk: number, heat: number): number {
  return Math.min(0.95, baseRisk + (heat / 100) * 0.55);
}

// Bail is no longer a flat $50: it climbs with repeat offences and with wealth,
// so jail genuinely bites — especially for tycoons and serial criminals.
export function jailBail(jailCount: number, netWorth: number): number {
  const progressive = 50 + Math.max(0, jailCount - 1) * 70;
  const wealthBased = Math.round(netWorth * 0.08);
  return Math.max(progressive, wealthBased);
}

export type CrimeId = "BRIBE_GUARD" | "LOBBY" | "EVADE" | "RIG_AUCTION";

export interface CrimeDef {
  id: CrimeId;
  label: string;
  desc: string;
  baseRisk: number; // catch chance before heat scaling
}

export const CRIMES: Record<CrimeId, CrimeDef> = {
  BRIBE_GUARD: {
    id: "BRIBE_GUARD",
    label: "Suap Sipir Penjara",
    desc: "Bayar suap untuk keluar penjara instan. Ketahuan: suap hangus, denda, tetap dipenjara.",
    baseRisk: 0.2,
  },
  LOBBY: {
    id: "LOBBY",
    label: "Lobi Regulasi",
    desc: "Suap pemerintah agar bebas pajak properti & sewa propertimu +10% sampai siklus berikutnya. Ketahuan: skandal & denda.",
    baseRisk: 0.25,
  },
  EVADE: {
    id: "EVADE",
    label: "Gelapkan Pembukuan",
    desc: "Atur sewa berikutnya yang kamu bayar jadi 40% saja. Kena audit: bayar penuh + denda 1,5× selisih (penjara bila heat tinggi).",
    baseRisk: 0.3,
  },
  RIG_AUCTION: {
    id: "RIG_AUCTION",
    label: "Manipulasi Lelang",
    desc: "Suap agar langsung menangkan lelang berjalan di tawaran sekarang. Ketahuan: lelang batal, denda, heat melonjak.",
    baseRisk: 0.3,
  },
};

export const BRIBE_GUARD_COST = 80;
export const BRIBE_GUARD_FINE = 200;
export const LOBBY_COST = 150;
export const LOBBY_FINE = 250;
export const EVADE_PAY_FRACTION = 0.4; // you try to pay only 40% of the rent
export const RIG_AUCTION_FINE = 180;
export function rigAuctionCost(currentBid: number): number {
  return Math.max(60, Math.round(currentBid * 0.3));
}

export function heatLabel(heat: number): { label: string; tone: "good" | "warn" | "bad" } {
  if (heat < 25) return { label: "Bersih", tone: "good" };
  if (heat < 55) return { label: "Diawasi", tone: "warn" };
  if (heat < 80) return { label: "Buron Ringan", tone: "bad" };
  return { label: "Sangat Dicari", tone: "bad" };
}

// A property owner who is in jail can't manage their estate — rent collected
// while they're locked up is halved.
export function jailedOwnerRent(s: GameState, ownerId: number, rent: number): number {
  const owner = s.players[ownerId];
  if (owner && owner.inJail) return Math.floor(rent / 2);
  return rent;
}
