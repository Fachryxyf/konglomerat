"use client";

import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
import { BOARD, COLOR_SETS, GO_INDEX, JAIL_INDEX, getPrice, getMortgageValue } from "./boardData";
import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS, shuffle } from "./cardData";
import { rollWaveEvent } from "./events";
import { rng } from "./rng";
import { parseIntent } from "./schemas";
import { validateIntent } from "./validateIntent";
import { assertInvariants } from "./invariants";
import type { Intent, IntentResult } from "./intents";
import { fiscalForRound, FISCAL_TAX, FISCAL_INFLATION, type FiscalDef } from "./fiscal";
import {
  DEFAULT_CENTRAL_RATE,
  DEFAULT_REGULATIONS,
  applyRentRegulation,
  creditLimit,
  loanInstallment,
  makeLoan,
  rollMonetaryPolicy,
  totalDebt,
} from "./bank";
import {
  CRIMES,
  BRIBE_GUARD_COST,
  BRIBE_GUARD_FINE,
  LOBBY_COST,
  LOBBY_FINE,
  EVADE_PAY_FRACTION,
  RIG_AUCTION_FINE,
  rigAuctionCost,
  catchChance,
  jailBail,
  jailedOwnerRent,
  HEAT_PER_CRIME,
  HEAT_ON_CAUGHT,
  HEAT_ON_RELEASE,
  HEAT_DECAY,
  HEAT_JAIL_THRESHOLD,
  MAX_HEAT,
  LOBBY_RENT_BONUS,
} from "./government";
import { aiShouldInvest } from "./ai";
import type {
  AIDifficulty,
  AuctionState,
  BoardSpace,
  ColorSet,
  GameCard,
  GameState,
  Loan,
  LogEntry,
  LogMsg,
  Player,
  PlayerType,
  TurnPhase,
} from "./types";
import { useLocale, translate } from "@/lib/i18n";

// Snapshot translator for transient, non-persisted text (event/policy banners,
// last-roll summary) — rendered once in the locale active at the time. The log
// itself stores keys+params (see addLog) and re-renders live on locale change.
const tr = (key: string, params?: LogMsg["params"]) =>
  translate(useLocale.getState().locale, key, params as Record<string, string | number | { tKey: string }> | undefined);
import {
  activePlayerCount,
  calculateRent,
  calculateUtilityRent,
  countPlayerBuildings,
  countRailroads,
  didPassGo,
  findWinner,
  getColorSetSpaces,
  getNextActivePlayer,
  getSpace,
  hasMonopoly,
  movePlayer,
  moveTo,
  nearestSpaceIndex,
  rollDice,
} from "./utils";

const EMPTY_AUCTION: AuctionState = {
  isActive: false, propertyIndex: null, currentBid: 0, currentBidderId: null,
  participants: [], passedPlayers: [], turnIndex: 0, sellerId: null, resumePhase: null,
};

const PLAYER_TOKENS = ["🎩", "🚗", "🐕", "🐱", "🚢", "👞", "🏍️", "🦴"];
const PLAYER_COLORS = [
  "#E53935",
  "#1E88E5",
  "#43A047",
  "#FB8C00",
  "#8E24AA",
  "#00ACC1",
  "#6D4C41",
  "#3949AB",
];

let logIdCounter = 1;

// Per-round probability of a random event firing, once past the first 10 rounds.
const WAVE_EVENT_CHANCE = 0.3;

interface GameStore extends GameState {
  init: (configs: { name: string; type: PlayerType; difficulty?: AIDifficulty }[], startingCash?: number) => void;
  reset: () => void;
  rollDice: () => void;
  endTurn: () => void;
  buyProperty: () => void;
  declineBuy: () => void; // triggers auction
  auctionOwnProperty: (spaceIndex: number) => void; // owner resells via auction
  auctionBid: (playerId: number, amount: number) => void;
  auctionPass: (playerId: number) => void;
  auctionLeave: (playerId: number) => void;
  endAuction: () => void;
  jailDecision: (decision: "PAY" | "CARD" | "ROLL") => void;
  buildHouse: (spaceIndex: number, count?: number) => void;
  sellHouse: (spaceIndex: number, count?: number) => void;
  buildHotel: (spaceIndex: number) => void;
  sellHotel: (spaceIndex: number) => void;
  mortgageProperty: (spaceIndex: number) => void;
  unmortgageProperty: (spaceIndex: number) => void;
  sellToBank: (spaceIndex: number) => void;
  takeLoan: (playerId: number, amount: number, term: number) => void;
  repayLoan: (playerId: number, loanId: number) => void;
  bribeGuard: (playerId: number) => void;
  lobbyRegulation: (playerId: number) => void;
  armEvasion: (playerId: number) => void;
  rigAuction: (playerId: number) => void;
  proposeTrade: (trade: {
    fromId: number;
    toId: number;
    cashFrom: number;
    cashTo: number;
    propertiesFrom: number[];
    propertiesTo: number[];
    goojFrom: number;
    goojTo: number;
  }) => void;
  acceptTrade: () => void;
  rejectTrade: () => void;
  dismissCard: () => void;
  payTenPercentTax: () => void;
  payFlatTax: () => void;
  aiTakeTurn: () => void;
  clearPendingSpace: () => void;
  dismissRent: () => void;
  clearEvent: () => void;
  resolveFiscalChoice: (choiceId: string) => void;
  resolveRescue: (invest: boolean) => void;
  addLog: (key: string, params?: LogMsg["params"], kind?: LogEntry["kind"], playerId?: number | null) => void;
  // Validated entry point: parse (schema) → validate (rules) → apply → check
  // invariants. The single gateway an authoritative server will mirror. `actorId`
  // defaults to the current player; never trust an actor from the payload.
  dispatch: (raw: unknown, actorId?: number) => IntentResult;
  // Internal methods (still accessible via store)
  executeMove: (steps: number, isDoubles: boolean) => void;
  executeAnimatedMoveTo: (target: number, collectGoOnPass: boolean, onArrive: () => void) => void;
  handleSpaceLanding: (spaceIndex: number, isDoubles: boolean) => void;
  handleSpaceLandingWithMultiplier: (spaceIndex: number, multiplier: number) => void;
  drawCard: (deckType: "CHANCE" | "COMMUNITY_CHEST") => void;
  executeCardEffect: (card: GameCard) => void;
  proceedAfterAction: (isDoubles: boolean) => void;
  pendingTrade: {
    fromId: number;
    toId: number;
    cashFrom: number;
    cashTo: number;
    propertiesFrom: number[];
    propertiesTo: number[];
    goojFrom: number;
    goojTo: number;
  } | null;
}

function makeInitialOwnership(): GameState["ownership"] {
  const ownership: GameState["ownership"] = {};
  for (const space of BOARD) {
    ownership[space.index] = { ownerId: null, mortgaged: false, houses: 0, hotel: false };
  }
  return ownership;
}

function makeInitialBuildings(): GameState["buildings"] {
  const buildings: GameState["buildings"] = {};
  for (const space of BOARD) {
    if (space.type === "PROPERTY") {
      buildings[space.index] = { houses: 0, hotel: false };
    }
  }
  return buildings;
}

function makeInitialState(): GameState {
  return {
    players: [],
    currentPlayerIndex: 0,
    turnPhase: "WAITING_ROLL",
    doublesCount: 0,
    lastDiceRoll: { die1: 0, die2: 0, isDoubles: false },
    board: BOARD,
    ownership: makeInitialOwnership(),
    buildings: makeInitialBuildings(),
    chanceDeck: shuffle(CHANCE_CARDS),
    chanceDiscard: [],
    communityChestDeck: shuffle(COMMUNITY_CHEST_CARDS),
    communityChestDiscard: [],
    bank: { houses: 32, hotels: 12 },
    auction: EMPTY_AUCTION,
    log: [],
    turn: 1,
    round: 1,
    centralRate: DEFAULT_CENTRAL_RATE,
    regulations: { ...DEFAULT_REGULATIONS },
    eventMessage: null,
    pendingFiscal: null,
    pendingRescue: null,
    winnerId: null,
    pendingCard: null,
    pendingSpaceAction: null,
    pendingRent: null,
    lastRollSummary: "",
  };
}

