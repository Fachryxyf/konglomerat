import type { GameState } from "./types";
import { getSpace } from "./utils";

// ===== State-integrity invariants (Phase 1: tamper / bug detector) =====
// Properties that must ALWAYS hold after any legal transition. A violation means
// either a bug or tampering. On the client these surface as dev warnings; once an
// authoritative server exists, a violation = reject the transition / desync-kick.
// Deliberately checks structural truths only (ownership consistency, bank stock,
// building bounds) — NOT money totals, since the game legitimately creates and
// destroys cash (GO, taxes, events, loans).

export function checkInvariants(state: GameState): string[] {
  const v: string[] = [];
  const s = state;

  // Bank building stock can't go negative.
  if (s.bank.houses < 0) v.push(`bank.houses negatif (${s.bank.houses})`);
  if (s.bank.hotels < 0) v.push(`bank.hotels negatif (${s.bank.hotels})`);

  // Ownership ⇄ players.properties must agree both ways.
  for (let idx = 0; idx < 40; idx++) {
    const o = s.ownership[idx];
    if (!o) continue;
    if (o.ownerId !== null) {
      const owner = s.players[o.ownerId];
      if (!owner) {
        v.push(`petak ${idx} dimiliki pemain tak dikenal ${o.ownerId}`);
      } else if (!owner.properties.includes(idx)) {
        v.push(`petak ${idx}: ownership=${o.ownerId} tapi tidak ada di daftar properti pemain`);
      }
    }
  }
  for (const p of s.players) {
    if (p.bankrupt) {
      if (p.properties.length > 0) v.push(`pemain bangkrut ${p.id} masih memegang properti`);
      continue;
    }
    for (const idx of p.properties) {
      if (s.ownership[idx]?.ownerId !== p.id) {
        v.push(`pemain ${p.id} mengklaim petak ${idx} tapi ownership tidak cocok`);
      }
    }
  }

  // Buildings must sit on owned PROPERTY tiles, within bounds.
  for (let idx = 0; idx < 40; idx++) {
    const b = s.buildings[idx];
    if (!b) continue;
    if (b.houses === 0 && !b.hotel) continue;
    const space = getSpace(idx);
    if (space.type !== "PROPERTY") { v.push(`bangunan di petak non-properti ${idx}`); continue; }
    if (s.ownership[idx]?.ownerId == null) v.push(`bangunan di petak tak bermilik ${idx}`);
    if (b.houses < 0 || b.houses > 4) v.push(`jumlah rumah di luar 0..4 di petak ${idx} (${b.houses})`);
    if (b.hotel && b.houses !== 0 && b.houses !== 4) v.push(`hotel + rumah tak konsisten di petak ${idx}`);
  }

  // Loan balances are non-negative.
  for (const p of s.players) {
    for (const l of p.loans ?? []) {
      if (l.balance < 0) v.push(`pinjaman pemain ${p.id} balance negatif (${l.balance})`);
    }
  }

  return v;
}

export function assertInvariants(state: GameState, context = ""): void {
  const violations = checkInvariants(state);
  if (violations.length > 0 && typeof console !== "undefined") {
    console.warn(`[invariant]${context ? " " + context : ""} pelanggaran:`, violations);
  }
}
