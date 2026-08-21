import { beforeEach, describe, expect, it } from "vitest";
import { useGame } from "./gameStore";
import { parseIntent } from "./schemas";
import { validateIntent } from "./validateIntent";
import { checkInvariants } from "./invariants";
import { makeSeededRng, seedRng, setRng } from "./rng";
import type { AIDifficulty, PlayerType } from "./types";

// The three-layer intent gate: parseIntent (shape) → validateIntent (rules) →
// dispatch (apply + invariants). This is the seam a server will mirror, so it
// gets its own suite independent of the gameplay regressions.

type PlayerConfig = { name: string; type: PlayerType; difficulty?: AIDifficulty };
const HUMANS = (n: number): PlayerConfig[] =>
  Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, type: "HUMAN" as const }));

function start(configs: PlayerConfig[], cash = 1500) {
  useGame.getState().reset();
  useGame.getState().init(configs, cash);
}

beforeEach(() => {
  seedRng(4242);
  useGame.getState().reset();
});

describe("layer 1 — parseIntent (shape & bounds)", () => {
  it("rejects unknown intent types", () => {
    expect(parseIntent({ type: "GIVE_ME_MONEY" }).ok).toBe(false);
  });

  it("rejects out-of-range board indices", () => {
    expect(parseIntent({ type: "MORTGAGE", spaceIndex: 99 }).ok).toBe(false);
    expect(parseIntent({ type: "MORTGAGE", spaceIndex: -1 }).ok).toBe(false);
    expect(parseIntent({ type: "MORTGAGE", spaceIndex: 1.5 }).ok).toBe(false);
  });

  it("rejects negative and absurd money values", () => {
    expect(parseIntent({ type: "AUCTION_BID", amount: -500 }).ok).toBe(false);
    expect(parseIntent({ type: "AUCTION_BID", amount: 1e9 }).ok).toBe(false);
    expect(parseIntent({ type: "AUCTION_BID", amount: Number.NaN }).ok).toBe(false);
  });

  it("rejects loan terms outside the offered set", () => {
    expect(parseIntent({ type: "TAKE_LOAN", amount: 100, term: 999 }).ok).toBe(false);
    expect(parseIntent({ type: "TAKE_LOAN", amount: 100, term: 5 }).ok).toBe(true);
  });

  it("rejects a trade payload carrying negative cash", () => {
    const bad = {
      type: "PROPOSE_TRADE",
      trade: {
        fromId: 0, toId: 1, cashFrom: -9999, cashTo: 0,
        propertiesFrom: [], propertiesTo: [], goojFrom: 0, goojTo: 0,
      },
    };
    expect(parseIntent(bad).ok).toBe(false);
  });

  it("accepts a well-formed intent", () => {
    const res = parseIntent({ type: "ROLL_DICE" });
    expect(res.ok).toBe(true);
  });
});