// Debounced localStorage so we don't JSON.stringify + write the whole game state
// on every single set() (dice animation steps, rapid AI actions, etc.) — that was
// the main source of in-game lag. We coalesce writes to at most one per `delay`.
type SaveShape = Partial<GameStore>;
function createDebouncedStorage(delay = 800): PersistStorage<SaveShape> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { name: string; value: StorageValue<SaveShape> } | null = null;
  const flush = () => {
    timer = null;
    if (!pending || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(pending.name, JSON.stringify(pending.value));
    } catch {}
    pending = null;
  };
  return {
    getItem: (name) => {
      if (typeof window === "undefined") return null;
      const str = window.localStorage.getItem(name);
      return str ? (JSON.parse(str) as StorageValue<SaveShape>) : null;
    },
    setItem: (name, value) => {
      pending = { name, value };
      if (!timer) timer = setTimeout(flush, delay);
    },
    removeItem: (name) => {
      if (typeof window !== "undefined") window.localStorage.removeItem(name);
    },
  };
}

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
  ...makeInitialState(),
  pendingTrade: null,

  addLog: (key, params, kind = "SYSTEM", playerId = null) => {
    set((s) => ({
      log: [
        ...s.log,
        { id: logIdCounter++, turn: s.turn, playerId, msg: { key, params }, kind },
      ].slice(-200),
    }));
  },

  dispatch: (raw, actorId) => {
    // 1) Shape & bounds (anti parameter injection).
    const parsed = parseIntent(raw);
    if (!parsed.ok) return parsed;
    const intent = parsed.intent;
    const actor = actorId ?? get().currentPlayerIndex;
    // 2) Rules vs authoritative state (anti-cheat).
    const verdict = validateIntent(get(), intent, actor);
    if (!verdict.ok) return verdict;
    // 3) Apply via the existing action layer.
    applyIntentToStore(get, intent, actor);
    // 4) Integrity check (dev warning; a server would reject on violation).
    if (process.env.NODE_ENV !== "production") assertInvariants(get(), intent.type);
    return { ok: true };
  },

  init: (configs, startingCash = 500) => {
    const players: Player[] = configs.map((c, i) => ({
      id: i,
      name: c.name,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      token: PLAYER_TOKENS[i % PLAYER_TOKENS.length],
      type: c.type,
      difficulty: c.difficulty ?? "MEDIUM",
      balance: startingCash,
      position: GO_INDEX,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      properties: [],
      bankrupt: false,
      isActive: true,
      investorId: null,
      pactTarget: 0,
      pactPaid: 0,
      loans: [],
      heat: 0,
      jailCount: 0,
      evadeNextRent: false,
      lobbyActive: false,
    }));
    set({
      ...makeInitialState(),
      players,
      currentPlayerIndex: 0,
      turnPhase: "WAITING_ROLL",
    });
    get().addLog("log.game.start", { count: players.length, cash: startingCash.toLocaleString() }, "SYSTEM");
    get().addLog("log.turn.startRoll", { name: players[0].name }, "SYSTEM", 0);
  },

  reset: () => {
    logIdCounter = 1;
    set({ ...makeInitialState(), pendingTrade: null });
  },

  rollDice: () => {
    const s = get();
    if (s.turnPhase !== "WAITING_ROLL" && s.turnPhase !== "JAIL_DECISION") return;
    const player = s.players[s.currentPlayerIndex];
    if (!player) return;

    // If in jail and rolling to escape
    if (player.inJail && s.turnPhase !== "JAIL_DECISION") return;

    const roll = rollDice();
    set({
      lastDiceRoll: { die1: roll.die1, die2: roll.die2, isDoubles: roll.isDoubles },
      turnPhase: "ROLLING_DICE",
      lastRollSummary: tr("log.roll.summary", { name: player.name, d1: roll.die1, d2: roll.die2, total: roll.total }),
    });
    get().addLog(
      "log.roll.dice",
      { name: player.name, d1: roll.die1, d2: roll.die2, total: roll.total, doubles: roll.isDoubles ? { tKey: "log.roll.doublesSuffix" } : "" },
      "ROLL",
      player.id,
    );

    // Handle jail roll
    if (player.inJail) {
      if (roll.isDoubles) {
        get().addLog("log.jail.outDoubles", { name: player.name }, "JAIL", player.id);
        set((st) => ({
          players: st.players.map((p, i) =>
            i === st.currentPlayerIndex ? { ...p, inJail: false, jailTurns: 0, heat: Math.min(MAX_HEAT, p.heat + HEAT_ON_RELEASE) } : p,
          ),
          turnPhase: "MOVING",
        }));
        // Continue with movement
        setTimeout(() => get().executeMove(roll.total, roll.isDoubles), 600);
        return;
      } else {
        const newJailTurns = player.jailTurns + 1;
        if (newJailTurns >= 3) {
          // Forced to post bail (scales with repeat offences + wealth).
          const bail = jailBail(player.jailCount, getNetWorthPublic(get(), player.id));
          get().addLog(
            "log.jail.forcedBail",
            { name: player.name, bail },
            "JAIL",
            player.id,
          );
          // Pay bail (auto-liquidate if short); bankrupt if truly can't afford it.
          set((st) => ({
            players: st.players.map((p, i) =>
              i === st.currentPlayerIndex
                ? { ...p, inJail: false, jailTurns: 0, balance: p.balance - bail, heat: Math.min(MAX_HEAT, p.heat + HEAT_ON_RELEASE) }
                : p,
            ),
          }));
          if (get().players[get().currentPlayerIndex].balance < 0) {
            liquidateForDebt(get, set, get().currentPlayerIndex, 0);
          }
          if (get().players[get().currentPlayerIndex].balance < 0) {
            declareBankruptcy(get, set, get().currentPlayerIndex, null);
            if (get().turnPhase !== "GAME_OVER") get().proceedAfterAction(false);
            return;
          }
          set({ turnPhase: "MOVING" });
          setTimeout(() => get().executeMove(roll.total, false), 600);
          return;
        } else {
          get().addLog(
            "log.jail.stay",
            { name: player.name, attempt: newJailTurns },
            "JAIL",
            player.id,
          );
          set((st) => ({
            players: st.players.map((p, i) =>
              i === st.currentPlayerIndex ? { ...p, jailTurns: newJailTurns } : p,
            ),
            turnPhase: "POST_ACTION",
          }));
          setTimeout(() => get().endTurn(), 800);
          return;
        }
      }
    }

    // Handle doubles count
    if (roll.isDoubles) {
      const newDoubles = s.doublesCount + 1;
      if (newDoubles >= 3) {
        get().addLog(
          "log.jail.tripleDoubles",
          { name: player.name },
          "JAIL",
          player.id,
        );
        set((st) => ({
          players: st.players.map((p, i) =>
            i === st.currentPlayerIndex
              ? { ...p, position: JAIL_INDEX, inJail: true, jailTurns: 0, jailCount: p.jailCount + 1 }
              : p,
          ),
          doublesCount: 0,
          turnPhase: "POST_ACTION",
        }));
        setTimeout(() => get().endTurn(), 800);
        return;
      }
      set({ doublesCount: newDoubles });
    } else {
      set({ doublesCount: 0 });
    }

    set({ turnPhase: "MOVING" });
    setTimeout(() => get().executeMove(roll.total, roll.isDoubles), 600);
  },

  // Internal function: execute movement - animated step by step
  executeMove: (steps: number, isDoubles: boolean) => {
    const s = get();
    const player = s.players[s.currentPlayerIndex];
    if (!player) return;
    // Bind the walk to the player who rolled. Each step lands in a later tick, so
    // reading `currentPlayerIndex` again would move whoever holds the seat by then
    // — a real hazard in hotseat play, where a fast click can pass the turn
    // mid-animation and teleport the next player.
    const moverId = player.id;
    const startPos = player.position;
    const STEP_DELAY = 220; // ms per step

    const totalSteps = Math.abs(steps);
    const direction = steps >= 0 ? 1 : -1;

    set({ turnPhase: "MOVING" });

    if (totalSteps === 0) {
      set({ turnPhase: "ACTION" });
      setTimeout(() => get().handleSpaceLanding(startPos, isDoubles), 100);
      return;
    }

    let stepCount = 0;
    const stepOnce = () => {
      const cur = get();
      // The seat changed under us (reset, or the turn advanced) — abandon the walk
      // rather than moving the wrong token.
      if (cur.players[cur.currentPlayerIndex]?.id !== moverId) return;
      const curPlayer = cur.players[moverId];
      if (!curPlayer) return;
      const nextPos = ((curPlayer.position + direction) % 40 + 40) % 40;
      let newBalance = curPlayer.balance;
      let crossedGo = false;
      // Going forward: passing GO = landing on or wrapping past index 0
      // We detect wrap: if direction > 0 and nextPos < curPlayer.position (e.g. 39 -> 0)
      // OR if direction > 0 and nextPos === 0 (lands exactly on GO)
      if (direction > 0 && (nextPos === 0 || nextPos < curPlayer.position)) {
        // We've wrapped past 39 to 0+ — i.e. we passed GO
        newBalance += 200;
        crossedGo = true;
      }
      set((st) => ({
        players: st.players.map((p) =>
          p.id === moverId ? { ...p, position: nextPos, balance: newBalance } : p,
        ),
      }));
      if (crossedGo) {
        get().addLog("log.move.passGo", { name: curPlayer.name }, "MOVE", curPlayer.id);
      }
      stepCount++;
      if (stepCount < totalSteps) {
        setTimeout(stepOnce, STEP_DELAY);
      } else {
        // Final step - now trigger landing
        const finalState = get();
        const finalPlayer = finalState.players[moverId];
        const finalPos = finalPlayer.position;
        finalState.addLog(
          "log.move.landed",
          { name: finalPlayer.name, space: { tKey: `board.${finalPos}.name` } },
          "MOVE",
          finalPlayer.id,
        );
        set({ turnPhase: "ACTION" });
        setTimeout(() => get().handleSpaceLanding(finalPos, isDoubles), 250);
      }
    };

    setTimeout(stepOnce, STEP_DELAY);
  },

  // Internal: handle landing on space
  handleSpaceLanding: (spaceIndex: number, isDoubles: boolean) => {
    const s = get();
    const player = s.players[s.currentPlayerIndex];
    if (!player) return;
    const space = getSpace(spaceIndex);

    if (space.type === "GO") {
      get().addLog("log.land.go", { name: player.name }, "ACTION", player.id);
      get().proceedAfterAction(isDoubles);
      return;
    }
    if (space.type === "JAIL") {
      get().addLog("log.land.visitingJail", { name: player.name }, "ACTION", player.id);
      get().proceedAfterAction(isDoubles);
      return;
    }
    if (space.type === "FREE_PARKING") {
      get().addLog("log.land.freeParking", { name: player.name }, "ACTION", player.id);
      get().proceedAfterAction(isDoubles);
      return;
    }
    if (space.type === "GO_TO_JAIL") {
      get().addLog("log.land.goToJail", { name: player.name }, "JAIL", player.id);
      set((st) => ({
        players: st.players.map((p, i) =>
          i === st.currentPlayerIndex
            ? { ...p, position: JAIL_INDEX, inJail: true, jailTurns: 0, jailCount: p.jailCount + 1 }
            : p,
        ),
        doublesCount: 0,
        turnPhase: "POST_ACTION",
      }));
      setTimeout(() => get().endTurn(), 800);
      return;
    }
    if (space.type === "TAX") {
      const taxSpace = space as { taxType: "INCOME" | "LUXURY"; amount: number };
      if (taxSpace.taxType === "INCOME") {
        // Player must choose between $200 or 10%
        set({ pendingSpaceAction: spaceIndex, turnPhase: "ACTION" });
        return; // UI will handle the decision
      } else {
        // Luxury tax: $100
        get().addLog("log.tax.luxury", { name: player.name }, "PAYMENT", player.id);
        set((st) => ({
          players: st.players.map((p, i) =>
            i === st.currentPlayerIndex ? { ...p, balance: p.balance - 100 } : p,
          ),
        }));
        checkBankruptcyAndProceed(get, set, isDoubles);
        return;
      }
    }
    if (space.type === "CHANCE" || space.type === "COMMUNITY_CHEST") {
      get().drawCard(space.type);
      return;
    }
    if (space.type === "PROPERTY" || space.type === "RAILROAD" || space.type === "UTILITY") {
      const ownership = s.ownership[spaceIndex];
      if (!ownership || ownership.ownerId === null) {
        // Unowned - player can buy or trigger auction
        set({ pendingSpaceAction: spaceIndex, turnPhase: "ACTION" });
        return;
      } else if (ownership.ownerId === player.id) {
        get().addLog("log.land.ownProperty", { name: player.name }, "ACTION", player.id);
        get().proceedAfterAction(isDoubles);
        return;
      } else {
        // Pay rent
        if (ownership.mortgaged) {
          get().addLog(
            "log.land.mortgaged",
            { name: player.name, space: { tKey: `board.${spaceIndex}.name` } },
            "ACTION",
            player.id,
          );
          get().proceedAfterAction(isDoubles);
          return;
        }
        const owner = s.players[ownership.ownerId];
        let rent = 0;
        let isUtility = false;
        let multiplier = 1;
        if (space.type === "UTILITY") {
          isUtility = true;
          rent = calculateUtilityRent(s, spaceIndex, s.lastDiceRoll.die1 + s.lastDiceRoll.die2);
          // Determine which multiplier applied
          const utilCount = countUtilitiesPublic(s, owner.id);
          multiplier = utilCount === 2 ? 10 : 4;
        } else {
          rent = calculateRent(s, spaceIndex, s.lastDiceRoll.die1 + s.lastDiceRoll.die2);
        }
        // Apply investor-pact rent rules (free for investor, base rent for vassal).
        const adj = pactAdjustRent(s, player.id, owner.id, rent, spaceIndex);
        rent = adj.rent;
        if (adj.note) get().addLog(adj.note.key, adj.note.params, "ACTION", player.id);
        // Government rent regulation (rent control / deregulation).
        rent = applyRentRegulation(s, rent);
        // Owner-side: lobby perk / jailed-owner penalty.
        rent = applyOwnerRentMods(get(), owner.id, rent);
        // Payer-side: book-cooking evasion (may audit + fine + jail).
        rent = applyEvasion(get, set, player.id, rent);
        get().addLog(
          "log.rent.pay",
          { name: player.name, rent, owner: owner.name, space: { tKey: `board.${spaceIndex}.name` } },
          "PAYMENT",
          player.id,
        );
        transferMoney(get, set, player.id, owner.id, rent);
        routePactShare(get, set, owner.id, player.id, rent);
        // Show rent payment modal to all players
        set({
          pendingRent: {
            payerId: player.id,
            payeeId: owner.id,
            spaceIndex,
            amount: rent,
            diceTotal: s.lastDiceRoll.die1 + s.lastDiceRoll.die2,
            isUtility,
            multiplier,
          },
        });
        // Delay proceedAfterAction to let modal show
        setTimeout(() => {
          checkBankruptcyAndProceed(get, set, isDoubles, owner.id);
        }, 100);
        return;
      }
    }
  },

  drawCard: (deckType: "CHANCE" | "COMMUNITY_CHEST") => {
    const s = get();
    const player = s.players[s.currentPlayerIndex];
    if (!player) return;
    let deck = deckType === "CHANCE" ? s.chanceDeck : s.communityChestDeck;
    let discard = deckType === "CHANCE" ? s.chanceDiscard : s.communityChestDiscard;
    if (deck.length === 0) {
      deck = shuffle(discard);
      discard = [];
    }
    const card = deck[0];
    const rest = deck.slice(1);
    if (deckType === "CHANCE") {
      set({ chanceDeck: rest, chanceDiscard: discard });
    } else {
      set({ communityChestDeck: rest, communityChestDiscard: discard });
    }
    get().addLog("log.card.draw", { name: player.name, deck: { tKey: `card.deck.${deckType}` }, instruction: { tKey: `card.${card.deck}.${card.id}` } }, "CARD", player.id);
    set({ pendingCard: card, turnPhase: "CARD_DRAW" });
  },

  dismissCard: () => {
    const s = get();
    if (!s.pendingCard) return;
    const card = s.pendingCard;
    const player = s.players[s.currentPlayerIndex];
    if (!player) return;
    // Move card to discard unless it's a Get Out of Jail Free kept by player
    if (card.type !== "GET_OUT_OF_JAIL") {
      if (card.deck === "CHANCE") {
        set((st) => ({ chanceDiscard: [...st.chanceDiscard, card] }));
      } else {
        set((st) => ({ communityChestDiscard: [...st.communityChestDiscard, card] }));
      }
    }
    set({ pendingCard: null });
    // After card effects have been applied during display, proceed
    get().executeCardEffect(card);
  },

  // Internal: animated move to a specific target position (forward only)
  // collectGoOnPass: if true, player collects $200 when passing/landing on GO
  // onArrive: callback when animation finishes
  executeAnimatedMoveTo: (target: number, collectGoOnPass: boolean, onArrive: () => void) => {
    const s = get();
    const player = s.players[s.currentPlayerIndex];
    if (!player) {
      onArrive();
      return;
    }
    // Bind to the mover by id — later animation ticks must not move whoever
    // happens to hold the seat by then (see executeMove).
    const moverId = player.id;
    const startPos = player.position;
    // Forward distance to target (always move forward in Monopoly)
    let steps = (target - startPos + 40) % 40;
    if (steps === 0 && startPos !== target) steps = 40; // shouldn't happen but safe
    if (steps === 0) {
      onArrive();
      return;
    }
    const STEP_DELAY = 200;
    set({ turnPhase: "MOVING" });

    let stepCount = 0;
    const stepOnce = () => {
      const cur = get();
      if (cur.players[cur.currentPlayerIndex]?.id !== moverId) return;
      const curPlayer = cur.players[moverId];
      if (!curPlayer) return;
      const nextPos = ((curPlayer.position + 1) % 40 + 40) % 40;
      let newBalance = curPlayer.balance;
      let crossedGo = false;
      if (nextPos === 0 || nextPos < curPlayer.position) {
        // Wrapped past GO
        if (collectGoOnPass) {
          newBalance += 200;
          crossedGo = true;
        }
      }
      set((st) => ({
        players: st.players.map((p) =>
          p.id === moverId ? { ...p, position: nextPos, balance: newBalance } : p,
        ),
      }));
      if (crossedGo) {
        get().addLog("log.move.passGo", { name: curPlayer.name }, "MOVE", curPlayer.id);
      }
      stepCount++;
      if (stepCount < steps) {
        setTimeout(stepOnce, STEP_DELAY);
      } else {
        // Arrived
        onArrive();
      }
    };
    setTimeout(stepOnce, STEP_DELAY);
  },

  // Internal: apply card effect
  executeCardEffect: (card: GameCard) => {
    const s = get();
    const player = s.players[s.currentPlayerIndex];
    if (!player) return;
    let needToProceed = true;

    switch (card.type) {
      case "MOVE_TO": {
        const target = card.targetPosition ?? 0;
        const collectGo = card.collectGo ?? false;
        get().addLog(
          "log.move.toSpace",
          { name: player.name, space: { tKey: `board.${target}.name` } },
          "MOVE",
          player.id,
        );
        get().executeAnimatedMoveTo(target, collectGo, () => {
          set({ turnPhase: "ACTION" });
          setTimeout(() => get().handleSpaceLanding(target, false), 200);
        });
        needToProceed = false;
        break;
      }
      case "MOVE_TO_NEAREST": {
        const target = nearestSpaceIndex(player.position, card.targetType!);
        const collectGo = card.collectGo ?? false;
        const multiplier = card.rentMultiplier ?? 1;
        get().addLog("log.move.toSpace", { name: player.name, space: { tKey: `board.${target}.name` } }, "MOVE", player.id);
        get().executeAnimatedMoveTo(target, collectGo, () => {
          set({ turnPhase: "ACTION" });
          setTimeout(() => get().handleSpaceLandingWithMultiplier(target, multiplier), 200);
        });
        needToProceed = false;
        break;
      }
      case "MOVE_SPACES": {
        const steps = card.spaces ?? 0;
        // Use animated step move (works for both forward and backward)
        // For MOVE_SPACES, never collect GO (per rules - "go back 3 spaces" doesn't pass GO)
        const STEP_DELAY = 200;
        const totalSteps = Math.abs(steps);
        const direction = steps >= 0 ? 1 : -1;
        set({ turnPhase: "MOVING" });
        let stepCount = 0;
        const stepOnce = () => {
          const cur = get();
          const curPlayer = cur.players[cur.currentPlayerIndex];
          if (!curPlayer) return;
          const nextPos = ((curPlayer.position + direction) % 40 + 40) % 40;
          set((st) => ({
            players: st.players.map((p, i) =>
              i === st.currentPlayerIndex ? { ...p, position: nextPos } : p,
            ),
          }));
          stepCount++;
          if (stepCount < totalSteps) {
            setTimeout(stepOnce, STEP_DELAY);
          } else {
            const finalState = get();
            const finalPos = finalState.players[finalState.currentPlayerIndex].position;
            finalState.addLog(
              "log.move.landed",
              { name: curPlayer.name, space: { tKey: `board.${finalPos}.name` } },
              "MOVE",
              curPlayer.id,
            );
            set({ turnPhase: "ACTION" });
            setTimeout(() => get().handleSpaceLanding(finalPos, false), 200);
          }
        };
        if (totalSteps === 0) {
          set({ turnPhase: "ACTION" });
          setTimeout(() => get().handleSpaceLanding(player.position, false), 100);
        } else {
          get().addLog("log.move.spaces", { name: player.name, steps }, "MOVE", player.id);
          setTimeout(stepOnce, STEP_DELAY);
        }
        needToProceed = false;
        break;
      }
      case "COLLECT": {
        const amount = card.amount ?? 0;
        set((st) => ({
          players: st.players.map((p, i) =>
            i === st.currentPlayerIndex ? { ...p, balance: p.balance + amount } : p,
          ),
        }));
        get().addLog("log.bank.receive", { name: player.name, amount }, "PAYMENT", player.id);
        break;
      }
      case "PAY": {
        const amount = card.amount ?? 0;
        set((st) => ({
          players: st.players.map((p, i) =>
            i === st.currentPlayerIndex ? { ...p, balance: p.balance - amount } : p,
          ),
        }));
        get().addLog("log.bank.pay", { name: player.name, amount }, "PAYMENT", player.id);
        break;
      }
      case "COLLECT_FROM_EACH": {
        const amount = card.amount ?? 0;
        let collected = 0;
        for (const p of s.players) {
          if (p.id === player.id || p.bankrupt) continue;
          const pay = Math.min(p.balance, amount);
          collected += pay;
        }
        set((st) => ({
          players: st.players.map((p) => {
            if (p.id === player.id) return { ...p, balance: p.balance + collected };
            if (p.bankrupt) return p;
            return { ...p, balance: Math.max(0, p.balance - amount) };
          }),
        }));
        get().addLog("log.collectEach", { name: player.name, amount, total: collected }, "PAYMENT", player.id);
        break;
      }
      case "PAY_EACH": {
        const amount = card.amount ?? 0;
        const totalPay = amount * s.players.filter((p) => !p.bankrupt && p.id !== player.id).length;
        set((st) => ({
          players: st.players.map((p) => {
            if (p.id === player.id) return { ...p, balance: p.balance - totalPay };
            if (p.bankrupt) return p;
            return { ...p, balance: p.balance + amount };
          }),
        }));
        get().addLog("log.payEach", { name: player.name, amount, total: totalPay }, "PAYMENT", player.id);
        break;
      }
      case "REPAIRS": {
        const { houses, hotels } = countPlayerBuildings(s, player.id);
        const cost = houses * (card.perHouse ?? 0) + hotels * (card.perHotel ?? 0);
        set((st) => ({
          players: st.players.map((p, i) =>
            i === st.currentPlayerIndex ? { ...p, balance: p.balance - cost } : p,
          ),
        }));
        get().addLog("log.repairs", { name: player.name, houses, perHouse: card.perHouse ?? 0, hotels, perHotel: card.perHotel ?? 0, cost }, "PAYMENT", player.id);
        break;
      }
      case "GO_TO_JAIL": {
        set((st) => ({
          players: st.players.map((p, i) =>
            i === st.currentPlayerIndex
              ? { ...p, position: JAIL_INDEX, inJail: true, jailTurns: 0, jailCount: p.jailCount + 1 }
              : p,
          ),
          doublesCount: 0,
          turnPhase: "POST_ACTION",
        }));
        get().addLog("log.jail.fromCard", { name: player.name }, "JAIL", player.id);
        setTimeout(() => get().endTurn(), 600);
        needToProceed = false;
        break;
      }
      case "GET_OUT_OF_JAIL": {
        set((st) => ({
          players: st.players.map((p, i) =>
            i === st.currentPlayerIndex ? { ...p, getOutOfJailCards: p.getOutOfJailCards + 1 } : p,
          ),
        }));
        get().addLog("log.card.goojKeep", { name: player.name }, "CARD", player.id);
        break;
      }
    }

    if (needToProceed) {
      // Exit CARD_DRAW phase before settling (prevents endTurn early-return bug).
      set({ turnPhase: "ACTION" });
      // Liquidate / declare bankruptcy if the card payment put the player underwater,
      // then advance the turn (handles the winner check too).
      checkBankruptcyAndProceed(get, set, false, null);
    }
  },

  // Internal: handle space landing with rent multiplier (from chance card)
  handleSpaceLandingWithMultiplier: (spaceIndex: number, multiplier: number) => {
    const s = get();
    const player = s.players[s.currentPlayerIndex];
    if (!player) return;
    const space = getSpace(spaceIndex);
    const ownership = s.ownership[spaceIndex];

    if (!ownership || ownership.ownerId === null) {
      // Unowned - can buy
      set({ pendingSpaceAction: spaceIndex, turnPhase: "ACTION" });
      return;
    }
    if (ownership.ownerId === player.id) {
      get().addLog("log.land.ownProperty", { name: player.name }, "ACTION", player.id);
      get().proceedAfterAction(false);
      return;
    }
    if (ownership.mortgaged) {
      get().addLog("log.land.mortgaged", { name: player.name, space: { tKey: `board.${spaceIndex}.name` } }, "ACTION", player.id);
      get().proceedAfterAction(false);
      return;
    }
    const owner = s.players[ownership.ownerId];
    let rent = 0;
    let isUtility = false;
    let actualMultiplier = multiplier;
    if (space.type === "UTILITY") {
      // Force 10x multiplier from chance card
      isUtility = true;
      actualMultiplier = 10;
      rent = 10 * (s.lastDiceRoll.die1 + s.lastDiceRoll.die2);
    } else if (space.type === "RAILROAD") {
      const count = countRailroads(s, owner.id);
      const baseRent = (space as { rent: number[] }).rent[count - 1];
      rent = baseRent * multiplier;
    } else {
      rent = calculateRent(s, spaceIndex, s.lastDiceRoll.die1 + s.lastDiceRoll.die2, multiplier);
    }
    const adjM = pactAdjustRent(s, player.id, owner.id, rent, spaceIndex);
    rent = adjM.rent;
    if (adjM.note) get().addLog(adjM.note.key, adjM.note.params, "ACTION", player.id);
    rent = applyRentRegulation(s, rent);
    rent = applyOwnerRentMods(get(), owner.id, rent);
    rent = applyEvasion(get, set, player.id, rent);
    get().addLog(
      "log.rent.payMult",
      { name: player.name, rent, owner: owner.name, space: { tKey: `board.${spaceIndex}.name` }, mult: multiplier },
      "PAYMENT",
      player.id,
    );
    transferMoney(get, set, player.id, owner.id, rent);
    routePactShare(get, set, owner.id, player.id, rent);
    // Show rent payment modal
    set({
      pendingRent: {
        payerId: player.id,
        payeeId: owner.id,
        spaceIndex,
        amount: rent,
        diceTotal: s.lastDiceRoll.die1 + s.lastDiceRoll.die2,
        isUtility,
        multiplier: actualMultiplier,
      },
    });
    setTimeout(() => {
      checkBankruptcyAndProceed(get, set, false, owner.id);
    }, 100);
  },

  proceedAfterAction: (isDoubles: boolean) => {
    const s = get();
    const winner = findWinner(s);
    if (winner !== null) {
      set({ winnerId: winner, turnPhase: "GAME_OVER" });
      get().addLog("log.game.win", { name: s.players[winner].name }, "SYSTEM");
      return;
    }
    if (isDoubles) {
      set({ turnPhase: "WAITING_ROLL" });
      get().addLog("log.turn.again", { name: s.players[s.currentPlayerIndex].name }, "SYSTEM", s.currentPlayerIndex);
    } else {
      set({ turnPhase: "POST_ACTION" });
      setTimeout(() => get().endTurn(), 400);
    }
  },

  buyProperty: () => {
    const s = get();
    if (s.pendingSpaceAction === null) return;
    if (s.turnPhase !== "ACTION") return;
    const spaceIndex = s.pendingSpaceAction;
    // Guard against a double-submit (two clicks / click + Space) buying a space
    // that has already changed hands this tick.
    if (s.ownership[spaceIndex]?.ownerId != null) return;
    const space = getSpace(spaceIndex);
    const player = s.players[s.currentPlayerIndex];
    const price = getPrice(space);
    if (player.balance < price) {
      get().addLog("log.buy.insufficient", { name: player.name, space: { tKey: `board.${spaceIndex}.name` } }, "SYSTEM", player.id);
      return;
    }
    set((st) => ({
      players: st.players.map((p, i) =>
        i === st.currentPlayerIndex
          ? { ...p, balance: p.balance - price, properties: [...p.properties, spaceIndex] }
          : p,
      ),
      ownership: {
        ...st.ownership,
        [spaceIndex]: { ...st.ownership[spaceIndex], ownerId: st.players[st.currentPlayerIndex].id },
      },
      pendingSpaceAction: null,
    }));
    get().addLog("log.buy.bought", { name: player.name, space: { tKey: `board.${spaceIndex}.name` }, price }, "ACTION", player.id);
    get().proceedAfterAction(get().lastDiceRoll.isDoubles);
  },

  declineBuy: () => {
    const s = get();
    if (s.pendingSpaceAction === null) return;
    if (s.turnPhase !== "ACTION") return;
    if (s.auction.isActive) return;
    const spaceIndex = s.pendingSpaceAction;
    // Start auction
    const participants = s.players.filter((p) => !p.bankrupt).map((p) => p.id);
    set({
      pendingSpaceAction: null,
      auction: { ...EMPTY_AUCTION, isActive: true, propertyIndex: spaceIndex, participants },
      turnPhase: "AUCTION",
    });
    get().addLog("log.auction.start", { space: { tKey: `board.${spaceIndex}.name` } }, "AUCTION");
  },

  // Owner puts one of their own building-free properties up for auction to raise
  // cash. Proceeds go to the owner; if nobody bids it stays theirs. The owner's
  // turn resumes afterwards (it doesn't auto-end).
  auctionOwnProperty: (spaceIndex) => {
    const s = get();
    const owner = s.players[s.currentPlayerIndex];
    if (!owner || s.ownership[spaceIndex]?.ownerId !== owner.id) return;
    if (s.auction.isActive || s.turnPhase === "AUCTION") return;
    const space = getSpace(spaceIndex);
    // No buildings anywhere in the color set (same rule as mortgaging).
    if (space.type === "PROPERTY") {
      const setIdx = getColorSetSpaces((space as { colorSet: ColorSet }).colorSet);
      for (const i of setIdx) {
        const b = s.buildings[i];
        if (b && (b.houses > 0 || b.hotel)) {
          get().addLog("log.auction.cantBuildings", { space: { tKey: `board.${spaceIndex}.name` } }, "SYSTEM");
          return;
        }
      }
    }
    const participants = s.players.filter((p) => !p.bankrupt && p.id !== owner.id).map((p) => p.id);
    if (participants.length === 0) {
      get().addLog("log.auction.noOthers", undefined, "SYSTEM");
      return;
    }
    set({
      auction: { ...EMPTY_AUCTION, isActive: true, propertyIndex: spaceIndex, participants, sellerId: owner.id, resumePhase: s.turnPhase },
      turnPhase: "AUCTION",
    });
    get().addLog("log.auction.ownerSells", { name: owner.name, space: { tKey: `board.${spaceIndex}.name` } }, "AUCTION", owner.id);
  },

  auctionBid: (playerId, amount) => {
    const s = get();
    if (!s.auction.isActive) return;
    const player = s.players[playerId];
    if (!player || player.bankrupt) return;
    // Only a live participant may bid, and only when the rotation is on them —
    // otherwise a stale click (or a tampered call) could snipe out of turn.
    if (!s.auction.participants.includes(playerId)) return;
    if (s.auction.participants[s.auction.turnIndex] !== playerId) return;
    if (amount <= s.auction.currentBid) return;
    if (amount > player.balance) return;

    // If only 1 participant, they win immediately with this bid
    if (s.auction.participants.length === 1) {
      get().addLog("log.auction.bid", { name: player.name, amount }, "AUCTION", playerId);
      resolveAuctionWin(get, set, playerId, amount, s.auction.propertyIndex!);
      return;
    }

    set({
      auction: {
        ...s.auction,
        currentBid: amount,
        currentBidderId: playerId,
        turnIndex: (s.auction.turnIndex + 1) % s.auction.participants.length,
      },
    });
    get().addLog("log.auction.bid", { name: player.name, amount }, "AUCTION", playerId);
  },

  auctionPass: (playerId) => {
    const s = get();
    if (!s.auction.isActive) return;
    // Pass = leave the auction
    get().auctionLeave(playerId);
  },

  auctionLeave: (playerId) => {
    const s = get();
    if (!s.auction.isActive) return;
    if (!s.auction.participants.includes(playerId)) return;
    const onTurnId = s.auction.participants[s.auction.turnIndex];
    const remaining = s.auction.participants.filter((id) => id !== playerId);
    if (remaining.length === 0) {
      // No one wants to bid. Bank buys for $1 (current bid or $1)
      get().endAuction();
      return;
    }
    // Track the rotation by PLAYER, not by raw index: removing a seat shifts the
    // array, so a kept index would silently hand the turn to someone else. If the
    // leaver was the one on turn, the seat that slid into their slot goes next.
    const newTurnIndex =
      onTurnId === playerId
        ? s.auction.turnIndex % remaining.length
        : remaining.indexOf(onTurnId);
    set({
      auction: {
        ...s.auction,
        participants: remaining,
        passedPlayers: [...s.auction.passedPlayers, playerId],
        turnIndex: newTurnIndex,
      },
    });
    get().addLog("log.auction.leave", { name: s.players[playerId].name }, "AUCTION", playerId);
    // If only one left and there's a bid, they win automatically
    if (remaining.length === 1 && s.auction.currentBid > 0) {
      resolveAuctionWin(get, set, remaining[0], s.auction.currentBid, s.auction.propertyIndex!);
      return;
    }
    // If only one left but no bid yet, that player must bid at least $1 or end auction
    // The AuctionModal will handle prompting them
  },

  endAuction: () => {
    const s = get();
    if (!s.auction.isActive) return;
    const winnerId = s.auction.currentBidderId;
    const bidAmount = s.auction.currentBid;
    const spaceIndex = s.auction.propertyIndex!;
    const { sellerId, resumePhase } = s.auction;
    if (winnerId === null || bidAmount === 0) {
      if (sellerId !== null) {
        get().addLog("log.auction.endSeller", { space: { tKey: `board.${spaceIndex}.name` }, name: s.players[sellerId].name }, "AUCTION");
      } else {
        get().addLog("log.auction.endBank", { space: { tKey: `board.${spaceIndex}.name` } }, "AUCTION");
      }
      set({ auction: EMPTY_AUCTION, turnPhase: resumePhase ?? "POST_ACTION" });
      if (resumePhase === null) setTimeout(() => get().proceedAfterAction(get().lastDiceRoll.isDoubles), 400);
      return;
    }
    resolveAuctionWin(get, set, winnerId, bidAmount, spaceIndex);
  },

  endTurn: () => {
    let s = get();
    if (s.turnPhase === "GAME_OVER" || s.turnPhase === "AUCTION" || s.turnPhase === "CARD_DRAW") return;
    // Never end a turn while dice/token animation or a pending decision is still
    // in flight — in hotseat play an eager click here used to advance the seat
    // mid-walk, stranding the token and skipping the landing action.
    if (s.turnPhase === "ROLLING_DICE" || s.turnPhase === "MOVING") return;
    if (s.pendingSpaceAction !== null || s.pendingCard !== null) return;
    if (s.pendingFiscal !== null || s.pendingRescue !== null) return;
    // The player whose turn just ended pays this round's loan installment and
    // any property-holding tax before the seat passes on.
    serviceBankAndGovernment(get, set, s.currentPlayerIndex);
    s = get();
    if (s.turnPhase === "GAME_OVER") return;
    const winner = findWinner(s);
    if (winner !== null) {
      set({ winnerId: winner, turnPhase: "GAME_OVER" });
      get().addLog("log.game.win", { name: s.players[winner].name }, "SYSTEM");
      return;
    }
    const next = getNextActivePlayer(s);
    // A new round begins when the turn order cycles back to an earlier seat.
    const wrapped = next <= s.currentPlayerIndex;
    const newRound = s.round + (wrapped ? 1 : 0);
    set((st) => ({
      currentPlayerIndex: next,
      turnPhase: "WAITING_ROLL",
      doublesCount: 0,
      turn: st.turn + 1,
      round: newRound,
      lastRollSummary: "",
    }));
    get().addLog("log.turn.start", { name: s.players[next].name }, "SYSTEM", next);
    // No events during the first 10 rounds. After that, each new round has a
    // chance to spring a random event.
    if (wrapped && newRound > 10 && rng() < WAVE_EVENT_CHANCE) {
      triggerWaveEvent(get, set, newRound);
    }
    // Scheduled Fiscal Year every 12 rounds (12, 24, …).
    if (wrapped && newRound >= 12 && newRound % 12 === 0) {
      triggerFiscal(get, set, newRound);
    }
  },

  jailDecision: (decision) => {
    const s = get();
    const player = s.players[s.currentPlayerIndex];
    if (!player || !player.inJail) return;
    if (decision === "PAY") {
      const bail = jailBail(player.jailCount, getNetWorthPublic(get(), player.id));
      if (player.balance < bail) {
        get().addLog("log.jail.noBail", { name: player.name, bail }, "JAIL", player.id);
        return;
      }
      set((st) => ({
        players: st.players.map((p, i) =>
          i === st.currentPlayerIndex ? { ...p, balance: p.balance - bail, inJail: false, jailTurns: 0, heat: Math.min(MAX_HEAT, p.heat + HEAT_ON_RELEASE) } : p,
        ),
        turnPhase: "WAITING_ROLL",
      }));
      get().addLog("log.jail.payBail", { name: player.name, bail }, "JAIL", player.id);
    } else if (decision === "CARD") {
      if (player.getOutOfJailCards <= 0) return;
      set((st) => ({
        players: st.players.map((p, i) =>
          i === st.currentPlayerIndex ? { ...p, getOutOfJailCards: p.getOutOfJailCards - 1, inJail: false, jailTurns: 0, heat: Math.min(MAX_HEAT, p.heat + HEAT_ON_RELEASE) } : p,
        ),
        turnPhase: "WAITING_ROLL",
      }));
      // Return card to discard
      const card: GameCard = {
        id: 12,
        deck: "CHANCE",
        instruction: "Get out of Jail Free",
        type: "GET_OUT_OF_JAIL",
      };
      set((st) => ({ chanceDiscard: [...st.chanceDiscard, card] }));
      get().addLog("log.jail.useCard", { name: player.name }, "JAIL", player.id);
    } else if (decision === "ROLL") {
      // rollDice() blocks a jailed player unless the phase is JAIL_DECISION,
      // so set that (not WAITING_ROLL) before rolling to escape.
      set({ turnPhase: "JAIL_DECISION" });
      get().rollDice();
    }
  },

  buildHouse: (spaceIndex, count = 1) => {
    const s = get();
    const player = s.players[s.currentPlayerIndex];
    if (player.inJail) { get().addLog("log.build.inJail", { name: player.name }, "SYSTEM", player.id); return; }
    const space = getSpace(spaceIndex);
    if (space.type !== "PROPERTY") return;
    const ownership = s.ownership[spaceIndex];
    if (ownership.ownerId !== player.id) return;
    if (!hasMonopoly(s, player.id, spaceIndex)) return;
    const prop = space as { housePrice: number; colorSet: ColorSet };
    const setIndices = getColorSetSpaces(prop.colorSet);
    // Read from buildings state (source of truth)
    const currentBuildings = s.buildings[spaceIndex] || { houses: 0, hotel: false };
    const currentHouses = currentBuildings.houses;
    const currentHotel = currentBuildings.hotel;
    if (currentHotel) return; // Already has hotel
    const maxCanBuild = Math.min(count, 4 - currentHouses);
    if (maxCanBuild <= 0) return;

    // Check even build rule: after building, this property's houses cannot exceed
    // any other property in the set by more than 1
    for (let i = 1; i <= maxCanBuild; i++) {
      const newHouses = currentHouses + i;
      let canBuild = true;
      for (const idx of setIndices) {
        if (idx === spaceIndex) continue;
        const otherB = s.buildings[idx] || { houses: 0, hotel: false };
        if (otherB.hotel) { canBuild = false; break; }
        if (otherB.houses < newHouses - 1) { canBuild = false; break; }
      }
      if (!canBuild) {
        // Can only build up to i-1
        if (i === 1) {
          get().addLog("log.build.evenRule", undefined, "SYSTEM");
          return;
        }
        // Build i-1 houses
        const actualCount = i - 1;
        const totalCost = prop.housePrice * actualCount;
        if (player.balance < totalCost) {
          get().addLog("log.build.insufficientHouses", { count: actualCount }, "SYSTEM");
          return;
        }
        if (s.bank.houses < actualCount) {
          get().addLog("log.build.bankNoHouses", { need: actualCount, left: s.bank.houses }, "SYSTEM");
          return;
        }
        set((st) => ({
          players: st.players.map((p, idx) =>
            idx === st.currentPlayerIndex ? { ...p, balance: p.balance - totalCost } : p,
          ),
          buildings: {
            ...st.buildings,
            [spaceIndex]: { houses: currentHouses + actualCount, hotel: false },
          },
          bank: { ...st.bank, houses: st.bank.houses - actualCount },
        }));
        get().addLog("log.build.houses", { name: player.name, count: actualCount, space: { tKey: `board.${spaceIndex}.name` }, cost: totalCost }, "BUILD", player.id);
        return;
      }
    }
    // All `count` houses can be built
    const totalCost = prop.housePrice * maxCanBuild;
    if (player.balance < totalCost) {
      get().addLog("log.build.insufficientHousesCost", { count: maxCanBuild, cost: totalCost }, "SYSTEM");
      return;
    }
    if (s.bank.houses < maxCanBuild) {
      get().addLog("log.build.bankNoHouses", { need: maxCanBuild, left: s.bank.houses }, "SYSTEM");
      return;
    }
    set((st) => ({
      players: st.players.map((p, idx) =>
        idx === st.currentPlayerIndex ? { ...p, balance: p.balance - totalCost } : p,
      ),
      buildings: {
        ...st.buildings,
        [spaceIndex]: { houses: currentHouses + maxCanBuild, hotel: false },
      },
      bank: { ...st.bank, houses: st.bank.houses - maxCanBuild },
    }));
    get().addLog("log.build.houses", { name: player.name, count: maxCanBuild, space: { tKey: `board.${spaceIndex}.name` }, cost: totalCost }, "BUILD", player.id);
  },

  sellHouse: (spaceIndex, count = 1) => {
    const s = get();
    const player = s.players[s.currentPlayerIndex];
    const space = getSpace(spaceIndex);
    if (space.type !== "PROPERTY") return;
    const ownership = s.ownership[spaceIndex];
    if (ownership.ownerId !== player.id) return;
    const prop = space as { housePrice: number; colorSet: ColorSet };
    const setIndices = getColorSetSpaces(prop.colorSet);
    const currentBuildings = s.buildings[spaceIndex] || { houses: 0, hotel: false };
    if (currentBuildings.hotel) return; // Use sellHotel instead
    if (currentBuildings.houses <= 0) return;
    const actualCount = Math.min(count, currentBuildings.houses);
    // Even sell rule: cannot sell if other properties in set have more houses
    for (const idx of setIndices) {
      if (idx === spaceIndex) continue;
      const otherB = s.buildings[idx] || { houses: 0, hotel: false };
      if (otherB.houses > currentBuildings.houses - actualCount) {
        get().addLog("log.sell.evenRule", undefined, "SYSTEM");
        return;
      }
    }
    const refund = Math.floor(prop.housePrice / 2) * actualCount;
    set((st) => ({
      players: st.players.map((p, idx) =>
        idx === st.currentPlayerIndex ? { ...p, balance: p.balance + refund } : p,
      ),
      buildings: {
        ...st.buildings,
        [spaceIndex]: { houses: currentBuildings.houses - actualCount, hotel: false },
      },
      bank: { ...st.bank, houses: st.bank.houses + actualCount },
    }));
    get().addLog("log.sell.houses", { name: player.name, count: actualCount, space: { tKey: `board.${spaceIndex}.name` }, refund }, "BUILD", player.id);
  },

  buildHotel: (spaceIndex) => {
    const s = get();
    const player = s.players[s.currentPlayerIndex];
    if (player.inJail) { get().addLog("log.build.inJail", { name: player.name }, "SYSTEM", player.id); return; }
    const space = getSpace(spaceIndex);
    if (space.type !== "PROPERTY") return;
    const ownership = s.ownership[spaceIndex];
    if (ownership.ownerId !== player.id) return;
    // Read from buildings state
    const currentBuildings = s.buildings[spaceIndex] || { houses: 0, hotel: false };
    if (currentBuildings.houses !== 4 || currentBuildings.hotel) {
      get().addLog("log.build.hotelNeed4", undefined, "SYSTEM");
      return;
    }
    const prop = space as { housePrice: number };
    if (s.bank.hotels <= 0) {
      get().addLog("log.build.bankNoHotels", undefined, "SYSTEM");
      return;
    }
    if (player.balance < prop.housePrice) {
      get().addLog("log.build.insufficientHotel", { cost: prop.housePrice }, "SYSTEM");
      return;
    }
    // Return 4 houses to bank, take 1 hotel
    set((st) => ({
      players: st.players.map((p, idx) =>
        idx === st.currentPlayerIndex ? { ...p, balance: p.balance - prop.housePrice } : p,
      ),
      buildings: {
        ...st.buildings,
        [spaceIndex]: { houses: 0, hotel: true },
      },
      bank: { ...st.bank, houses: st.bank.houses + 4, hotels: st.bank.hotels - 1 },
    }));
    get().addLog("log.build.hotel", { name: player.name, space: { tKey: `board.${spaceIndex}.name` }, cost: prop.housePrice }, "BUILD", player.id);
  },

  sellHotel: (spaceIndex) => {
    const s = get();
    const player = s.players[s.currentPlayerIndex];
    const space = getSpace(spaceIndex);
    if (space.type !== "PROPERTY") return;
    const ownership = s.ownership[spaceIndex];
    if (ownership.ownerId !== player.id) return;
    const currentBuildings = s.buildings[spaceIndex] || { houses: 0, hotel: false };
    if (!currentBuildings.hotel) return;
    const prop = space as { housePrice: number };
    const refund = Math.floor(prop.housePrice / 2);
    // Need 4 houses back from bank
    if (s.bank.houses < 4) {
      get().addLog("log.sell.hotelBankNoHouses", undefined, "SYSTEM");
      return;
    }
    set((st) => ({
      players: st.players.map((p, idx) =>
        idx === st.currentPlayerIndex ? { ...p, balance: p.balance + refund } : p,
      ),
      buildings: {
        ...st.buildings,
        [spaceIndex]: { houses: 4, hotel: false },
      },
      bank: { ...st.bank, houses: st.bank.houses - 4, hotels: st.bank.hotels + 1 },
    }));
    get().addLog("log.sell.hotel", { name: player.name, space: { tKey: `board.${spaceIndex}.name` }, refund }, "BUILD", player.id);
  },

  mortgageProperty: (spaceIndex) => {
    const s = get();
    const player = s.players[s.currentPlayerIndex];
    const space = getSpace(spaceIndex);
    const ownership = s.ownership[spaceIndex];
    if (ownership.ownerId !== player.id) return;
    if (ownership.mortgaged) return;
    // Cannot mortgage if has buildings
    const buildings = s.buildings[spaceIndex];
    if (buildings && (buildings.houses > 0 || buildings.hotel)) {
      get().addLog("log.mortgage.cantBuildings", { space: { tKey: `board.${spaceIndex}.name` } }, "SYSTEM");
      return;
    }
    // If property is in a color set with buildings on other properties, also can't mortgage
    if (space.type === "PROPERTY") {
      const prop = space as { colorSet: ColorSet };
      const setIndices = getColorSetSpaces(prop.colorSet);
      for (const idx of setIndices) {
        const b = s.buildings[idx];
        if (b && (b.houses > 0 || b.hotel)) {
          get().addLog("log.mortgage.cantSetBuildings", undefined, "SYSTEM");
          return;
        }
      }
    }
    const value = getMortgageValue(space);
    set((st) => ({
      players: st.players.map((p, i) =>
        i === st.currentPlayerIndex ? { ...p, balance: p.balance + value } : p,
      ),
      ownership: {
        ...st.ownership,
        [spaceIndex]: { ...st.ownership[spaceIndex], mortgaged: true },
      },
    }));
    get().addLog("log.mortgage.done", { name: player.name, space: { tKey: `board.${spaceIndex}.name` }, value }, "PAYMENT", player.id);
  },

  unmortgageProperty: (spaceIndex) => {
    const s = get();
    const player = s.players[s.currentPlayerIndex];
    const space = getSpace(spaceIndex);
    const ownership = s.ownership[spaceIndex];
    if (ownership.ownerId !== player.id) return;
    if (!ownership.mortgaged) return;
    const value = getMortgageValue(space);
    const cost = Math.ceil(value * 1.1); // 10% interest
    if (player.balance < cost) return;
    set((st) => ({
      players: st.players.map((p, i) =>
        i === st.currentPlayerIndex ? { ...p, balance: p.balance - cost } : p,
      ),
      ownership: {
        ...st.ownership,
        [spaceIndex]: { ...st.ownership[spaceIndex], mortgaged: false },
      },
    }));
    get().addLog("log.mortgage.redeem", { name: player.name, space: { tKey: `board.${spaceIndex}.name` }, cost }, "PAYMENT", player.id);
  },

  // Sell a building-free property back to the bank for its mortgage value (50%).
  // The property leaves the player and returns to the available pool.
  sellToBank: (spaceIndex) => {
    const s = get();
    const player = s.players[s.currentPlayerIndex];
    const space = getSpace(spaceIndex);
    const ownership = s.ownership[spaceIndex];
    if (!ownership || ownership.ownerId !== player.id) return;
    // No buildings on the property or its color set.
    const buildings = s.buildings[spaceIndex];
    if (buildings && (buildings.houses > 0 || buildings.hotel)) {
      get().addLog("log.sellbank.cantBuildings", { space: { tKey: `board.${spaceIndex}.name` } }, "SYSTEM");
      return;
    }
    if (space.type === "PROPERTY") {
      const setIdx = getColorSetSpaces((space as { colorSet: ColorSet }).colorSet);
      for (const i of setIdx) {
        const b = s.buildings[i];
        if (b && (b.houses > 0 || b.hotel)) {
          get().addLog("log.sellbank.cantSetBuildings", { space: { tKey: `board.${spaceIndex}.name` } }, "SYSTEM");
          return;
        }
      }
    }
    // Mortgaged properties were already cashed out at 50%, so they fetch nothing.
    const value = ownership.mortgaged ? 0 : getMortgageValue(space);
    set((st) => ({
      players: st.players.map((p, i) =>
        i === st.currentPlayerIndex
          ? { ...p, balance: p.balance + value, properties: p.properties.filter((idx) => idx !== spaceIndex) }
          : p,
      ),
      ownership: { ...st.ownership, [spaceIndex]: { ownerId: null, mortgaged: false, houses: 0, hotel: false } },
    }));
    get().addLog("log.sellbank.done", { name: player.name, space: { tKey: `board.${spaceIndex}.name` }, value }, "PAYMENT", player.id);
  },

  takeLoan: (playerId, amount, term) => {
    const s = get();
    const player = s.players[playerId];
    if (!player || player.bankrupt) return;
    const net = getNetWorthPublic(s, playerId);
    const limit = creditLimit(net, totalDebt(player.loans ?? []));
    const principal = Math.min(Math.max(0, Math.round(amount)), limit);
    if (principal < 50) {
      get().addLog("log.loan.rejected", { name: player.name, limit }, "SYSTEM", playerId);
      return;
    }
    const loan = makeLoan(principal, term, s.turn);
    set((st) => ({
      players: st.players.map((p) =>
        p.id === playerId ? { ...p, balance: p.balance + principal, loans: [...(p.loans ?? []), loan] } : p,
      ),
    }));
    get().addLog(
      "log.loan.taken",
      { name: player.name, principal, term, rate: Math.round((s.centralRate + 0.02) * 100) },
      "PAYMENT",
      playerId,
    );
  },

  repayLoan: (playerId, loanId) => {
    const s = get();
    const player = s.players[playerId];
    if (!player) return;
    const loan = (player.loans ?? []).find((l) => l.id === loanId);
    if (!loan) return;
    const payoff = loan.balance + Math.ceil(loan.balance * (s.centralRate + 0.02));
    if (player.balance < payoff) {
      get().addLog("log.loan.cantRepay", { name: player.name, payoff }, "SYSTEM", playerId);
      return;
    }
    set((st) => ({
      players: st.players.map((p) =>
        p.id === playerId
          ? { ...p, balance: p.balance - payoff, loans: (p.loans ?? []).filter((l) => l.id !== loanId) }
          : p,
      ),
    }));
    get().addLog("log.loan.repaidEarly", { name: player.name, payoff }, "PAYMENT", playerId);
  },

  bribeGuard: (playerId) => {
    const s = get();
    const p = s.players[playerId];
    if (!p || p.bankrupt || !p.inJail) return;
    if (p.balance < BRIBE_GUARD_COST) {
      get().addLog("log.crime.bribeNoCash", { name: p.name, cost: BRIBE_GUARD_COST }, "SYSTEM", playerId);
      return;
    }
    const caught = rng() < catchChance(CRIMES.BRIBE_GUARD.baseRisk, p.heat);
    if (caught) {
      set((st) => ({
        players: st.players.map((x) =>
          x.id === playerId
            ? { ...x, balance: x.balance - BRIBE_GUARD_COST - BRIBE_GUARD_FINE, jailTurns: 0, heat: Math.min(MAX_HEAT, x.heat + HEAT_ON_CAUGHT) }
            : x,
        ),
      }));
      get().addLog("log.crime.bribeCaught", { name: p.name, fine: BRIBE_GUARD_FINE }, "JAIL", playerId);
      coverShortfall(get, set, playerId);
    } else {
      set((st) => ({
        players: st.players.map((x) =>
          x.id === playerId
            ? { ...x, balance: x.balance - BRIBE_GUARD_COST, inJail: false, jailTurns: 0, heat: Math.min(MAX_HEAT, x.heat + HEAT_PER_CRIME) }
            : x,
        ),
        turnPhase: "WAITING_ROLL",
      }));
      get().addLog("log.crime.bribeOk", { name: p.name, cost: BRIBE_GUARD_COST }, "JAIL", playerId);
    }
  },

  lobbyRegulation: (playerId) => {
    const s = get();
    const p = s.players[playerId];
    if (!p || p.bankrupt || p.inJail) return;
    if (p.lobbyActive) {
      get().addLog("log.crime.lobbyActive", { name: p.name }, "SYSTEM", playerId);
      return;
    }
    if (p.balance < LOBBY_COST) {
      get().addLog("log.crime.lobbyNoCash", { name: p.name, cost: LOBBY_COST }, "SYSTEM", playerId);
      return;
    }
    const caught = rng() < catchChance(CRIMES.LOBBY.baseRisk, p.heat);
    if (caught) {
      set((st) => ({
        players: st.players.map((x) =>
          x.id === playerId
            ? { ...x, balance: x.balance - LOBBY_COST - LOBBY_FINE, heat: Math.min(MAX_HEAT, x.heat + HEAT_ON_CAUGHT) }
            : x,
        ),
      }));
      get().addLog("log.crime.lobbyCaught", { name: p.name, fine: LOBBY_FINE }, "PAYMENT", playerId);
      if (p.heat + HEAT_ON_CAUGHT >= HEAT_JAIL_THRESHOLD) sendToJailById(get, set, playerId, "log.jail.reason.bribeScandal");
      coverShortfall(get, set, playerId);
    } else {
      set((st) => ({
        players: st.players.map((x) =>
          x.id === playerId
            ? { ...x, balance: x.balance - LOBBY_COST, lobbyActive: true, heat: Math.min(MAX_HEAT, x.heat + HEAT_PER_CRIME) }
            : x,
        ),
      }));
      get().addLog("log.crime.lobbyOk", { name: p.name }, "ACTION", playerId);
    }
  },

  armEvasion: (playerId) => {
    const s = get();
    const p = s.players[playerId];
    if (!p || p.bankrupt || p.inJail) return;
    const next = !p.evadeNextRent;
    set((st) => ({ players: st.players.map((x) => (x.id === playerId ? { ...x, evadeNextRent: next } : x)) }));
    get().addLog(
      next ? "log.crime.evadeArm" : "log.crime.evadeCancel",
      { name: p.name },
      "ACTION",
      playerId,
    );
  },

  rigAuction: (playerId) => {
    const s = get();
    const a = s.auction;
    const p = s.players[playerId];
    if (!a.isActive || a.propertyIndex === null || !p || p.bankrupt || p.inJail) return;
    if (!a.participants.includes(playerId)) return;
    const cost = rigAuctionCost(a.currentBid);
    if (p.balance < cost) {
      get().addLog("log.crime.rigNoCash", { name: p.name, cost }, "SYSTEM", playerId);
      return;
    }
    const caught = rng() < catchChance(CRIMES.RIG_AUCTION.baseRisk, p.heat);
    const spaceIndex = a.propertyIndex;
    if (caught) {
      const resume = a.resumePhase;
      set((st) => ({
        players: st.players.map((x) =>
          x.id === playerId
            ? { ...x, balance: x.balance - cost - RIG_AUCTION_FINE, heat: Math.min(MAX_HEAT, x.heat + HEAT_ON_CAUGHT) }
            : x,
        ),
        auction: EMPTY_AUCTION,
        turnPhase: resume ?? "POST_ACTION",
      }));
      get().addLog("log.crime.rigCaught", { name: p.name, space: { tKey: `board.${spaceIndex}.name` }, fine: RIG_AUCTION_FINE }, "AUCTION", playerId);
      coverShortfall(get, set, playerId);
      if (resume === null && get().turnPhase !== "GAME_OVER") {
        setTimeout(() => get().proceedAfterAction(get().lastDiceRoll.isDoubles), 600);
      }
    } else {
      set((st) => ({
        players: st.players.map((x) => (x.id === playerId ? { ...x, balance: x.balance - cost, heat: Math.min(MAX_HEAT, x.heat + HEAT_PER_CRIME) } : x)),
      }));
      get().addLog("log.crime.rigOk", { name: p.name, cost, space: { tKey: `board.${spaceIndex}.name` } }, "AUCTION", playerId);
      resolveAuctionWin(get, set, playerId, a.currentBid, spaceIndex);
    }
  },

  proposeTrade: (trade) => {
    const s = get();
    const from = s.players[trade.fromId];
    const to = s.players[trade.toId];
    if (from?.inJail) { get().addLog("log.trade.inJail", { name: from.name }, "SYSTEM", trade.fromId); return; }
    set({ pendingTrade: trade });
    get().addLog("log.trade.propose", { from: from?.name ?? "", to: to?.name ?? "" }, "TRADE", trade.fromId);
    if (to?.type === "AI") {
      // AI decides (with a short "thinking" delay)
      setTimeout(() => {
        if (get().pendingTrade !== trade) return;
        const aiDecision = aiEvaluateTrade(get(), trade);
        if (aiDecision) {
          get().acceptTrade();
        } else {
          get().rejectTrade();
        }
      }, 1200);
    }
  },

  acceptTrade: () => {
    const s = get();
    if (!s.pendingTrade) return;
    const t = s.pendingTrade;
    // Each side's net cash outflow. A property-rich, cash-poor player can still
    // pay by auto-liquidating (sell buildings / mortgage) — only a genuinely
    // insufficient net worth fails the trade.
    const fromNetPay = t.cashFrom - t.cashTo;
    const toNetPay = t.cashTo - t.cashFrom;
    if (get().players[t.fromId].balance < fromNetPay) liquidateForDebt(get, set, t.fromId, fromNetPay);
    if (get().players[t.toId].balance < toNetPay) liquidateForDebt(get, set, t.toId, toNetPay);
    const from = get().players[t.fromId];
    const to = get().players[t.toId];
    if (from.balance < fromNetPay || to.balance < toNetPay) {
      get().addLog("log.trade.failCash", { name: from.balance < fromNetPay ? from.name : to.name }, "SYSTEM");
      set({ pendingTrade: null });
      return;
    }
    set((st) => ({
      players: st.players.map((p) => {
        if (p.id === t.fromId) {
          return {
            ...p,
            balance: p.balance - t.cashFrom + t.cashTo,
            properties: [
              ...p.properties.filter((idx) => !t.propertiesFrom.includes(idx)),
              ...t.propertiesTo,
            ],
            getOutOfJailCards: p.getOutOfJailCards - t.goojFrom + t.goojTo,
          };
        }
        if (p.id === t.toId) {
          return {
            ...p,
            balance: p.balance - t.cashTo + t.cashFrom,
            properties: [
              ...p.properties.filter((idx) => !t.propertiesTo.includes(idx)),
              ...t.propertiesFrom,
            ],
            getOutOfJailCards: p.getOutOfJailCards - t.goojTo + t.goojFrom,
          };
        }
        return p;
      }),
      ownership: (() => {
        const newOwnership = { ...st.ownership };
        for (const idx of t.propertiesFrom) {
          newOwnership[idx] = { ...newOwnership[idx], ownerId: t.toId };
        }
        for (const idx of t.propertiesTo) {
          newOwnership[idx] = { ...newOwnership[idx], ownerId: t.fromId };
        }
        return newOwnership;
      })(),
      pendingTrade: null,
    }));
    get().addLog("log.trade.success", { from: from.name, to: to.name }, "TRADE");
  },

  rejectTrade: () => {
    const t = get().pendingTrade;
    if (t) {
      const from = get().players[t.fromId];
      const to = get().players[t.toId];
      get().addLog("log.trade.reject", { to: to?.name ?? "", from: from?.name ?? "" }, "TRADE", t.toId);
    }
    set({ pendingTrade: null });
  },

  payTenPercentTax: () => {
    const s = get();
    if (s.pendingSpaceAction === null) return;
    const player = s.players[s.currentPlayerIndex];
    const netWorth = getNetWorthPublic(s, player.id);
    const tax = Math.ceil(netWorth * 0.1);
    set((st) => ({
      players: st.players.map((p, i) =>
        i === st.currentPlayerIndex ? { ...p, balance: p.balance - tax } : p,
      ),
      pendingSpaceAction: null,
    }));
    get().addLog("log.tax.incomePercent", { name: player.name, net: netWorth, tax }, "PAYMENT", player.id);
    checkBankruptcyAndProceed(get, set, get().lastDiceRoll.isDoubles);
  },

  payFlatTax: () => {
    const s = get();
    if (s.pendingSpaceAction === null) return;
    const player = s.players[s.currentPlayerIndex];
    set((st) => ({
      players: st.players.map((p, i) =>
        i === st.currentPlayerIndex ? { ...p, balance: p.balance - 200 } : p,
      ),
      pendingSpaceAction: null,
    }));
    get().addLog("log.tax.incomeFlat", { name: player.name }, "PAYMENT", player.id);
    checkBankruptcyAndProceed(get, set, get().lastDiceRoll.isDoubles);
  },

  clearPendingSpace: () => {
    set({ pendingSpaceAction: null });
  },

  dismissRent: () => {
    set({ pendingRent: null });
  },

  clearEvent: () => {
    set({ eventMessage: null });
  },

  resolveFiscalChoice: (choiceId) => {
    const pf = get().pendingFiscal;
    if (!pf || pf.queue.length === 0) return;
    const playerId = pf.queue[0];
    const def = pf.kind === "TAX" ? FISCAL_TAX : FISCAL_INFLATION;
    applyFiscalToPlayer(get, set, playerId, def, choiceId);
    const rest = pf.queue.slice(1);
    if (rest.length === 0) {
      finalizeFiscal(get, set, def);
    } else {
      set({ pendingFiscal: { ...pf, queue: rest } });
    }
  },

  // A queued human investor decides whether to bail out the bankrupt player.
  resolveRescue: (invest) => {
    const pr = get().pendingRescue;
    if (!pr || pr.queue.length === 0) return;
    const investorId = pr.queue[0];
    if (invest && get().players[investorId]?.balance >= pr.debt) {
      doRescue(get, set, investorId, pr.targetId, pr.debt);
      set(() => ({ pendingRescue: null }));
      get().proceedAfterAction(pr.isDoubles);
      return;
    }
    // Declined → offer to the next eligible human, or finalise bankruptcy.
    const rest = pr.queue.slice(1);
    if (rest.length > 0) {
      set({ pendingRescue: { ...pr, queue: rest } });
      return;
    }
    set(() => ({ pendingRescue: null }));
    finalBankruptcy(get, set, pr.targetId, pr.creditorId);
  },

  aiTakeTurn: () => {
    const s = get();
    const player = s.players[s.currentPlayerIndex];
    if (!player || player.type !== "AI") return;
    // Logic handled in component for flow control
  },
    }),
    {
      name: "web-monopoly-save",
      // v2: log entries changed from preformatted strings to {key,params} for
      // bilingual rendering. Drop any old-format log lines on load.
      version: 2,
      migrate: (persisted, version) => {
        const st = persisted as Partial<GameState> | undefined;
        if (st && version < 2 && Array.isArray(st.log)) {
          st.log = st.log.filter((e) => e && typeof e === "object" && "msg" in e);
        }
        return st as GameState;
      },
      storage: createDebouncedStorage(),
      // Persist only serialisable game data — never functions, and skip `board`
      // which is static (rebuilt from BOARD) and bloats every write.
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([k, v]) => typeof v !== "function" && k !== "board",
          ),
        ) as Partial<GameStore>,
      // Recover gracefully if the tab was refreshed mid-animation.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.turnPhase === "ROLLING_DICE" || state.turnPhase === "MOVING") {
          state.turnPhase = "WAITING_ROLL";
        }
        state.eventMessage = null; // don't resurrect a stale event banner on reload
        // Backfill banking fields for saves made before the bank system existed.
        if (typeof state.centralRate !== "number") state.centralRate = DEFAULT_CENTRAL_RATE;
        if (!state.regulations) state.regulations = { ...DEFAULT_REGULATIONS };
        if (Array.isArray(state.players)) {
          state.players = state.players.map((p) => ({
            ...p,
            loans: p.loans ?? [],
            heat: p.heat ?? 0,
            jailCount: p.jailCount ?? 0,
            evadeNextRent: p.evadeNextRent ?? false,
            lobbyActive: p.lobbyActive ?? false,
          }));
        }
        // Re-number restored log entries to guaranteed-unique sequential ids.
        // Older saves (made before the id-counter fix) can contain duplicate ids,
        // which give React duplicate keys ("two children with the same key").
        // Reassigning heals those and lets new logs continue past the end.
        if (Array.isArray(state.log)) {
          state.log = state.log.map((e, i) => ({ ...e, id: i + 1 }));
          logIdCounter = state.log.length + 1;
        } else {
          logIdCounter = 1;
        }
      },
    },
  ),
);

