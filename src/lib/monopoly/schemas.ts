import { z } from "zod";
import type { Intent } from "./intents";

// ===== Intent payload schemas (Phase 1: anti parameter injection) =====
// The FIRST gate: validate shape & bounds before any rule logic runs. This alone
// rejects injected garbage (cashTo: -9999, amount: 1e9, term: 999, spaceIndex out
// of range, NaN, extra fields, …). Rule/context checks live in `validateIntent`.

const spaceIndex = z.number().int().min(0).max(39);
const nonNegInt = z.number().int().min(0);
const money = z.number().int().min(0).max(1_000_000); // sane upper bound

const tradePayload = z.object({
  fromId: nonNegInt.max(7),
  toId: nonNegInt.max(7),
  cashFrom: money,
  cashTo: money,
  propertiesFrom: z.array(spaceIndex).max(28),
  propertiesTo: z.array(spaceIndex).max(28),
  goojFrom: nonNegInt.max(10),
  goojTo: nonNegInt.max(10),
});

export const intentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ROLL_DICE") }),
  z.object({ type: z.literal("END_TURN") }),
  z.object({ type: z.literal("BUY_PROPERTY") }),
  z.object({ type: z.literal("DECLINE_BUY") }),
  z.object({ type: z.literal("JAIL_DECISION"), decision: z.enum(["PAY", "CARD", "ROLL"]) }),
  z.object({ type: z.literal("BUILD_HOUSE"), spaceIndex, count: z.number().int().min(1).max(4).optional() }),
  z.object({ type: z.literal("SELL_HOUSE"), spaceIndex, count: z.number().int().min(1).max(4).optional() }),
  z.object({ type: z.literal("BUILD_HOTEL"), spaceIndex }),
  z.object({ type: z.literal("SELL_HOTEL"), spaceIndex }),
  z.object({ type: z.literal("MORTGAGE"), spaceIndex }),
  z.object({ type: z.literal("UNMORTGAGE"), spaceIndex }),
  z.object({ type: z.literal("SELL_TO_BANK"), spaceIndex }),
  z.object({ type: z.literal("AUCTION_OWN"), spaceIndex }),
  z.object({ type: z.literal("AUCTION_BID"), amount: money }),
  z.object({ type: z.literal("AUCTION_PASS") }),
  z.object({ type: z.literal("TAKE_LOAN"), amount: money, term: z.union([z.literal(3), z.literal(5), z.literal(8)]) }),
  z.object({ type: z.literal("REPAY_LOAN"), loanId: z.number().int().positive() }),
  z.object({ type: z.literal("BRIBE_GUARD") }),
  z.object({ type: z.literal("LOBBY") }),
  z.object({ type: z.literal("ARM_EVASION") }),
  z.object({ type: z.literal("RIG_AUCTION") }),
  z.object({ type: z.literal("PROPOSE_TRADE"), trade: tradePayload }),
  z.object({ type: z.literal("ACCEPT_TRADE") }),
  z.object({ type: z.literal("REJECT_TRADE") }),
  z.object({ type: z.literal("DISMISS_CARD") }),
  z.object({ type: z.literal("PAY_TAX"), mode: z.enum(["FLAT", "PERCENT"]) }),
  z.object({ type: z.literal("RESOLVE_FISCAL"), choiceId: z.string().min(1).max(40) }),
  z.object({ type: z.literal("RESOLVE_RESCUE"), invest: z.boolean() }),
]);

// Parse + narrow. Returns the typed Intent or an error reason.
export function parseIntent(raw: unknown): { ok: true; intent: Intent } | { ok: false; reason: string } {
  const res = intentSchema.safeParse(raw);
  if (res.success) return { ok: true, intent: res.data as Intent };
  const first = res.error.issues[0];
  return { ok: false, reason: `Payload tidak valid: ${first?.path.join(".") || "intent"} — ${first?.message ?? "bentuk salah"}` };
}
