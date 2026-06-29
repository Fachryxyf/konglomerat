// ===== Brand & theme (rebrand: original IP, distinct from Hasbro's Monopoly) =====
// The game MECHANICS are not copyrightable, but names/art/text are. This file
// centralises the original brand so the product is legally distinct — and so it
// can be re-skinned by editing one place. Tile names live in `boardData.ts`.

export const BRAND = {
  name: "KONGLOMERAT",
  short: "Konglomerat",
  tagline: "Bangun imperium properti & ekonomi di Kota Raya.",
  // The two card decks (originally "Chance" / "Community Chest").
  decks: {
    CHANCE: { label: "KESEMPATAN", short: "Kesempatan" },
    COMMUNITY_CHEST: { label: "DANA UMUM", short: "Dana Umum" },
  },
} as const;

export type DeckKind = keyof typeof BRAND.decks;
