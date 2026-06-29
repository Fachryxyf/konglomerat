import type { Player, LogMsg } from "./types";
import { rng } from "./rng";

export type FiscalKind = "TAX" | "INFLATION";

// Choices reference i18n keys; localized copy lives in dict/events.ts.
export interface FiscalChoice {
  id: string;
  labelKey: string;
  descKey: string;
}

// A scheduled "Fiscal Year" (every 12 rounds). Themes alternate between a
// redistributive wealth tax and amplifying inflation. Each player picks a policy
// (human via modal, AI automatically) that resolves differently by wealth.
export interface FiscalDef {
  kind: FiscalKind;
  titleKey: string;
  introKey: string;
  choices: FiscalChoice[];
  // Apply a player's chosen policy. `net` is that player's net worth. The note is
  // a structured log message (key + params) so it re-renders per locale.
  apply: (player: Player, choiceId: string, net: number) => { balance: number; note: LogMsg };
  // What the AI picks given its situation.
  aiChoice: (player: Player, net: number, liquidatable: number) => string;
}

const clamp0 = (n: number) => Math.max(0, Math.round(n));

export const FISCAL_TAX: FiscalDef = {
  kind: "TAX",
  titleKey: "fiscal.tax.title",
  introKey: "fiscal.tax.intro",
  choices: [
    { id: "PAY", labelKey: "fiscal.tax.pay.label", descKey: "fiscal.tax.pay.desc" },
    { id: "EVADE", labelKey: "fiscal.tax.evade.label", descKey: "fiscal.tax.evade.desc" },
  ],
  apply: (player, choiceId, net): { balance: number; note: LogMsg } => {
    const rate = net > 2500 ? 0.12 : net > 1200 ? 0.08 : 0.05;
    const tax = clamp0(net * rate);
    if (choiceId === "EVADE") {
      if (rng() < 0.55) return { balance: player.balance, note: { key: "log.fiscal.evadeWin", params: { name: player.name } } };
      const penalty = clamp0(tax * 1.6);
      return { balance: player.balance - penalty, note: { key: "log.fiscal.evadeCaught", params: { name: player.name, penalty } } };
    }
    return { balance: player.balance - tax, note: { key: "log.fiscal.pay", params: { name: player.name, tax } } };
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
  titleKey: "fiscal.inflation.title",
  introKey: "fiscal.inflation.intro",
  choices: [
    { id: "HOLD", labelKey: "fiscal.inflation.hold.label", descKey: "fiscal.inflation.hold.desc" },
    { id: "INVEST", labelKey: "fiscal.inflation.invest.label", descKey: "fiscal.inflation.invest.desc" },
  ],
  apply: (player, choiceId): { balance: number; note: LogMsg } => {
    if (choiceId === "INVEST") {
      const after = clamp0(player.balance * 0.85) + player.properties.length * 60;
      return { balance: after, note: { key: "log.fiscal.invest", params: { name: player.name, gain: player.properties.length * 60, count: player.properties.length } } };
    }
    return { balance: clamp0(player.balance * 0.92), note: { key: "log.fiscal.hold", params: { name: player.name } } };
  },
  aiChoice: (player) => (player.properties.length >= 3 ? "INVEST" : "HOLD"),
};

export function fiscalForRound(round: number): FiscalDef {
  // round 12 → #1, 24 → #2, ... alternate TAX / INFLATION.
  const n = Math.floor(round / 12);
  return n % 2 === 1 ? FISCAL_TAX : FISCAL_INFLATION;
}