// Routes a validated Intent to the existing action layer. Kept as a thin switch
// so the action implementations stay the single source of game logic; the future
// server will call the same per-intent transitions.
function applyIntentToStore(get: () => GameState & GameStore, intent: Intent, actor: number) {
  const a = get();
  switch (intent.type) {
    case "ROLL_DICE": return a.rollDice();
    case "END_TURN": return a.endTurn();
    case "BUY_PROPERTY": return a.buyProperty();
    case "DECLINE_BUY": return a.declineBuy();
    case "JAIL_DECISION": return a.jailDecision(intent.decision);
    case "BUILD_HOUSE": return a.buildHouse(intent.spaceIndex, intent.count);
    case "SELL_HOUSE": return a.sellHouse(intent.spaceIndex, intent.count);
    case "BUILD_HOTEL": return a.buildHotel(intent.spaceIndex);
    case "SELL_HOTEL": return a.sellHotel(intent.spaceIndex);
    case "MORTGAGE": return a.mortgageProperty(intent.spaceIndex);
    case "UNMORTGAGE": return a.unmortgageProperty(intent.spaceIndex);
    case "SELL_TO_BANK": return a.sellToBank(intent.spaceIndex);
    case "AUCTION_OWN": return a.auctionOwnProperty(intent.spaceIndex);
    case "AUCTION_BID": return a.auctionBid(actor, intent.amount);
    case "AUCTION_PASS": return a.auctionPass(actor);
    case "AUCTION_LEAVE": return a.auctionLeave(actor);
    case "TAKE_LOAN": return a.takeLoan(actor, intent.amount, intent.term);
    case "REPAY_LOAN": return a.repayLoan(actor, intent.loanId);
    case "BRIBE_GUARD": return a.bribeGuard(actor);
    case "LOBBY": return a.lobbyRegulation(actor);
    case "ARM_EVASION": return a.armEvasion(actor);
    case "RIG_AUCTION": return a.rigAuction(actor);
    case "PROPOSE_TRADE": return a.proposeTrade(intent.trade);
    case "ACCEPT_TRADE": return a.acceptTrade();
    case "REJECT_TRADE": return a.rejectTrade();
    case "DISMISS_CARD": return a.dismissCard();
    case "PAY_TAX": return intent.mode === "FLAT" ? a.payFlatTax() : a.payTenPercentTax();
    case "RESOLVE_FISCAL": return a.resolveFiscalChoice(intent.choiceId);
    case "RESOLVE_RESCUE": return a.resolveRescue(intent.invest);
  }
}

