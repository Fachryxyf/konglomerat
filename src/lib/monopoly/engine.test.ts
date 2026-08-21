import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGame } from "./gameStore";
import { checkInvariants } from "./invariants";
import { seedRng, resetRng } from "./rng";
import type { AIDifficulty, PlayerType } from "./types";

// Engine regression tests. The store is a singleton, so every test resets it and
// seeds the RNG for determinism.

type PlayerConfig = { name: string; type: PlayerType; difficulty?: AIDifficulty };

const HUMANS = (n: number): PlayerConfig[] =>
  Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, type: "HUMAN" as const }));

function start(configs: PlayerConfig[], cash = 1500) {
  useGame.getState().reset();
  useGame.getState().init(configs, cash);
}

beforeEach(() => {
  seedRng(12345);
  vi.useFakeTimers();
  useGame.getState().reset();
});

describe("auction turn order", () => {
  it("keeps the bidding rotation correct when a player leaves out of turn", () => {
    start(HUMANS(4));
    // P1 lands on a property and declines → auction with all 4 players.
    useGame.setState({ pendingSpaceAction: 1, turnPhase: "ACTION" });
    useGame.getState().declineBuy();

    const a0 = useGame.getState().auction;
    expect(a0.participants).toEqual([0, 1, 2, 3]);
    expect(a0.participants[a0.turnIndex]).toBe(0);

    // Player 3 (not the one on turn) drops out.
    useGame.getState().auctionLeave(3);

    const a1 = useGame.getState().auction;
    expect(a1.participants).toEqual([0, 1, 2]);
    // It must STILL be player 0's turn to bid — removing someone else
    // must not hand the turn to a different player.
    expect(a1.participants[a1.turnIndex]).toBe(0);
  });

  it("advances to the next participant when the bidder on turn leaves", () => {
    start(HUMANS(4));
    useGame.setState({ pendingSpaceAction: 1, turnPhase: "ACTION" });
    useGame.getState().declineBuy();

    useGame.getState().auctionLeave(0); // the player on turn passes
    const a = useGame.getState().auction;
    expect(a.participants).toEqual([1, 2, 3]);
    expect(a.participants[a.turnIndex]).toBe(1);
  });

  it("rejects a bid from a player whose turn it is not", () => {
    start(HUMANS(3));
    useGame.setState({ pendingSpaceAction: 1, turnPhase: "ACTION" });
    useGame.getState().declineBuy();

    // Player 2 tries to snipe while it is player 0's turn.
    useGame.getState().auctionBid(2, 50);
    expect(useGame.getState().auction.currentBid).toBe(0);
    expect(useGame.getState().auction.currentBidderId).toBeNull();
  });

  it("rejects a bid from a player who already left the auction", () => {
    start(HUMANS(3));
    useGame.setState({ pendingSpaceAction: 1, turnPhase: "ACTION" });
    useGame.getState().declineBuy();

    useGame.getState().auctionLeave(0);
    // Player 0 is out; a stale click must not register.
    useGame.getState().auctionBid(0, 100);
    expect(useGame.getState().auction.currentBidderId).not.toBe(0);
  });

  it("keeps the turn with the same bidder when an earlier seat leaves", () => {
    start(HUMANS(4));
    useGame.setState({ pendingSpaceAction: 1, turnPhase: "ACTION" });
    useGame.getState().declineBuy();
    // Rotate the turn to player 2.
    useGame.setState((st) => ({ auction: { ...st.auction, turnIndex: 2 } }));
    expect(useGame.getState().auction.participants[useGame.getState().auction.turnIndex]).toBe(2);

    // Player 0 — who sits BEFORE the current bidder — drops out. Removing them
    // shifts the array, so a raw index would now point at the wrong player.
    useGame.getState().auctionLeave(0);
    const a = useGame.getState().auction;
    expect(a.participants).toEqual([1, 2, 3]);
    expect(a.participants[a.turnIndex]).toBe(2);
  });

  it("charges the winner and transfers ownership", () => {
    start(HUMANS(2));
    useGame.setState({ pendingSpaceAction: 1, turnPhase: "ACTION" });
    useGame.getState().declineBuy();

    useGame.getState().auctionBid(0, 100); // P1 bids
    useGame.getState().auctionLeave(1); // P2 drops → P1 wins at 100

    const s = useGame.getState();
    expect(s.ownership[1].ownerId).toBe(0);
    expect(s.players[0].properties).toContain(1);
    expect(s.players[0].balance).toBe(1500 - 100);
    expect(s.auction.isActive).toBe(false);
    expect(checkInvariants(s)).toEqual([]);
  });
});

describe("turn rotation", () => {
  it("counts a round only once per full cycle, even when seats are bankrupt", () => {
    start(HUMANS(3));
    // P1 is out of the game.
    useGame.setState((st) => ({
      players: st.players.map((p) => (p.id === 0 ? { ...p, bankrupt: true } : p)),
      currentPlayerIndex: 1,
    }));
    const round0 = useGame.getState().round;

    useGame.getState().endTurn(); // 1 → 2, same round
    expect(useGame.getState().currentPlayerIndex).toBe(2);
    expect(useGame.getState().round).toBe(round0);

    useGame.getState().endTurn(); // 2 → 1 (skips bankrupt 0), new round
    expect(useGame.getState().currentPlayerIndex).toBe(1);
    expect(useGame.getState().round).toBe(round0 + 1);
  });

  it("does not let a player end a turn that is not theirs", () => {
    start(HUMANS(2));
    const before = useGame.getState().currentPlayerIndex;
    useGame.getState().endTurn();
    expect(useGame.getState().currentPlayerIndex).not.toBe(before);
  });
});

