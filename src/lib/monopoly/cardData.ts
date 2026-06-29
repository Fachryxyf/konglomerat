import type { GameCard } from "./types";
import { rng } from "./rng";

// 22 Kartu Chance (diperluas dari 16)
export const CHANCE_CARDS: GameCard[] = [
  {
    id: 1,
    deck: "CHANCE",
    instruction: "Maju ke MULAI (Kumpulkan $200).",
    type: "MOVE_TO",
    targetPosition: 0,
    collectGo: true,
  },
  {
    id: 2,
    deck: "CHANCE",
    instruction: "Bank membayar dividen sebesar $50.",
    type: "COLLECT",
    amount: 50,
  },
  {
    id: 3,
    deck: "CHANCE",
    instruction: "Mundur 3 kotak.",
    type: "MOVE_SPACES",
    spaces: -3,
  },
  {
    id: 4,
    deck: "CHANCE",
    instruction: "Langsung masuk penjara. Jangan lewati MULAI, jangan kumpulkan $200.",
    type: "GO_TO_JAIL",
  },
  {
    id: 5,
    deck: "CHANCE",
    instruction: "Lakukan perbaikan umum di seluruh propertimu: $25 per rumah, $100 per hotel.",
    type: "REPAIRS",
    perHouse: 25,
    perHotel: 100,
  },
  {
    id: 6,
    deck: "CHANCE",
    instruction: "Maju ke Jalan Mahkota. Jika lewati MULAI, kumpulkan $200.",
    type: "MOVE_TO",
    targetPosition: 24,
    collectGo: true,
  },
  {
    id: 7,
    deck: "CHANCE",
    instruction: "Maju ke Alun-Alun Timur. Jika lewati MULAI, kumpulkan $200.",
    type: "MOVE_TO",
    targetPosition: 11,
    collectGo: true,
  },
  {
    id: 8,
    deck: "CHANCE",
    instruction: "Maju ke utilitas terdekat. Jika tidak dimiliki, kamu bisa beli. Jika dimiliki, lempar dadu dan bayar pemilik 10x angka dadu.",
    type: "MOVE_TO_NEAREST",
    targetType: "UTILITY",
    collectGo: true,
    rentMultiplier: 10,
  },
  {
    id: 9,
    deck: "CHANCE",
    instruction: "Maju ke stasiun kereta terdekat. Jika tidak dimiliki, kamu bisa beli. Jika dimiliki, bayar pemilik 2x sewa normal.",
    type: "MOVE_TO_NEAREST",
    targetType: "RAILROAD",
    collectGo: true,
    rentMultiplier: 2,
  },
  {
    id: 10,
    deck: "CHANCE",
    instruction: "Kesalahan bank menguntungkanmu. Kumpulkan $200.",
    type: "COLLECT",
    amount: 200,
  },
  {
    id: 11,
    deck: "CHANCE",
    instruction: "Terpilih sebagai Ketua Dewan. Bayar setiap pemain $50.",
    type: "PAY_EACH",
    amount: 50,
  },
  {
    id: 12,
    deck: "CHANCE",
    instruction: "Kartu Bebas dari Penjara. Simpan kartu ini sampai dibutuhkan.",
    type: "GET_OUT_OF_JAIL",
  },
  {
    id: 13,
    deck: "CHANCE",
    instruction: "Maju ke Menara Nirwana.",
    type: "MOVE_TO",
    targetPosition: 39,
    collectGo: true,
  },
  {
    id: 14,
    deck: "CHANCE",
    instruction: "Bayar pajak miskin sebesar $15.",
    type: "PAY",
    amount: 15,
  },
  {
    id: 15,
    deck: "CHANCE",
    instruction: "Naik ke Stasiun Sentral. Jika lewati MULAI, kumpulkan $200.",
    type: "MOVE_TO",
    targetPosition: 5,
    collectGo: true,
  },
  {
    id: 16,
    deck: "CHANCE",
    instruction: "Pinjaman bangunanmu jatuh tempo. Kumpulkan $150.",
    type: "COLLECT",
    amount: 150,
  },
  // === Kartu tambahan ===
  {
    id: 17,
    deck: "CHANCE",
    instruction: "Mundur ke Stasiun Sentral. Jika lewati MULAI, kumpulkan $200.",
    type: "MOVE_TO",
    targetPosition: 5,
    collectGo: true,
  },
  {
    id: 18,
    deck: "CHANCE",
    instruction: "Bayar denda lalu lintas sebesar $40.",
    type: "PAY",
    amount: 40,
  },
  {
    id: 19,
    deck: "CHANCE",
    instruction: "Menang hadiah lotere! Kumpulkan $100.",
    type: "COLLECT",
    amount: 100,
  },
  {
    id: 20,
    deck: "CHANCE",
    instruction: "Maju ke Taman Safir.",
    type: "MOVE_TO",
    targetPosition: 29,
    collectGo: true,
  },
  {
    id: 21,
    deck: "CHANCE",
    instruction: "Bersihkan salju dari jalan propertimu: $40 per rumah, $115 per hotel.",
    type: "REPAIRS",
    perHouse: 40,
    perHotel: 115,
  },
  {
    id: 22,
    deck: "CHANCE",
    instruction: "Ulang tahun! Setiap pemain memberimu $25.",
    type: "COLLECT_FROM_EACH",
    amount: 25,
  },
];