// Helper functions
// Helper: count utilities owned by player (public version accessible in store)
function countUtilitiesPublic(s: GameState, playerId: number): number {
  let count = 0;
  for (const space of BOARD) {
    if (space.type === "UTILITY" && s.ownership[space.index]?.ownerId === playerId) {
      count++;
    }
  }
  return count;
}

function transferMoney(get: () => GameState & GameStore, set: (fn: (s: GameState & GameStore) => Partial<GameState & GameStore>) => void, fromId: number, toId: number, amount: number) {
  // Payer balance may go negative — the deficit is what drives bankruptcy.
  set((st) => ({
    players: st.players.map((p) => {
      if (p.id === fromId) return { ...p, balance: p.balance - amount };
      if (p.id === toId) return { ...p, balance: p.balance + amount };
      return p;
    }),
  }));
}

type SetFn = (fn: (s: GameState & GameStore) => Partial<GameState & GameStore>) => void;

// Investor-pact rent rules. An investor pays nothing on their vassal's property;
// a vassal pays only the base land rent on their investor's property.
function pactAdjustRent(s: GameState, payerId: number, ownerId: number, fullRent: number, spaceIndex: number): { rent: number; note: LogMsg | null } {
  const payer = s.players[payerId];
  const owner = s.players[ownerId];
  if (owner.investorId === payerId) {
    return { rent: 0, note: { key: "log.pact.investorFree", params: { payer: payer.name, owner: owner.name } } };
  }
  if (payer.investorId === ownerId) {
    const sp = getSpace(spaceIndex);
    const base = sp.type === "PROPERTY" ? (sp as { rent: number[] }).rent[0] : fullRent;
    return { rent: base, note: { key: "log.pact.vassalBase", params: { payer: payer.name, owner: owner.name } } };
  }
  return { rent: fullRent, note: null };
}