describe("layer 2 — validateIntent (rules vs authoritative state)", () => {
  it("refuses actions from a player whose turn it is not", () => {
    start(HUMANS(2));
    const s = useGame.getState();
    expect(validateIntent(s, { type: "ROLL_DICE" }, 1).ok).toBe(false);
    expect(validateIntent(s, { type: "ROLL_DICE" }, 0).ok).toBe(true);
  });

  it("refuses actions from a bankrupt player", () => {
    start(HUMANS(2));
    useGame.setState((st) => ({
      players: st.players.map((p) => (p.id === 0 ? { ...p, bankrupt: true } : p)),
    }));
    expect(validateIntent(useGame.getState(), { type: "ROLL_DICE" }, 0).ok).toBe(false);
  });

  it("refuses to mortgage a property the actor does not own", () => {
    start(HUMANS(2));
    const verdict = validateIntent(useGame.getState(), { type: "MORTGAGE", spaceIndex: 1 }, 0);
    expect(verdict.ok).toBe(false);
  });

  it("refuses a loan beyond the credit limit", () => {
    start(HUMANS(2), 100);
    const verdict = validateIntent(useGame.getState(), { type: "TAKE_LOAN", amount: 500_000, term: 5 }, 0);
    expect(verdict.ok).toBe(false);
  });

  it("refuses an auction bid from someone not on turn to bid", () => {
    start(HUMANS(3));
    useGame.setState({ pendingSpaceAction: 1, turnPhase: "ACTION" });
    useGame.getState().declineBuy();
    const s = useGame.getState();
    const onTurn = s.auction.participants[s.auction.turnIndex];
    const other = s.auction.participants.find((id) => id !== onTurn)!;
    expect(validateIntent(s, { type: "AUCTION_BID", amount: 50 }, other).ok).toBe(false);
    expect(validateIntent(s, { type: "AUCTION_BID", amount: 50 }, onTurn).ok).toBe(true);
  });

  it("refuses everything once the game is over", () => {
    start(HUMANS(2));
    useGame.setState({ turnPhase: "GAME_OVER" });
    expect(validateIntent(useGame.getState(), { type: "ROLL_DICE" }, 0).ok).toBe(false);
  });
});

describe("layer 3 — dispatch (gate + apply + invariants)", () => {
  it("applies a legal intent and reports ok", () => {
    start(HUMANS(2));
    useGame.setState({ pendingSpaceAction: 1, turnPhase: "ACTION" });
    const res = useGame.getState().dispatch({ type: "BUY_PROPERTY" });
    expect(res.ok).toBe(true);
    expect(useGame.getState().ownership[1].ownerId).toBe(0);
  });

  it("rejects a malformed intent without touching state", () => {
    start(HUMANS(2));
    const before = JSON.stringify(useGame.getState().players);
    const res = useGame.getState().dispatch({ type: "BUY_PROPERTY", spaceIndex: -5, amount: 1e12 });
    // Shape gate may accept extra keys, but the rule gate must still refuse:
    // there is no pending space to buy.
    expect(res.ok).toBe(false);
    expect(JSON.stringify(useGame.getState().players)).toBe(before);
  });

  it("rejects an out-of-turn intent without touching state", () => {
    start(HUMANS(2));
    const before = JSON.stringify(useGame.getState().players);
    const res = useGame.getState().dispatch({ type: "ROLL_DICE" }, 1);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBeTruthy();
    expect(JSON.stringify(useGame.getState().players)).toBe(before);
  });

  it("leaves invariants intact after a dispatched purchase", () => {
    start(HUMANS(2));
    useGame.setState({ pendingSpaceAction: 3, turnPhase: "ACTION" });
    useGame.getState().dispatch({ type: "BUY_PROPERTY" });
    expect(checkInvariants(useGame.getState())).toEqual([]);
  });
});

describe("determinism (server-authoritative prerequisite)", () => {
  it("produces identical dice sequences for the same seed", () => {
    const rollTen = (seed: number) => {
      setRng(makeSeededRng(seed));
      start(HUMANS(2));
      const out: number[] = [];
      for (let i = 0; i < 10; i++) {
        useGame.setState({ turnPhase: "WAITING_ROLL" });
        useGame.getState().rollDice();
        const r = useGame.getState().lastDiceRoll;
        out.push(r.die1, r.die2);
      }
      return out;
    };
    expect(rollTen(777)).toEqual(rollTen(777));
  });

  it("produces different sequences for different seeds", () => {
    const rollTen = (seed: number) => {
      setRng(makeSeededRng(seed));
      start(HUMANS(2));
      const out: number[] = [];
      for (let i = 0; i < 10; i++) {
        useGame.setState({ turnPhase: "WAITING_ROLL" });
        useGame.getState().rollDice();
        const r = useGame.getState().lastDiceRoll;
        out.push(r.die1, r.die2);
      }
      return out;
    };
    expect(rollTen(1)).not.toEqual(rollTen(2));
  });
});
