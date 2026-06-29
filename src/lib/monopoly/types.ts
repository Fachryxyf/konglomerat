// ===== Monopoly Game Types =====

export type SpaceType =
  | "GO"
  | "PROPERTY"
  | "RAILROAD"
  | "UTILITY"
  | "CHANCE"
  | "COMMUNITY_CHEST"
  | "TAX"
  | "JAIL"
  | "FREE_PARKING"
  | "GO_TO_JAIL";

export type ColorSet =
  | "Brown"
  | "LightBlue"
  | "Pink"
  | "Orange"
  | "Red"
  | "Yellow"
  | "Green"
  | "DarkBlue";

export type TaxType = "INCOME" | "LUXURY";

export interface PropertySpace {
  index: number;
  type: "PROPERTY";
  name: string;
  colorSet: ColorSet;
  price: number;
  rent: [number, number, number, number, number, number]; // bare, 1h, 2h, 3h, 4h, hotel
  housePrice: number;
  mortgageValue: number;
}

export interface RailroadSpace {
  index: number;
  type: "RAILROAD";
  name: string;
  price: number;
  rent: [number, number, number, number]; // 1,2,3,4 owned
  mortgageValue: number;
}

export interface UtilitySpace {
  index: number;
  type: "UTILITY";
  name: string;
  price: number;
  multiplier: [number, number]; // [4, 10]
  mortgageValue: number;
}

export interface TaxSpace {
  index: number;
  type: "TAX";
  name: string;
  taxType: TaxType;
  amount: number; // flat amount; for income tax, also 10% option
}

export interface CornerSpace {
  index: number;
  type: "GO" | "JAIL" | "FREE_PARKING" | "GO_TO_JAIL";
  name: string;
}

export interface CardSpace {
  index: number;
  type: "CHANCE" | "COMMUNITY_CHEST";
  name: string;
}

export type BoardSpace =
  | PropertySpace
  | RailroadSpace
  | UtilitySpace
  | TaxSpace
  | CornerSpace
  | CardSpace;

export type CardType =
  | "MOVE_TO" // move to specific position
  | "MOVE_TO_NEAREST" // move to nearest of type
  | "MOVE_SPACES" // move backward/forward N spaces
  | "COLLECT" // collect from bank
  | "PAY" // pay bank
  | "COLLECT_FROM_EACH" // collect from each player
  | "PAY_EACH" // pay each player
  | "REPAIRS" // pay per house/hotel
  | "GO_TO_JAIL"
  | "GET_OUT_OF_JAIL"
  | "PAY_OR_PERCENT"; // income tax style

export interface GameCard {
  id: number;
  deck: "CHANCE" | "COMMUNITY_CHEST";
  instruction: string;
  type: CardType;
  // optional params
  targetPosition?: number; // for MOVE_TO
  targetType?: "RAILROAD" | "UTILITY"; // for MOVE_TO_NEAREST
  spaces?: number; // for MOVE_SPACES (can be negative)
  amount?: number; // for COLLECT/PAY
  perHouse?: number; // for REPAIRS
  perHotel?: number; // for REPAIRS
  collectGo?: boolean; // collect $200 if passing GO
  rentMultiplier?: number; // for nearest railroad (2x) / utility (10x)
  flatOrPercent?: { flat: number; percent: number }; // for PAY_OR_PERCENT
}

export type TurnPhase =
  | "WAITING_ROLL"
  | "ROLLING_DICE"
  | "MOVING"
  | "ACTION"
  | "POST_ACTION"
  | "JAIL_DECISION"
  | "AUCTION"
  | "CARD_DRAW"
  | "GAME_OVER";

export type EventTier = "REGULAR" | "SPECIAL" | "RARE" | "MYTHOS";

export type PlayerType = "HUMAN" | "AI";
export type AIDifficulty = "EASY" | "MEDIUM" | "HARD";

// A bank loan with floating interest (tracks the central rate) and a fixed term.
export interface Loan {
  id: number;
  principal: number; // original amount borrowed
  balance: number; // outstanding principal still owed
  term: number; // total rounds to repay
  roundsRemaining: number; // rounds left before the loan must be fully repaid
  principalPerRound: number; // fixed principal portion charged each round
  takenTurn: number; // turn the loan was created (so it's not serviced same turn)
}

// Government regulations — persistent levers re-tuned by the autonomous economy.
export interface Regulations {
  rentMod: number; // multiplier on rent paid (rent control <1, deregulation >1)
  propertyTaxRate: number; // per-round holding tax as a fraction of property value
}