// If the property owner is a vassal, route 50% of the rent they just collected to
// their investor, and dissolve the pact once the investor has recouped 1.5×.
function routePactShare(get: () => GameState & GameStore, set: SetFn, ownerId: number, payerId: number, rent: number) {
  const owner = get().players[ownerId];
  if (!owner || owner.investorId === null || owner.investorId === payerId || rent <= 0) return;
  const investorId = owner.investorId;
  const share = Math.floor(rent / 2);
  if (share <= 0) return;
  set((st) => ({
    players: st.players.map((p) => {
      if (p.id === ownerId) {
        const newPaid = p.pactPaid + share;
        const done = newPaid >= p.pactTarget;
        return { ...p, balance: p.balance - share, pactPaid: done ? 0 : newPaid, pactTarget: done ? 0 : p.pactTarget, investorId: done ? null : p.investorId };
      }
      if (p.id === investorId) return { ...p, balance: p.balance + share };
      return p;
    }),
  }));
  get().addLog("log.pact.share", { share, owner: owner.name }, "PAYMENT", ownerId);
  if (get().players[ownerId].investorId === null) {
    get().addLog("log.pact.done", { owner: owner.name }, "SYSTEM", ownerId);
  }
}

// Award an auction to its winner. If the auction had a seller (an owner reselling
// their own property), the bid goes to the seller and the property leaves their
// holdings; otherwise it's a bank sale. Owner-initiated auctions resume the
// seller's turn phase; bank auctions advance the turn.
function resolveAuctionWin(get: () => GameState & GameStore, set: SetFn, winnerId: number, bidAmount: number, spaceIndex: number) {
  const { sellerId, resumePhase } = get().auction;
  set((st) => ({
    players: st.players.map((p) => {
      if (p.id === winnerId) return { ...p, balance: p.balance - bidAmount, properties: [...p.properties, spaceIndex] };
      if (sellerId !== null && p.id === sellerId) return { ...p, balance: p.balance + bidAmount, properties: p.properties.filter((idx) => idx !== spaceIndex) };
      return p;
    }),
    ownership: { ...st.ownership, [spaceIndex]: { ...st.ownership[spaceIndex], ownerId: winnerId } },
    auction: EMPTY_AUCTION,
    turnPhase: resumePhase ?? "POST_ACTION",
  }));
  get().addLog("log.auction.win", { name: get().players[winnerId].name, space: { tKey: `board.${spaceIndex}.name` }, bid: bidAmount }, "AUCTION", winnerId);
  if (resumePhase === null) {
    setTimeout(() => get().proceedAfterAction(get().lastDiceRoll.isDoubles), 600);
  }
}