// 22 Kartu Community Chest (diperluas dari 17)
export const COMMUNITY_CHEST_CARDS: GameCard[] = [
  {
    id: 1,
    deck: "COMMUNITY_CHEST",
    instruction: "Maju ke MULAI (Kumpulkan $200).",
    type: "MOVE_TO",
    targetPosition: 0,
    collectGo: true,
  },
  {
    id: 2,
    deck: "COMMUNITY_CHEST",
    instruction: "Kesalahan bank menguntungkanmu. Kumpulkan $200.",
    type: "COLLECT",
    amount: 200,
  },
  {
    id: 3,
    deck: "COMMUNITY_CHEST",
    instruction: "Biaya dokter. Bayar $50.",
    type: "PAY",
    amount: 50,
  },
  {
    id: 4,
    deck: "COMMUNITY_CHEST",
    instruction: "Dari penjualan saham, kamu dapat $45.",
    type: "COLLECT",
    amount: 45,
  },
  {
    id: 5,
    deck: "COMMUNITY_CHEST",
    instruction: "Kartu Bebas dari Penjara. Simpan kartu ini sampai dibutuhkan.",
    type: "GET_OUT_OF_JAIL",
  },
  {
    id: 6,
    deck: "COMMUNITY_CHEST",
    instruction: "Masuk penjara. Jangan lewati MULAI, jangan kumpulkan $200.",
    type: "GO_TO_JAIL",
  },
  {
    id: 7,
    deck: "COMMUNITY_CHEST",
    instruction: "Pengembalian pajak penghasilan. Kumpulkan $20.",
    type: "COLLECT",
    amount: 20,
  },
  {
    id: 8,
    deck: "COMMUNITY_CHEST",
    instruction: "Asuransi jiwa jatuh tempo. Kumpulkan $100.",
    type: "COLLECT",
    amount: 100,
  },
  {
    id: 9,
    deck: "COMMUNITY_CHEST",
    instruction: "Bayar biaya rumah sakit sebesar $100.",
    type: "PAY",
    amount: 100,
  },
  {
    id: 10,
    deck: "COMMUNITY_CHEST",
    instruction: "Bayar pajak sekolah sebesar $150.",
    type: "PAY",
    amount: 150,
  },
  {
    id: 11,
    deck: "COMMUNITY_CHEST",
    instruction: "Terima $25 biaya konsultasi.",
    type: "COLLECT",
    amount: 25,
  },
  {
    id: 12,
    deck: "COMMUNITY_CHEST",
    instruction: "Kamu menang undian kupon belanja. Kumpulkan $10.",
    type: "COLLECT",
    amount: 10,
  },
  {
    id: 13,
    deck: "COMMUNITY_CHEST",
    instruction: "Kamu dikenai pajak perbaikan jalan: $40 per rumah, $115 per hotel.",
    type: "REPAIRS",
    perHouse: 40,
    perHotel: 115,
  },
  {
    id: 14,
    deck: "COMMUNITY_CHEST",
    instruction: "Kamu mewarisi $100.",
    type: "COLLECT",
    amount: 100,
  },
  {
    id: 15,
    deck: "COMMUNITY_CHEST",
    instruction: "Dana Hari Natal jatuh tempo. Kumpulkan $100.",
    type: "COLLECT",
    amount: 100,
  },
  {
    id: 16,
    deck: "COMMUNITY_CHEST",
    instruction: "Kumpulkan $50 dari setiap pemain.",
    type: "COLLECT_FROM_EACH",
    amount: 50,
  },
  {
    id: 17,
    deck: "COMMUNITY_CHEST",
    instruction: "Bayar $50 ke setiap pemain.",
    type: "PAY_EACH",
    amount: 50,
  },
  // === Kartu tambahan ===
  {
    id: 18,
    deck: "COMMUNITY_CHEST",
    instruction: "Pengembalian uang pajak. Kumpulkan $50.",
    type: "COLLECT",
    amount: 50,
  },
  {
    id: 19,
    deck: "COMMUNITY_CHEST",
    instruction: "Pengembalian asuransi kesehatan. Kumpulkan $75.",
    type: "COLLECT",
    amount: 75,
  },
  {
    id: 20,
    deck: "COMMUNITY_CHEST",
    instruction: "Bayar tagihan listrik sebesar $75.",
    type: "PAY",
    amount: 75,
  },
  {
    id: 21,
    deck: "COMMUNITY_CHEST",
    instruction: "Menangkan hadiah lotere kecil. Kumpulkan $25.",
    type: "COLLECT",
    amount: 25,
  },
  {
    id: 22,
    deck: "COMMUNITY_CHEST",
    instruction: "Terima bonus tahunan dari pekerjaan. Kumpulkan $200.",
    type: "COLLECT",
    amount: 200,
  },
];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Card categorization for the catalog view. Values are i18n keys (see
// dict/cards.ts → `card.cat.<KEY>`) so labels follow the active locale.
export type CardCategory =
  | "CASH_IN"
  | "CASH_OUT"
  | "MOVE"
  | "JAIL"
  | "REPAIRS"
  | "INTERACTION"
  | "OTHER";

export function getCardCategory(card: GameCard): CardCategory {
  switch (card.type) {
    case "COLLECT":
    case "COLLECT_FROM_EACH":
      return "CASH_IN";
    case "PAY":
    case "PAY_EACH":
      return "CASH_OUT";
    case "MOVE_TO":
    case "MOVE_TO_NEAREST":
    case "MOVE_SPACES":
      return "MOVE";
    case "GO_TO_JAIL":
    case "GET_OUT_OF_JAIL":
      return "JAIL";
    case "REPAIRS":
      return "REPAIRS";
    default:
      return "OTHER";
  }
}

// i18n key for a category's display label.
export const cardCategoryKey = (cat: CardCategory): string => `card.cat.${cat}`;

export const CARD_CATEGORY_ICONS: Record<CardCategory, string> = {
  CASH_IN: "💰",
  CASH_OUT: "💸",
  MOVE: "👣",
  JAIL: "🔒",
  REPAIRS: "🔧",
  INTERACTION: "🤝",
  OTHER: "📋",
};

export const CARD_CATEGORY_COLORS: Record<CardCategory, string> = {
  CASH_IN: "#16a34a",
  CASH_OUT: "#dc2626",
  MOVE: "#2563eb",
  JAIL: "#9333ea",
  REPAIRS: "#ea580c",
  INTERACTION: "#0891b2",
  OTHER: "#71717a",
};