export interface Player {
  id: number;
  name: string;
  color: string;
  token: string;
  type: PlayerType;
  difficulty: AIDifficulty; // only used for AI players
  balance: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  getOutOfJailCards: number;
  properties: number[]; // space indices owned
  bankrupt: boolean;
  isActive: boolean;
  // Investor pact (set when a player is rescued from bankruptcy):
  investorId: number | null; // patron who rescued this player
  pactTarget: number; // revenue the investor must recoup (1.5× capital) before the pact ends
  pactPaid: number; // revenue already routed to the investor so far
  loans: Loan[]; // outstanding bank loans
  // Government / corruption:
  heat: number; // suspicion level 0..100 (raises catch chance, decays over time)
  jailCount: number; // times jailed (scales bail)
  evadeNextRent: boolean; // armed: next rent payment is under-reported (audit risk)
  lobbyActive: boolean; // lobby perk active (tax-exempt + rent bonus) until next cycle
}

export interface BuildingState {
  // spaceIndex -> { houses: 0..4, hotel: boolean }
  houses: number;
  hotel: boolean;
}

export interface SpaceOwnership {
  ownerId: number | null;
  mortgaged: boolean;
  houses: number;
  hotel: boolean;
}

export interface AuctionState {
  isActive: boolean;
  propertyIndex: number | null;
  currentBid: number;
  currentBidderId: number | null;
  participants: number[]; // player ids still in auction
  passedPlayers: number[];
  turnIndex: number; // index into participants for whose turn to bid
  sellerId: number | null; // owner reselling their property (null = bank sells)
  resumePhase: TurnPhase | null; // phase to restore after an owner-initiated auction
}

export interface TradeOffer {
  fromId: number;
  toId: number;
  cashFrom: number;
  cashTo: number;
  propertiesFrom: number[];
  propertiesTo: number[];
  getOutOfJailFrom: number;
  getOutOfJailTo: number;
}

// A log message is stored as an i18n key plus its interpolation params, so the
// whole history re-renders in the active language (see dict/log.ts). Param values
// are plain strings/numbers, or `{ tKey }` references for nested localized names
// (e.g. a property name) — kept loosely typed here to avoid importing i18n into
// the game core.
export type LogParam = string | number | { tKey: string };
export interface LogMsg {
  key: string;
  params?: Record<string, LogParam>;
}

export interface LogEntry {
  id: number;
  turn: number;
  playerId: number | null;
  msg: LogMsg;
  kind: "ROLL" | "MOVE" | "ACTION" | "PAYMENT" | "CARD" | "AUCTION" | "SYSTEM" | "TRADE" | "BUILD" | "JAIL";
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  turnPhase: TurnPhase;
  doublesCount: number;
  lastDiceRoll: { die1: number; die2: number; isDoubles: boolean };
  board: BoardSpace[];
  ownership: Record<number, SpaceOwnership>;
  buildings: Record<number, BuildingState>;
  chanceDeck: GameCard[];
  chanceDiscard: GameCard[];
  communityChestDeck: GameCard[];
  communityChestDiscard: GameCard[];
  bank: {
    houses: number;
    hotels: number;
  };
  auction: AuctionState;
  log: LogEntry[];
  turn: number;
  winnerId: number | null;
  round: number; // full rounds elapsed (all players took a turn = 1 round)
  centralRate: number; // central bank base interest rate (per round)
  regulations: Regulations; // active government regulations
  eventMessage: { title: string; detail: string; tier: EventTier } | null; // random event banner
  pendingFiscal: {
    kind: "TAX" | "INFLATION";
    titleKey: string;
    introKey: string;
    choices: { id: string; labelKey: string; descKey: string }[];
    queue: number[]; // human player ids still to decide (AIs resolve instantly)
  } | null;
  pendingRescue: {
    targetId: number; // the player about to go bankrupt
    debt: number; // capital needed to rescue (their deficit)
    isDoubles: boolean; // carried so the turn resolves correctly afterwards
    creditorId: number | null; // who the bill was owed to (for clawback if not rescued)
    queue: number[]; // human investor candidates still to decide
  } | null;
  pendingCard: GameCard | null;
  pendingSpaceAction: number | null; // space index awaiting action (buy/auction)
  pendingRent: {
    payerId: number;
    payeeId: number;
    spaceIndex: number;
    amount: number;
    diceTotal: number;
    isUtility: boolean;
    multiplier: number;
  } | null;
  lastRollSummary: string;
}