// Fire a random tiered "wave" event (regular/special/rare/mythos). Most just
// inject cash to keep the game lively; rarer tiers can swing fortunes.
function triggerWaveEvent(
  get: () => GameState & GameStore,
  set: (fn: (s: GameState & GameStore) => Partial<GameState & GameStore>) => void,
  round: number,
) {
  const s = get();
  const ev = rollWaveEvent();
  const ctx = {
    buildingCount: (player: Player) => {
      let houses = 0;
      let hotels = 0;
      for (const idx of player.properties) {
        const b = s.buildings[idx];
        if (!b) continue;
        houses += b.houses;
        if (b.hotel) hotels += 1;
      }
      return { houses, hotels };
    },
  };
  set((st) => ({
    players: ev.apply(st.players, ctx),
    eventMessage: { title: tr(`event.${ev.key}.title`), detail: tr(`event.${ev.key}.detail`), tier: ev.tier },
  }));
  get().addLog(
    "log.event.fired",
    { tier: { tKey: `event.tier.${ev.tier}` }, round, title: { tKey: `event.${ev.key}.title` }, detail: { tKey: `event.${ev.key}.detail` } },
    "SYSTEM",
  );
}

// ===== Fiscal Year (scheduled, every 12 rounds) =====
// Apply one player's chosen fiscal policy, then liquidate / bankrupt if the
// resulting bill pushed them underwater.
function applyFiscalToPlayer(get: () => GameState & GameStore, set: SetFn, playerId: number, def: FiscalDef, choiceId: string) {
  const player = get().players[playerId];
  if (!player || player.bankrupt) return;
  const net = getNetWorthPublic(get(), playerId);
  const { balance, note } = def.apply(player, choiceId, net);
  set((st) => ({ players: st.players.map((p) => (p.id === playerId ? { ...p, balance } : p)) }));
  get().addLog(note.key, note.params, "PAYMENT", playerId);
  if (get().players[playerId].balance < 0) {
    liquidateForDebt(get, set, playerId, 0);
    if (get().players[playerId].balance < 0) {
      declareBankruptcy(get, set, playerId, null);
    }
  }
}

