import type { GameState } from "./types";
import type { Intent, IntentResult } from "./intents";
import { getSpace, hasMonopoly, getColorSetSpaces, countRailroads } from "./utils";
import { getPrice, getMortgageValue } from "./boardData";
import { creditLimit, totalDebt } from "./bank";
import { jailBail, BRIBE_GUARD_COST, LOBBY_COST, rigAuctionCost } from "./government";

// ===== Rule / context validator (Phase 1: anti-cheat gate) =====
// The SECOND gate (after schema): does this intent obey the rules, given the
// AUTHORITATIVE state — not anything the client claims? Pure & framework-free, so
// the exact same function runs on the client (instant feedback) and, later, on
// the server (the real gate). Returns ok or a human-readable reason.

const ok: IntentResult = { ok: true };
const fail = (reason: string): IntentResult => ({ ok: false, reason });

// Local, dependency-free net worth (cash + unmortgaged property + buildings) so
// this module never has to import the store.
function netWorth(s: GameState, playerId: number): number {
  const p = s.players[playerId];
  if (!p) return 0;
  let total = p.balance;
  for (const idx of p.properties) {
    const o = s.ownership[idx];
    if (!o) continue;
    const space = getSpace(idx);
    total += o.mortgaged ? Math.floor(getPrice(space) / 2) : getPrice(space);
    const b = s.buildings[idx];
    if (b && space.type === "PROPERTY") {
      total += (b.houses + (b.hotel ? 5 : 0)) * (space as { housePrice: number }).housePrice;
    }
  }
  return total;
}

const isPurchasable = (t: string) => t === "PROPERTY" || t === "RAILROAD" || t === "UTILITY";

// Has any building anywhere in this property's colour set (blocks mortgage/sell).
function setHasBuildings(s: GameState, spaceIndex: number): boolean {
  const space = getSpace(spaceIndex);
  if (space.type !== "PROPERTY") return false;
  const setIdx = getColorSetSpaces((space as { colorSet: string }).colorSet as never);
  return setIdx.some((i) => { const b = s.buildings[i]; return b && (b.houses > 0 || b.hotel); });
}

// `pendingTrade` lives on the store wrapper, not GameState — accept it optionally.
type ValidatableState = GameState & { pendingTrade?: { fromId: number; toId: number } | null };