describe("buying", () => {
  it("refuses to buy when the balance is short and keeps the space pending", () => {
    start(HUMANS(2), 10);
    useGame.setState({ pendingSpaceAction: 1, turnPhase: "ACTION" });
    useGame.getState().buyProperty();
    const s = useGame.getState();
    expect(s.ownership[1].ownerId).toBeNull();
    expect(s.pendingSpaceAction).toBe(1);
  });

  it("only the player on turn can buy the pending space", () => {
    start(HUMANS(2));
    useGame.setState({ pendingSpaceAction: 1, turnPhase: "ACTION", currentPlayerIndex: 0 });
    useGame.getState().buyProperty();
    expect(useGame.getState().players[0].properties).toContain(1);
    expect(useGame.getState().players[1].properties).not.toContain(1);
  });
});

describe("mid-animation safety (hotseat double-click)", () => {
  it("ignores endTurn while the token is still walking", () => {
    start(HUMANS(2));
    const seat = useGame.getState().currentPlayerIndex;
    useGame.setState({ turnPhase: "MOVING" });
    useGame.getState().endTurn();
    expect(useGame.getState().currentPlayerIndex).toBe(seat);
    expect(useGame.getState().turnPhase).toBe("MOVING");
  });

  it("ignores endTurn while a buy decision is still pending", () => {
    start(HUMANS(2));
    const seat = useGame.getState().currentPlayerIndex;
    useGame.setState({ turnPhase: "ACTION", pendingSpaceAction: 1 });
    useGame.getState().endTurn();
    expect(useGame.getState().currentPlayerIndex).toBe(seat);
    expect(useGame.getState().pendingSpaceAction).toBe(1);
  });

  it("keeps the walking token bound to the roller, not to whoever holds the seat", () => {
    start(HUMANS(2));
    useGame.setState((st) => ({
      players: st.players.map((p) => (p.id === 0 ? { ...p, position: 0 } : { ...p, position: 10 })),
      currentPlayerIndex: 0,
      turnPhase: "MOVING",
    }));
    useGame.getState().executeMove(5, false);
    // Two steps in, the seat is force-passed (simulating a stray endTurn / reset).
    vi.advanceTimersByTime(500);
    useGame.setState({ currentPlayerIndex: 1 });
    const p2Before = useGame.getState().players[1].position;
    vi.advanceTimersByTime(5000);
    // Player 2's token must NOT have been dragged along by player 1's animation.
    expect(useGame.getState().players[1].position).toBe(p2Before);
  });

  it("does not buy the same space twice on a double submit", () => {
    start(HUMANS(2), 1500);
    useGame.setState({ pendingSpaceAction: 1, turnPhase: "ACTION" });
    useGame.getState().buyProperty();
    const afterFirst = useGame.getState().players[0].balance;
    // A second click (or Space) arriving before React re-renders.
    useGame.getState().buyProperty();
    expect(useGame.getState().players[0].balance).toBe(afterFirst);
    expect(useGame.getState().players[0].properties.filter((i) => i === 1)).toHaveLength(1);
  });
});

describe("jail", () => {
  it("scales bail with wealth instead of a flat $50", () => {
    start(HUMANS(2), 5000);
    useGame.setState((st) => ({
      players: st.players.map((p) => (p.id === 0 ? { ...p, inJail: true, jailTurns: 0 } : p)),
      turnPhase: "WAITING_ROLL",
    }));
    const before = useGame.getState().players[0].balance;
    useGame.getState().jailDecision("PAY");
    const paid = before - useGame.getState().players[0].balance;
    expect(paid).toBeGreaterThan(50);
    expect(useGame.getState().players[0].inJail).toBe(false);
  });

  it("blocks building while jailed", () => {
    start(HUMANS(2), 5000);
    // Give P1 the full Brown set (indices 1 and 3) and jail them.
    useGame.setState((st) => ({
      players: st.players.map((p) => (p.id === 0 ? { ...p, inJail: true, properties: [1, 3] } : p)),
      ownership: {
        ...st.ownership,
        1: { ownerId: 0, mortgaged: false, houses: 0, hotel: false },
        3: { ownerId: 0, mortgaged: false, houses: 0, hotel: false },
      },
    }));
    useGame.getState().buildHouse(1, 1);
    expect(useGame.getState().buildings[1]?.houses ?? 0).toBe(0);
  });
});

describe("state integrity", () => {
  it("holds invariants through a full scripted game of dice rolls", () => {
    resetRng();
    seedRng(99);
    start([
      { name: "A", type: "HUMAN" },
      { name: "B", type: "AI", difficulty: "MEDIUM" },
    ]);
    for (let i = 0; i < 40; i++) {
      const s = useGame.getState();
      if (s.turnPhase === "GAME_OVER") break;
      if (s.turnPhase === "WAITING_ROLL") {
        s.rollDice();
        vi.advanceTimersByTime(15000);
      } else {
        // Resolve whatever is pending so the loop keeps moving.
        if (s.pendingSpaceAction !== null) s.declineBuy();
        if (s.auction.isActive) s.endAuction();
        if (s.pendingCard) s.dismissCard();
        vi.advanceTimersByTime(15000);
        if (useGame.getState().turnPhase === "POST_ACTION") useGame.getState().endTurn();
      }
      expect(checkInvariants(useGame.getState())).toEqual([]);
    }
  });
});