// Redistribution flavour: once a tax year fully resolves, the poorest still-in
// player gets a relief subsidy.
function finalizeFiscal(get: () => GameState & GameStore, set: SetFn, def: FiscalDef) {
  if (def.kind === "TAX") {
    const active = get().players.filter((p) => !p.bankrupt);
    if (active.length > 0) {
      const poorest = active.reduce((a, b) => (b.balance < a.balance ? b : a));
      set((st) => ({ players: st.players.map((p) => (p.id === poorest.id ? { ...p, balance: p.balance + 200 } : p)) }));
      get().addLog("log.fiscal.subsidy", { name: poorest.name }, "PAYMENT", poorest.id);
    }
  }
  set(() => ({ pendingFiscal: null }));
}

// Kick off a Fiscal Year: AIs resolve their policy instantly; humans are queued
// for a modal decision.
function triggerFiscal(get: () => GameState & GameStore, set: SetFn, round: number) {
  // First the autonomous central bank + government re-tune monetary policy and
  // regulations for the new economic cycle. Everyone reacts to the new rates.
  applyMonetaryPolicy(get, set);
  const def = fiscalForRound(round);
  get().addLog("log.fiscal.start", { title: { tKey: def.titleKey }, round }, "SYSTEM");
  const humanQueue: number[] = [];
  for (const p of get().players) {
    if (p.bankrupt) continue;
    if (p.type === "AI") {
      const net = getNetWorthPublic(get(), p.id);
      const liquidatable = liquidatableCash(get(), p.id);
      applyFiscalToPlayer(get, set, p.id, def, def.aiChoice(p, net, liquidatable));
    } else {
      humanQueue.push(p.id);
    }
  }
  if (humanQueue.length === 0) {
    finalizeFiscal(get, set, def);
  } else {
    set(() => ({ pendingFiscal: { kind: def.kind, titleKey: def.titleKey, introKey: def.introKey, choices: def.choices, queue: humanQueue } }));
  }
}

// The autonomous central bank + government adjust the base interest rate and
// regulations for a new economic cycle, then announce it via the event banner.
function applyMonetaryPolicy(get: () => GameState & GameStore, set: SetFn) {
  const s = get();
  const { centralRate, reg, id } = rollMonetaryPolicy({ centralRate: s.centralRate, reg: s.regulations });
  // A new cycle resets last cycle's lobby perks.
  set((st) => ({ centralRate, regulations: reg, players: st.players.map((p) => (p.lobbyActive ? { ...p, lobbyActive: false } : p)) }));
  const ratePct = Math.round(centralRate * 100);
  const rentPct = Math.round((reg.rentMod - 1) * 100);
  const taxPct = Math.round(reg.propertyTaxRate * 100);
  // Bits carry numbers + short labels; render once in the active locale (snapshot).
  const bits = [tr("policy.bits.rate", { v: ratePct })];
  if (rentPct !== 0) bits.push(tr("policy.bits.rent", { sign: rentPct > 0 ? "+" : "", v: rentPct }));
  if (taxPct > 0) bits.push(tr("policy.bits.tax", { v: taxPct }));
  const bitsStr = bits.join(", ");
  get().addLog(
    "log.policy.applied",
    { title: { tKey: `policy.${id}.title` }, detail: { tKey: `policy.${id}.detail` }, bits: bitsStr },
    "SYSTEM",
  );
  set(() => ({
    eventMessage: {
      title: tr("ui.policy.bannerTitle", { title: tr(`policy.${id}.title`) }),
      detail: `${tr(`policy.${id}.detail`)} → ${bitsStr}.`,
      tier: "SPECIAL",
    },
  }));
}

// Per-turn settlement for the player whose turn just ended: pay this round's loan
// installment(s) and any government property-holding tax. Shortfalls trigger the
// normal liquidation → bankruptcy path.
function serviceBankAndGovernment(get: () => GameState & GameStore, set: SetFn, playerId: number) {
  const s = get();
  const player = s.players[playerId];
  if (!player || player.bankrupt) return;

  // Suspicion cools a little each round when lying low.
  if (player.heat > 0) {
    set((st) => ({ players: st.players.map((p) => (p.id === playerId ? { ...p, heat: Math.max(0, p.heat - HEAT_DECAY) } : p)) }));
  }

  // 1) Government property tax (a regulation; 0 when none is in force).
  //    Players with an active lobby perk are exempt.
  const taxRate = s.regulations?.propertyTaxRate ?? 0;
  if (taxRate > 0 && !player.lobbyActive && player.properties.length > 0) {
    let propValue = 0;
    for (const idx of player.properties) {
      const o = s.ownership[idx];
      if (o && !o.mortgaged) propValue += getPrice(getSpace(idx));
    }
    const tax = Math.ceil(propValue * taxRate);
    if (tax > 0) {
      set((st) => ({ players: st.players.map((p) => (p.id === playerId ? { ...p, balance: p.balance - tax } : p)) }));
      get().addLog("log.gov.propertyTax", { name: player.name, tax, rate: Math.round(taxRate * 100) }, "PAYMENT", playerId);
    }
  }

  // 2) Loan installments (skip loans created this very turn).
  const loans = get().players[playerId].loans ?? [];
  for (const loan of loans) {
    if (loan.takenTurn === s.turn) continue;
    const rate = get().centralRate;
    const { interest, principalPart, total, closes } = loanInstallment(loan, rate);
    set((st) => ({
      players: st.players.map((p) => {
        if (p.id !== playerId) return p;
        const newBalance = p.balance - total;
        const updatedLoans = (p.loans ?? [])
          .map((l) =>
            l.id === loan.id
              ? { ...l, balance: l.balance - principalPart, roundsRemaining: l.roundsRemaining - 1 }
              : l,
          )
          .filter((l) => l.balance > 0 && l.roundsRemaining > 0);
        return { ...p, balance: newBalance, loans: updatedLoans };
      }),
    }));
    get().addLog(
      closes ? "log.loan.installmentLast" : "log.loan.installment",
      { name: player.name, total, principal: principalPart, interest },
      "PAYMENT",
      playerId,
    );
  }

  // 3) Cover any resulting shortfall.
  if (get().players[playerId].balance < 0) {
    liquidateForDebt(get, set, playerId, 0);
    if (get().players[playerId].balance < 0) {
      declareBankruptcy(get, set, playerId, null);
    }
  }
}

// After a fine/penalty drives a balance negative, liquidate then bankrupt.
function coverShortfall(get: () => GameState & GameStore, set: SetFn, playerId: number) {
  if (get().players[playerId].balance >= 0) return;
  liquidateForDebt(get, set, playerId, 0);
  if (get().players[playerId].balance < 0) {
    declareBankruptcy(get, set, playerId, null);
  }
}

// Throw a player in jail by id (used by crime fallout, not a board move).
function sendToJailById(get: () => GameState & GameStore, set: SetFn, playerId: number, reasonKey: string) {
  set((st) => ({
    players: st.players.map((p) =>
      p.id === playerId ? { ...p, position: JAIL_INDEX, inJail: true, jailTurns: 0, jailCount: p.jailCount + 1 } : p,
    ),
  }));
  get().addLog("log.jail.sentenced", { name: get().players[playerId].name, reason: { tKey: reasonKey } }, "JAIL", playerId);
}

// Owner-side rent modifiers: lobby perk boosts rent; a jailed owner can't manage
// their estate so collected rent is halved.
function applyOwnerRentMods(s: GameState, ownerId: number, rent: number): number {
  const owner = s.players[ownerId];
  let r = rent;
  if (owner?.lobbyActive) r = Math.round(r * (1 + LOBBY_RENT_BONUS));
  r = jailedOwnerRent(s, ownerId, r);
  return r;
}

// If the payer armed evasion, under-report the rent (40%) and roll an audit.
// Caught → pay full rent + 1.5× penalty on the evaded portion, heat spikes, and
// a notorious offender goes to jail. Returns the rent actually charged.
function applyEvasion(get: () => GameState & GameStore, set: SetFn, payerId: number, rent: number): number {
  const payer = get().players[payerId];
  if (!payer || !payer.evadeNextRent) return rent;
  set((st) => ({ players: st.players.map((p) => (p.id === payerId ? { ...p, evadeNextRent: false } : p)) }));
  const reduced = Math.round(rent * EVADE_PAY_FRACTION);
  const evaded = rent - reduced;
  const caught = rng() < catchChance(CRIMES.EVADE.baseRisk, payer.heat);
  if (caught) {
    const penalty = Math.round(evaded * 1.5);
    set((st) => ({
      players: st.players.map((p) =>
        p.id === payerId ? { ...p, balance: p.balance - penalty, heat: Math.min(MAX_HEAT, p.heat + HEAT_ON_CAUGHT) } : p,
      ),
    }));
    get().addLog("log.crime.auditCaught", { name: payer.name, penalty }, "PAYMENT", payerId);
    if (payer.heat + HEAT_ON_CAUGHT >= HEAT_JAIL_THRESHOLD) sendToJailById(get, set, payerId, "log.jail.reason.evasion");
    return rent;
  }
  set((st) => ({ players: st.players.map((p) => (p.id === payerId ? { ...p, heat: Math.min(MAX_HEAT, p.heat + HEAT_PER_CRIME) } : p)) }));
  get().addLog("log.crime.evadeOk", { name: payer.name, reduced, rent }, "PAYMENT", payerId);
  return reduced;
}