export function validateIntent(state: ValidatableState, intent: Intent, actorId: number): IntentResult {
  const s = state;
  const actor = s.players[actorId];
  if (!actor) return fail("Pemain tidak dikenal.");
  if (actor.bankrupt) return fail("Pemain sudah bangkrut.");
  if (s.turnPhase === "GAME_OVER") return fail("Permainan sudah selesai.");

  const isTurn = actorId === s.currentPlayerIndex;
  const phase = s.turnPhase;

  switch (intent.type) {
    case "ROLL_DICE":
      if (!isTurn) return fail("Bukan giliranmu.");
      if (phase !== "WAITING_ROLL" && phase !== "JAIL_DECISION") return fail("Tidak bisa melempar dadu sekarang.");
      return ok;

    case "END_TURN":
      if (!isTurn) return fail("Bukan giliranmu.");
      if (phase === "AUCTION" || phase === "CARD_DRAW") return fail("Selesaikan aksi dulu sebelum mengakhiri giliran.");
      return ok;

    case "BUY_PROPERTY":
    case "DECLINE_BUY": {
      if (!isTurn) return fail("Bukan giliranmu.");
      const idx = s.pendingSpaceAction;
      if (idx === null) return fail("Tidak ada properti untuk dibeli.");
      const space = getSpace(idx);
      if (!isPurchasable(space.type)) return fail("Petak ini bukan properti.");
      if (s.ownership[idx]?.ownerId != null) return fail("Properti sudah dimiliki.");
      if (intent.type === "BUY_PROPERTY" && actor.balance < getPrice(space)) return fail("Saldo tidak cukup untuk membeli.");
      return ok;
    }

    case "JAIL_DECISION": {
      if (!isTurn) return fail("Bukan giliranmu.");
      if (!actor.inJail) return fail("Kamu tidak sedang dipenjara.");
      if (intent.decision === "PAY") {
        const bail = jailBail(actor.jailCount, netWorth(s, actorId));
        if (actor.balance < bail) return fail(`Saldo tidak cukup untuk jaminan ($${bail}).`);
      }
      if (intent.decision === "CARD" && actor.getOutOfJailCards <= 0) return fail("Tidak punya kartu bebas penjara.");
      return ok;
    }

    case "BUILD_HOUSE":
    case "BUILD_HOTEL": {
      if (!isTurn) return fail("Bukan giliranmu.");
      if (actor.inJail) return fail("Sedang dipenjara — tak bisa membangun.");
      const idx = intent.spaceIndex;
      const space = getSpace(idx);
      if (space.type !== "PROPERTY") return fail("Hanya properti warna yang bisa dibangun.");
      if (s.ownership[idx]?.ownerId !== actorId) return fail("Bukan propertimu.");
      if (!hasMonopoly(s, actorId, idx)) return fail("Butuh monopoli color set untuk membangun.");
      const b = s.buildings[idx] || { houses: 0, hotel: false };
      const hp = (space as { housePrice: number }).housePrice;
      if (intent.type === "BUILD_HOTEL") {
        if (b.hotel) return fail("Sudah ada hotel.");
        if (b.houses !== 4) return fail("Butuh 4 rumah dulu untuk membangun hotel.");
        if (s.bank.hotels < 1) return fail("Bank kehabisan hotel.");
        if (actor.balance < hp) return fail("Saldo tidak cukup.");
      } else {
        if (b.hotel || b.houses >= 4) return fail("Sudah maksimal rumah.");
        if (s.bank.houses < 1) return fail("Bank kehabisan rumah.");
        if (actor.balance < hp) return fail("Saldo tidak cukup.");
      }
      return ok;
    }

    case "SELL_HOUSE":
    case "SELL_HOTEL": {
      if (!isTurn) return fail("Bukan giliranmu.");
      const idx = intent.spaceIndex;
      if (s.ownership[idx]?.ownerId !== actorId) return fail("Bukan propertimu.");
      const b = s.buildings[idx];
      if (!b) return fail("Tidak ada bangunan.");
      if (intent.type === "SELL_HOTEL" ? !b.hotel : b.houses <= 0) return fail("Tidak ada bangunan untuk dijual.");
      return ok;
    }

    case "MORTGAGE": {
      if (!isTurn) return fail("Bukan giliranmu.");
      const idx = intent.spaceIndex;
      if (s.ownership[idx]?.ownerId !== actorId) return fail("Bukan propertimu.");
      if (s.ownership[idx]?.mortgaged) return fail("Sudah digadai.");
      if (setHasBuildings(s, idx)) return fail("Jual bangunan di color set ini dulu.");
      return ok;
    }

    case "UNMORTGAGE": {
      if (!isTurn) return fail("Bukan giliranmu.");
      const idx = intent.spaceIndex;
      if (s.ownership[idx]?.ownerId !== actorId) return fail("Bukan propertimu.");
      if (!s.ownership[idx]?.mortgaged) return fail("Properti tidak sedang digadai.");
      const cost = Math.ceil(getMortgageValue(getSpace(idx)) * 1.1);
      if (actor.balance < cost) return fail(`Saldo tidak cukup untuk menebus ($${cost}).`);
      return ok;
    }

    case "SELL_TO_BANK":
    case "AUCTION_OWN": {
      if (!isTurn) return fail("Bukan giliranmu.");
      const idx = intent.spaceIndex;
      if (s.ownership[idx]?.ownerId !== actorId) return fail("Bukan propertimu.");
      if (s.buildings[idx] && (s.buildings[idx].houses > 0 || s.buildings[idx].hotel)) return fail("Ada bangunan di properti ini.");
      if (setHasBuildings(s, idx)) return fail("Ada bangunan di color set.");
      return ok;
    }

    case "AUCTION_BID": {
      const a = s.auction;
      if (!a.isActive) return fail("Tidak ada lelang berjalan.");
      if (!a.participants.includes(actorId) || a.passedPlayers.includes(actorId)) return fail("Kamu tidak ikut lelang ini.");
      if (a.participants[a.turnIndex] !== actorId) return fail("Belum giliranmu menawar.");
      if (intent.amount <= a.currentBid) return fail("Tawaran harus lebih tinggi dari tawaran sekarang.");
      if (intent.amount > actor.balance) return fail("Tawaran melebihi saldo.");
      return ok;
    }

    case "AUCTION_PASS": {
      const a = s.auction;
      if (!a.isActive) return fail("Tidak ada lelang berjalan.");
      if (!a.participants.includes(actorId)) return fail("Kamu tidak ikut lelang ini.");
      return ok;
    }

    case "TAKE_LOAN": {
      const limit = creditLimit(netWorth(s, actorId), totalDebt(actor.loans ?? []));
      if (intent.amount < 50) return fail("Minimal pinjaman $50.");
      if (intent.amount > limit) return fail(`Melebihi plafon kredit ($${limit}).`);
      return ok;
    }

    case "REPAY_LOAN": {
      const loan = (actor.loans ?? []).find((l) => l.id === intent.loanId);
      if (!loan) return fail("Pinjaman tidak ditemukan.");
      const payoff = loan.balance + Math.ceil(loan.balance * (s.centralRate + 0.02));
      if (actor.balance < payoff) return fail(`Saldo tidak cukup untuk melunasi ($${payoff}).`);
      return ok;
    }

    case "BRIBE_GUARD":
      if (!actor.inJail) return fail("Hanya bisa menyuap saat dipenjara.");
      if (actor.balance < BRIBE_GUARD_COST) return fail(`Butuh $${BRIBE_GUARD_COST} untuk menyuap.`);
      return ok;

    case "LOBBY":
      if (actor.inJail) return fail("Sedang dipenjara — aktivitas dibekukan.");
      if (actor.lobbyActive) return fail("Perk lobi masih aktif.");
      if (actor.balance < LOBBY_COST) return fail(`Butuh $${LOBBY_COST} untuk melobi.`);
      return ok;

    case "ARM_EVASION":
      if (actor.inJail) return fail("Sedang dipenjara — aktivitas dibekukan.");
      return ok;

    case "RIG_AUCTION": {
      if (actor.inJail) return fail("Sedang dipenjara — aktivitas dibekukan.");
      const a = s.auction;
      if (!a.isActive || a.propertyIndex === null) return fail("Tidak ada lelang berjalan.");
      if (!a.participants.includes(actorId)) return fail("Kamu tidak ikut lelang ini.");
      if (actor.balance < rigAuctionCost(a.currentBid)) return fail("Saldo tidak cukup untuk memanipulasi lelang.");
      return ok;
    }

    case "PROPOSE_TRADE": {
      const t = intent.trade;
      if (t.fromId !== actorId) return fail("Hanya bisa mengajukan trade atas namamu sendiri.");
      if (t.toId === t.fromId) return fail("Tidak bisa trade dengan diri sendiri.");
      const to = s.players[t.toId];
      if (!to || to.bankrupt) return fail("Mitra trade tidak valid.");
      if (actor.inJail) return fail("Sedang dipenjara — tak bisa mengajukan trade.");
      for (const idx of t.propertiesFrom) if (s.ownership[idx]?.ownerId !== t.fromId) return fail("Kamu tidak memiliki salah satu properti yang ditawarkan.");
      for (const idx of t.propertiesTo) if (s.ownership[idx]?.ownerId !== t.toId) return fail("Mitra tidak memiliki salah satu properti yang diminta.");
      if (t.goojFrom > actor.getOutOfJailCards) return fail("Kartu bebas penjara tidak cukup.");
      if (t.goojTo > to.getOutOfJailCards) return fail("Kartu bebas penjara mitra tidak cukup.");
      return ok;
    }

    case "ACCEPT_TRADE":
    case "REJECT_TRADE": {
      const pt = s.pendingTrade;
      if (!pt) return fail("Tidak ada tawaran trade.");
      if (intent.type === "ACCEPT_TRADE" && actorId !== pt.toId) return fail("Hanya penerima yang bisa menyetujui.");
      return ok;
    }

    case "DISMISS_CARD":
      if (!s.pendingCard) return fail("Tidak ada kartu untuk ditutup.");
      return ok;

    case "PAY_TAX": {
      if (!isTurn) return fail("Bukan giliranmu.");
      const idx = s.pendingSpaceAction;
      if (idx === null || getSpace(idx).type !== "TAX") return fail("Tidak ada pajak untuk dibayar.");
      return ok;
    }

    case "RESOLVE_FISCAL": {
      const pf = s.pendingFiscal;
      if (!pf) return fail("Tidak ada keputusan fiskal.");
      if (!pf.queue.includes(actorId)) return fail("Bukan giliranmu memutuskan.");
      if (!pf.choices.some((c) => c.id === intent.choiceId)) return fail("Pilihan tidak valid.");
      return ok;
    }

    case "RESOLVE_RESCUE": {
      const pr = s.pendingRescue;
      if (!pr) return fail("Tidak ada keputusan penyelamatan.");
      if (!pr.queue.includes(actorId)) return fail("Bukan giliranmu memutuskan.");
      return ok;
    }

    default:
      return fail("Intent tidak dikenal.");
  }
}
