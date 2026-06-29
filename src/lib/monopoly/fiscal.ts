import type { Player } from "./types";
import { rng } from "./rng";

export type FiscalKind = "TAX" | "INFLATION";

export interface FiscalChoice {
  id: string;
  label: string;
  desc: string;
}

// A scheduled "Fiscal Year" (every 12 rounds). Themes alternate between a
// redistributive wealth tax and amplifying inflation. Each player picks a policy
// (human via modal, AI automatically) that resolves differently by wealth.
export interface FiscalDef {
  kind: FiscalKind;
  title: string;
  intro: string;
  choices: FiscalChoice[];
  // Apply a player's chosen policy. `net` is that player's net worth.
  apply: (player: Player, choiceId: string, net: number) => { balance: number; note: string };
  // What the AI picks given its situation.
  aiChoice: (player: Player, net: number, liquidatable: number) => string;
}

const clamp0 = (n: number) => Math.max(0, Math.round(n));

export const FISCAL_TAX: FiscalDef = {
  kind: "TAX",
  title: "Tahun Fiskal: Reformasi Pajak",
  intro: "Pemerintah memungut pajak kekayaan progresif — makin kaya, makin besar tarifnya. Pilih sikapmu:",
  choices: [
    { id: "PAY", label: "Patuh — Bayar Pajak", desc: "Bayar pajak progresif (5–12% dari kekayaan bersih) dengan tertib. Aman." },
    { id: "EVADE", label: "Mangkir — Hindari Pajak", desc: "55% lolos tanpa bayar; 45% ketahuan dan kena denda 1,6× lipat. Judi." },
  ],
  apply: (player, choiceId, net) => {
    const rate = net > 2500 ? 0.12 : net > 1200 ? 0.08 : 0.05;
    const tax = clamp0(net * rate);
    if (choiceId === "EVADE") {
      if (rng() < 0.55) return { balance: player.balance, note: `${player.name} lolos dari pajak (tidak bayar).` };
      const penalty = clamp0(tax * 1.6);
      return { balance: player.balance - penalty, note: `${player.name} ketahuan mangkir pajak — denda $${penalty}.` };
    }
    return { balance: player.balance - tax, note: `${player.name} membayar pajak kekayaan $${tax}.` };
  },
  aiChoice: (player, net, liquidatable) => {
    const rate = net > 2500 ? 0.12 : net > 1200 ? 0.08 : 0.05;
    const tax = net * rate;
    // Desperate AIs gamble on evasion; otherwise comply.
    return liquidatable < tax * 1.2 ? "EVADE" : "PAY";
  },
};

export const FISCAL_INFLATION: FiscalDef = {
  kind: "INFLATION",
  title: "Tahun Fiskal: Inflasi Melonjak",
  intro: "Inflasi menggerus nilai uang tunai, sementara aset menguat. Pilih strategimu:",
  choices: [
    { id: "HOLD", label: "Simpan Tunai", desc: "Kas terpotong 8% oleh inflasi. Konservatif." },
    { id: "INVEST", label: "Borong Aset (Spekulasi)", desc: "Kas terpotong 15%, tapi dapat +$60 per properti yang dimiliki. Untung kalau aset banyak." },
  ],
  apply: (player, choiceId) => {
    if (choiceId === "INVEST") {
      const after = clamp0(player.balance * 0.85) + player.properties.length * 60;
      return { balance: after, note: `${player.name} borong aset: +$${player.properties.length * 60} dari ${player.properties.length} properti.` };
    }
    return { balance: clamp0(player.balance * 0.92), note: `${player.name} simpan tunai — terpotong inflasi 8%.` };
  },
  aiChoice: (player) => (player.properties.length >= 3 ? "INVEST" : "HOLD"),
};

export function fiscalForRound(round: number): FiscalDef {
  // round 12 → #1, 24 → #2, ... alternate TAX / INFLATION.
  const n = Math.floor(round / 12);
  return n % 2 === 1 ? FISCAL_TAX : FISCAL_INFLATION;
}