// Forced liquidation: raise the player's cash toward `target` by selling
// buildings (whole color sets at a time, so the even-build rule stays valid)
// and then mortgaging properties. Used when a debt exceeds available cash.
function liquidateForDebt(
  get: () => GameState & GameStore,
  set: (fn: (s: GameState & GameStore) => Partial<GameState & GameStore>) => void,
  playerId: number,
  target: number,
) {
  const sBefore = get();
  const player = sBefore.players[playerId];
  if (!player) return;
  const startBalance = player.balance;

  const buildings = { ...sBefore.buildings };
  const ownership = { ...sBefore.ownership };
  const bank = { ...sBefore.bank };
  let balance = player.balance;

  const hasBuildingInSet = (setIdx: number[]) =>
    setIdx.some((i) => { const b = buildings[i]; return b && (b.houses > 0 || b.hotel); });

  // 1) Sell buildings, one color set at a time (keeps the set even at 0).
  const setsDone = new Set<string>();
  for (const idx of player.properties) {
    if (balance >= target) break;
    const space = getSpace(idx);
    if (space.type !== "PROPERTY") continue;
    const colorSet = (space as { colorSet: string }).colorSet;
    if (setsDone.has(colorSet)) continue;
    setsDone.add(colorSet);
    const setIdx = COLOR_SETS[colorSet] || [];
    if (!hasBuildingInSet(setIdx)) continue;
    for (const i of setIdx) {
      const b = buildings[i];
      if (!b) continue;
      const hp = (getSpace(i) as { housePrice: number }).housePrice;
      if (b.hotel) {
        balance += Math.floor(hp / 2) * 5; // hotel = 5 house-units
        bank.hotels += 1;
        buildings[i] = { houses: 0, hotel: false };
      } else if (b.houses > 0) {
        balance += Math.floor(hp / 2) * b.houses;
        bank.houses += b.houses;
        buildings[i] = { houses: 0, hotel: false };
      }
    }
  }

  // 2) Mortgage building-free properties until the target is met.
  if (balance < target) {
    for (const idx of player.properties) {
      if (balance >= target) break;
      const o = ownership[idx];
      if (!o || o.mortgaged) continue;
      const space = getSpace(idx);
      if (space.type === "PROPERTY") {
        const setIdx = COLOR_SETS[(space as { colorSet: string }).colorSet] || [];
        if (hasBuildingInSet(setIdx)) continue; // can't mortgage a set with buildings
      }
      balance += getMortgageValue(space);
      ownership[idx] = { ...o, mortgaged: true };
    }
  }

  set(() => ({
    players: sBefore.players.map((p) => (p.id === playerId ? { ...p, balance } : p)),
    buildings,
    ownership,
    bank,
  }));
  if (balance > startBalance) {
    get().addLog(
      "log.liquidate",
      { name: player.name, balance: Math.max(0, balance) },
      "PAYMENT",
      playerId,
    );
  }
}

function checkBankruptcyAndProceed(
  get: () => GameState & GameStore,
  set: (fn: (s: GameState & GameStore) => Partial<GameState & GameStore>) => void,
  isDoubles: boolean,
  creditorId: number | null = null,
) {
  let player = get().players[get().currentPlayerIndex];
  if (!player) return;

  // Short of cash → auto-liquidate buildings/properties to try to cover it.
  if (player.balance < 0) {
    liquidateForDebt(get, set, player.id, 0);
    player = get().players[get().currentPlayerIndex];
  }

  // Still underwater after liquidating everything → offer a rescue (an investor
  // can inject capital to keep them in the game), else go bankrupt.
  if (player.balance < 0) {
    offerRescueOrBankrupt(get, set, player.id, -player.balance, isDoubles, creditorId);
    return;
  }

  get().proceedAfterAction(isDoubles);
}

// At the moment of bankruptcy, give other players the chance to invest the
// debtor's deficit and revive them under a profit-sharing pact. AIs decide
// instantly; eligible humans are queued for a modal. If nobody invests, the
// debtor goes bankrupt as usual.
function offerRescueOrBankrupt(get: () => GameState & GameStore, set: SetFn, targetId: number, debt: number, isDoubles: boolean, creditorId: number | null) {
  for (const p of get().players) {
    if (p.bankrupt || p.id === targetId || p.type !== "AI" || p.balance < debt) continue;
    if (aiShouldInvest(get(), p.id, targetId, debt)) {
      doRescue(get, set, p.id, targetId, debt);
      get().proceedAfterAction(isDoubles);
      return;
    }
  }
  const humanQueue = get().players
    .filter((p) => !p.bankrupt && p.id !== targetId && p.type === "HUMAN" && p.balance >= debt)
    .map((p) => p.id);
  if (humanQueue.length > 0) {
    set(() => ({ pendingRescue: { targetId, debt, isDoubles, creditorId, queue: humanQueue } }));
    return; // wait for human decision
  }
  finalBankruptcy(get, set, targetId, creditorId);
}

// Revive a bankrupt-bound player: the investor pays the deficit, the debtor is
// kept in the game, and a profit-sharing pact (1.5× capital) is established.
function doRescue(get: () => GameState & GameStore, set: SetFn, investorId: number, targetId: number, debt: number) {
  set((st) => ({
    players: st.players.map((p) => {
      if (p.id === investorId) return { ...p, balance: p.balance - debt };
      if (p.id === targetId) return { ...p, balance: p.balance + debt, investorId, pactTarget: Math.ceil(debt * 1.5), pactPaid: 0 };
      return p;
    }),
  }));
  const inv = get().players[investorId];
  const tgt = get().players[targetId];
  get().addLog("log.rescue.invest", { inv: inv.name, debt, tgt: tgt.name, target: Math.ceil(debt * 1.5) }, "SYSTEM", investorId);
}

// Bankruptcy after no rescue: claw back any unpayable deficit from the creditor
// (who was paid the full bill up-front), then declare bankruptcy.
function finalBankruptcy(get: () => GameState & GameStore, set: SetFn, targetId: number, creditorId: number | null) {
  const player = get().players[targetId];
  if (creditorId !== null && player.balance < 0) {
    const deficit = player.balance; // negative
    set((st) => ({ players: st.players.map((p) => (p.id === creditorId ? { ...p, balance: p.balance + deficit } : p)) }));
  }
  declareBankruptcy(get, set, targetId, creditorId);
  if (get().turnPhase !== "GAME_OVER") get().proceedAfterAction(false);
}

function declareBankruptcy(
  get: () => GameState & GameStore,
  set: (fn: (s: GameState & GameStore) => Partial<GameState & GameStore>) => void,
  playerId: number,
  creditorId: number | null,
) {
  const s = get();
  const player = s.players[playerId];
  get().addLog("log.bankrupt", { name: player.name }, "SYSTEM", playerId);

  // Dissolve any investor pacts involving this player (as patron or as vassal).
  set((st) => ({
    players: st.players.map((p) =>
      (p.investorId === playerId || p.id === playerId)
        ? { ...p, investorId: null, pactTarget: 0, pactPaid: 0 }
        : p,
    ),
  }));

  if (creditorId !== null) {
    // Transfer all assets to creditor
    const creditor = s.players[creditorId];
    set((st) => ({
      players: st.players.map((p) => {
        if (p.id === playerId) {
          return { ...p, balance: 0, properties: [], getOutOfJailCards: 0, bankrupt: true, inJail: false };
        }
        if (p.id === creditorId) {
          return {
            ...p,
            balance: p.balance + Math.max(0, player.balance),
            properties: [...p.properties, ...player.properties],
            getOutOfJailCards: p.getOutOfJailCards + player.getOutOfJailCards,
          };
        }
        return p;
      }),
      ownership: (() => {
        const newOwnership = { ...st.ownership };
        for (const idx of player.properties) {
          newOwnership[idx] = { ...newOwnership[idx], ownerId: creditorId };
          // Creditor must pay 10% interest on mortgaged properties
        }
        return newOwnership;
      })(),
    }));
    get().addLog("log.assets.toCreditor", { name: player.name, creditor: creditor.name }, "SYSTEM");
  } else {
    // Bankrupt to bank - return all to bank, buildings destroyed
    set((st) => ({
      players: st.players.map((p) =>
        p.id === playerId ? { ...p, balance: 0, properties: [], getOutOfJailCards: 0, bankrupt: true, inJail: false } : p,
      ),
      ownership: (() => {
        const newOwnership = { ...st.ownership };
        for (const idx of player.properties) {
          newOwnership[idx] = { ownerId: null, mortgaged: false, houses: 0, hotel: false };
        }
        return newOwnership;
      })(),
      buildings: (() => {
        const newBuildings = { ...st.buildings };
        for (const idx of player.properties) {
          newBuildings[idx] = { houses: 0, hotel: false };
        }
        return newBuildings;
      })(),
    }));
    get().addLog("log.assets.toBank", { name: player.name }, "SYSTEM");
  }

  // Check winner
  const newS = get();
  const winner = findWinner(newS);
  if (winner !== null) {
    set(() => ({ winnerId: winner, turnPhase: "GAME_OVER" }));
    get().addLog("log.game.win", { name: newS.players[winner].name }, "SYSTEM");
  }
}

export function getNetWorthPublic(s: GameState & GameStore, playerId: number): number {
  const player = s.players[playerId];
  let total = player.balance;
  for (const idx of player.properties) {
    const space = getSpace(idx);
    const ownership = s.ownership[idx];
    if (!ownership) continue;
    const value = getPrice(space);
    if (ownership.mortgaged) {
      total += Math.floor(value / 2);
    } else {
      total += value;
    }
    const buildings = s.buildings[idx];
    if (buildings && space.type === "PROPERTY") {
      const housePrice = (space as { housePrice: number }).housePrice;
      total += (buildings.houses + (buildings.hotel ? 5 : 0)) * housePrice;
    }
  }
  return total;
}

function aiEvaluateTrade(s: GameState & GameStore, trade: {
  fromId: number;
  toId: number;
  cashFrom: number;
  cashTo: number;
  propertiesFrom: number[];
  propertiesTo: number[];
  goojFrom: number;
  goojTo: number;
}): boolean {
  // AI evaluates: accept if net value received exceeds value given, taking
  // monopoly synergy into account (completing a color set is worth far more
  // than the face price; breaking up an existing monopoly is heavily penalised).
  const to = s.players[trade.toId];
  // How precious cash is to this AI right now. A cash-poor AI guards its money
  // harder (paying hurts more) AND is keener to receive it — e.g. it will sell a
  // spare property to raise funds. A cash-rich AI values property a bit more.
  const cashWeight = to.balance < 150 ? 1.5 : to.balance < 350 ? 1.2 : to.balance < 800 ? 1.0 : 0.9;
  let valueReceived = trade.cashFrom * cashWeight;
  let valueGiven = trade.cashTo * cashWeight;
  for (const idx of trade.propertiesFrom) {
    valueReceived += getPrice(getSpace(idx)) * 1.15; // value of property AI gains
  }
  for (const idx of trade.propertiesTo) {
    // AI is willing to part with a plain property for ~1.05× its face price
    // (monopoly pieces are protected separately below).
    valueGiven += getPrice(getSpace(idx)) * 1.05;
  }
  // GOOJ card value: worth more if recipient is currently in jail.
  const goojValueTo = to.inJail ? 100 : 60;
  const goojValueFrom = s.players[trade.fromId].inJail ? 100 : 60;
  valueReceived += trade.goojFrom * goojValueTo;
  valueGiven += trade.goojTo * goojValueFrom;

  // ----- Monopoly synergy -----
  // Properties the AI would own before and after this trade.
  const ownedBefore = new Set(to.properties);
  const ownedAfter = new Set(to.properties);
  for (const idx of trade.propertiesTo) ownedAfter.delete(idx); // AI gives these away
  for (const idx of trade.propertiesFrom) ownedAfter.add(idx); // AI receives these

  for (const [, indices] of Object.entries(COLOR_SETS)) {
    const ownsAllBefore = indices.every((i) => ownedBefore.has(i));
    const ownsAllAfter = indices.every((i) => ownedAfter.has(i));
    // Approx value of a full set = sum of building potential (~ price of set).
    const setValue = indices.reduce((sum, i) => sum + getPrice(getSpace(i)), 0);
    if (!ownsAllBefore && ownsAllAfter) {
      valueReceived += setValue * 1.5; // completing a monopoly is very attractive
    } else if (ownsAllBefore && !ownsAllAfter) {
      valueGiven += setValue * 2.5; // never break a monopoly cheaply
    }
  }

  // Don't arm a rival cheaply: if the deal would hand the OTHER player a fresh
  // monopoly, demand a higher price for it.
  const from = s.players[trade.fromId];
  const fromAfter = new Set(from.properties);
  for (const idx of trade.propertiesTo) fromAfter.add(idx); // the other player receives these
  for (const idx of trade.propertiesFrom) fromAfter.delete(idx); // ...and gives these up
  for (const [, indices] of Object.entries(COLOR_SETS)) {
    const fromBefore = indices.every((i) => from.properties.includes(i));
    const fromCompletes = !fromBefore && indices.every((i) => fromAfter.has(i));
    if (fromCompletes) {
      const setValue = indices.reduce((sum, i) => sum + getPrice(getSpace(i)), 0);
      // How defensive the seller is about arming a rival, by skill: a sharp (Hard)
      // AI rarely hands over a monopoly, an average (Medium) one is cautious, and a
      // weak (Easy) one barely cares. A cash-strapped seller relents either way.
      const armScale = to.difficulty === "EASY" ? 0.15 : to.difficulty === "HARD" ? 1.1 : 0.45;
      valueGiven += setValue * armScale * (to.balance < 250 ? 0.4 : 1);
    }
  }

  // The AI can fund cash it owes by liquidating (sell buildings / mortgage), so
  // judge affordability against liquidatable worth, not just cash on hand — a
  // property-rich, cash-poor AI can still pay. Keep only a tiny reserve.
  if (liquidatableCash(s, to.id) - trade.cashTo < 40) return false;

  return valueReceived > valueGiven;
}

// Public wrapper for UI: the most cash a player could actually pay in a trade.
export function getLiquidatableCash(s: GameState, playerId: number): number {
  return liquidatableCash(s, playerId);
}

// Public wrapper for the Bank UI: remaining borrowing capacity for a player.
export function getCreditLimitPublic(s: GameState & GameStore, playerId: number): number {
  const player = s.players[playerId];
  if (!player) return 0;
  const net = getNetWorthPublic(s, playerId);
  return creditLimit(net, totalDebt(player.loans ?? []));
}

// Cash a player could realistically raise right now: their balance plus mortgage
// proceeds on unmortgaged properties and the resale value of any buildings.
function liquidatableCash(s: GameState, playerId: number): number {
  const player = s.players[playerId];
  let total = player.balance;
  for (const idx of player.properties) {
    const o = s.ownership[idx];
    if (!o) continue;
    const space = getSpace(idx);
    if (!o.mortgaged) total += getMortgageValue(space);
    const b = s.buildings[idx];
    if (b && space.type === "PROPERTY") {
      const hp = (space as { housePrice: number }).housePrice;
      total += (b.houses + (b.hotel ? 5 : 0)) * Math.floor(hp / 2);
    }
  }
  return total;
}
