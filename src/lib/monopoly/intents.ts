// ===== Player intents (Phase 1) =====
// The vocabulary of everything a player can *ask* to do. A client sends an Intent;
// `validateIntent` decides if it's legal against authoritative state; only then is
// it applied. The actor (who is asking) is passed alongside — never trusted from
// the payload — so the future server derives it from the session, not the wire.

export interface TradeIntentPayload {
  fromId: number;
  toId: number;
  cashFrom: number;
  cashTo: number;
  propertiesFrom: number[];
  propertiesTo: number[];
  goojFrom: number;
  goojTo: number;
}

export type Intent =
  | { type: "ROLL_DICE" }
  | { type: "END_TURN" }
  | { type: "BUY_PROPERTY" }
  | { type: "DECLINE_BUY" }
  | { type: "JAIL_DECISION"; decision: "PAY" | "CARD" | "ROLL" }
  | { type: "BUILD_HOUSE"; spaceIndex: number; count?: number }
  | { type: "SELL_HOUSE"; spaceIndex: number; count?: number }
  | { type: "BUILD_HOTEL"; spaceIndex: number }
  | { type: "SELL_HOTEL"; spaceIndex: number }
  | { type: "MORTGAGE"; spaceIndex: number }
  | { type: "UNMORTGAGE"; spaceIndex: number }
  | { type: "SELL_TO_BANK"; spaceIndex: number }
  | { type: "AUCTION_OWN"; spaceIndex: number }
  | { type: "AUCTION_BID"; amount: number }
  | { type: "AUCTION_PASS" }
  | { type: "AUCTION_LEAVE" }
  | { type: "TAKE_LOAN"; amount: number; term: number }
  | { type: "REPAY_LOAN"; loanId: number }
  | { type: "BRIBE_GUARD" }
  | { type: "LOBBY" }
  | { type: "ARM_EVASION" }
  | { type: "RIG_AUCTION" }
  | { type: "PROPOSE_TRADE"; trade: TradeIntentPayload }
  | { type: "ACCEPT_TRADE" }
  | { type: "REJECT_TRADE" }
  | { type: "DISMISS_CARD" }
  | { type: "PAY_TAX"; mode: "FLAT" | "PERCENT" }
  | { type: "RESOLVE_FISCAL"; choiceId: string }
  | { type: "RESOLVE_RESCUE"; invest: boolean };

export type IntentType = Intent["type"];

// Result of attempting an intent — same shape on client (optimistic) and server.
export type IntentResult = { ok: true } | { ok: false; reason: string };
