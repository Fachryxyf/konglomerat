import type { GameState, Loan, Regulations } from "./types";
import { rng } from "./rng";

// ===== Central Bank & Government =====
// An autonomous monetary + regulatory layer. The central bank sets the base
// interest rate that all loans float against; the government sets regulations
// (rent control, property tax). Both are re-tuned every economic cycle by
// `rollMonetaryPolicy` — players & AI only react.

export const DEFAULT_CENTRAL_RATE = 0.05; // per-round interest on outstanding loan balance
export const LOAN_SPREAD = 0.02; // bank's margin on top of the base rate
export const LOAN_TERMS = [3, 5, 8] as const; // rounds to repay

export const DEFAULT_REGULATIONS: Regulations = {
  rentMod: 1, // multiplier on rent paid (rent control <1, deregulation >1)
  propertyTaxRate: 0, // per-round holding tax as a fraction of property value
};

const clampRate = (r: number) => Math.min(0.14, Math.max(0.03, Math.round(r * 1000) / 1000));
const clampRent = (r: number) => Math.min(1.25, Math.max(0.8, Math.round(r * 100) / 100));
const clampTax = (r: number) => Math.min(0.04, Math.max(0, Math.round(r * 1000) / 1000));

// Effective per-round interest rate a borrower actually pays.
export function loanInterestRate(centralRate: number): number {
  return centralRate + LOAN_SPREAD;
}

// How much a player may still borrow: leverage capped at ~60% of net worth,
// minus what they already owe. Floored at 0.
export function creditLimit(netWorth: number, existingDebt: number): number {
  return Math.max(0, Math.floor(netWorth * 0.6) - existingDebt);
}

// Total outstanding principal a player owes across all loans.
export function totalDebt(loans: Loan[]): number {
  return loans.reduce((sum, l) => sum + l.balance, 0);
}

let loanIdCounter = 1;
export function makeLoan(principal: number, term: number, turn: number): Loan {
  return {
    id: loanIdCounter++,
    principal,
    balance: principal,
    term,
    roundsRemaining: term,
    principalPerRound: Math.ceil(principal / term),
    takenTurn: turn,
  };
}

// One round's bill for a loan given the current central rate. `principalPart`
// retires the debt; `interest` is the bank's cut. On the final round the
// remaining balance is paid off in full (a balloon).
export function loanInstallment(loan: Loan, centralRate: number): { interest: number; principalPart: number; total: number; closes: boolean } {
  const interest = Math.ceil(loan.balance * loanInterestRate(centralRate));
  const closes = loan.roundsRemaining <= 1;
  const principalPart = closes ? loan.balance : Math.min(loan.principalPerRound, loan.balance);
  return { interest, principalPart, total: interest + principalPart, closes };
}

// ----- Autonomous monetary + regulatory policy -----

export interface MonetaryClimate {
  id: string;
  title: string;
  // produce next policy values from the previous ones
  next: (prev: { centralRate: number; reg: Regulations }) => { centralRate: number; reg: Regulations; detail: string };
}

const CLIMATES: MonetaryClimate[] = [
  {
    id: "BOOM",
    title: "Ekspansi Ekonomi",
    next: ({ centralRate, reg }) => ({
      centralRate: clampRate(centralRate + 0.02),
      reg: { rentMod: clampRent(reg.rentMod + 0.1), propertyTaxRate: clampTax(reg.propertyTaxRate) },
      detail: "Permintaan memanas — Bank Sentral menaikkan suku bunga; sewa naik (deregulasi).",
    }),
  },
  {
    id: "RECESSION",
    title: "Resesi & Stimulus",
    next: ({ centralRate, reg }) => ({
      centralRate: clampRate(centralRate - 0.025),
      reg: { rentMod: clampRent(reg.rentMod - 0.12), propertyTaxRate: 0 },
      detail: "Ekonomi lesu — Bank Sentral memangkas bunga untuk stimulus; pemerintah berlakukan kontrol sewa.",
    }),
  },
  {
    id: "INFLATION",
    title: "Lonjakan Inflasi",
    next: ({ centralRate, reg }) => ({
      centralRate: clampRate(centralRate + 0.035),
      reg: { rentMod: clampRent(reg.rentMod + 0.08), propertyTaxRate: clampTax(reg.propertyTaxRate + 0.01) },
      detail: "Inflasi melonjak — bunga dinaikkan agresif; pajak properti diberlakukan untuk meredam.",
    }),
  },
  {
    id: "AUSTERITY",
    title: "Pengetatan Fiskal",
    next: ({ centralRate, reg }) => ({
      centralRate: clampRate(centralRate + 0.005),
      reg: { rentMod: clampRent(reg.rentMod), propertyTaxRate: clampTax(reg.propertyTaxRate + 0.02) },
      detail: "Pemerintah memperketat anggaran — pajak properti per-ronde dinaikkan.",
    }),
  },
  {
    id: "REFORM",
    title: "Normalisasi Kebijakan",
    next: ({ centralRate }) => ({
      centralRate: clampRate(DEFAULT_CENTRAL_RATE + (centralRate - DEFAULT_CENTRAL_RATE) * 0.5),
      reg: { rentMod: 1, propertyTaxRate: clampTax(0.005) },
      detail: "Kebijakan dinormalisasi — bunga & regulasi kembali mendekati netral.",
    }),
  },
];

export function rollMonetaryPolicy(prev: { centralRate: number; reg: Regulations }): {
  centralRate: number;
  reg: Regulations;
  title: string;
  detail: string;
} {
  const climate = CLIMATES[Math.floor(rng() * CLIMATES.length)];
  const out = climate.next(prev);
  return { centralRate: out.centralRate, reg: out.reg, title: climate.title, detail: out.detail };
}

// Apply the active rent regulation to a rent amount.
export function applyRentRegulation(s: GameState, rent: number): number {
  const mod = s.regulations?.rentMod ?? 1;
  if (mod === 1) return rent;
  return Math.max(0, Math.round(rent * mod));
}
