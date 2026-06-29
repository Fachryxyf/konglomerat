import type { Dict } from "./index";

// Chance / Community Chest card instructions, keyed by deck + card id
// (`card.<deck>.<id>`). Place names match the localized board (see board.ts).
export const CARDS_DICT: Dict = {
  // ── Chance ────────────────────────────────────────────────────
  "card.CHANCE.1": { id: "Maju ke MULAI (Kumpulkan $200).", en: "Advance to GO (collect $200)." },
  "card.CHANCE.2": { id: "Bank membayar dividen sebesar $50.", en: "Bank pays you a dividend of $50." },
  "card.CHANCE.3": { id: "Mundur 3 kotak.", en: "Go back 3 spaces." },
  "card.CHANCE.4": { id: "Langsung masuk penjara. Jangan lewati MULAI, jangan kumpulkan $200.", en: "Go directly to jail. Do not pass GO, do not collect $200." },
  "card.CHANCE.5": { id: "Lakukan perbaikan umum di seluruh propertimu: $25 per rumah, $100 per hotel.", en: "Make general repairs on all your property: $25 per house, $100 per hotel." },
  "card.CHANCE.6": { id: "Maju ke Jalan Mahkota. Jika lewati MULAI, kumpulkan $200.", en: "Advance to Crown Street. If you pass GO, collect $200." },
  "card.CHANCE.7": { id: "Maju ke Alun-Alun Timur. Jika lewati MULAI, kumpulkan $200.", en: "Advance to East Square. If you pass GO, collect $200." },
  "card.CHANCE.8": { id: "Maju ke utilitas terdekat. Jika tidak dimiliki, kamu bisa beli. Jika dimiliki, lempar dadu dan bayar pemilik 10x angka dadu.", en: "Advance to the nearest utility. If unowned, you may buy it. If owned, roll the dice and pay the owner 10× the roll." },
  "card.CHANCE.9": { id: "Maju ke stasiun kereta terdekat. Jika tidak dimiliki, kamu bisa beli. Jika dimiliki, bayar pemilik 2x sewa normal.", en: "Advance to the nearest station. If unowned, you may buy it. If owned, pay the owner twice the normal rent." },
  "card.CHANCE.10": { id: "Kesalahan bank menguntungkanmu. Kumpulkan $200.", en: "Bank error in your favor. Collect $200." },
  "card.CHANCE.11": { id: "Terpilih sebagai Ketua Dewan. Bayar setiap pemain $50.", en: "Elected chairman of the board. Pay each player $50." },
  "card.CHANCE.12": { id: "Kartu Bebas dari Penjara. Simpan kartu ini sampai dibutuhkan.", en: "Get Out of Jail Free. Keep this card until you need it." },
  "card.CHANCE.13": { id: "Maju ke Menara Nirwana.", en: "Advance to Nirvana Tower." },
  "card.CHANCE.14": { id: "Bayar pajak miskin sebesar $15.", en: "Pay a poor tax of $15." },
  "card.CHANCE.15": { id: "Naik ke Stasiun Sentral. Jika lewati MULAI, kumpulkan $200.", en: "Take a ride to Central Station. If you pass GO, collect $200." },
  "card.CHANCE.16": { id: "Pinjaman bangunanmu jatuh tempo. Kumpulkan $150.", en: "Your building loan matures. Collect $150." },
  "card.CHANCE.17": { id: "Mundur ke Stasiun Sentral. Jika lewati MULAI, kumpulkan $200.", en: "Go back to Central Station. If you pass GO, collect $200." },
  "card.CHANCE.18": { id: "Bayar denda lalu lintas sebesar $40.", en: "Pay a traffic fine of $40." },
  "card.CHANCE.19": { id: "Menang hadiah lotere! Kumpulkan $100.", en: "You won the lottery! Collect $100." },
  "card.CHANCE.20": { id: "Maju ke Taman Safir.", en: "Advance to Sapphire Park." },
  "card.CHANCE.21": { id: "Bersihkan salju dari jalan propertimu: $40 per rumah, $115 per hotel.", en: "Clear snow from your streets: $40 per house, $115 per hotel." },
  "card.CHANCE.22": { id: "Ulang tahun! Setiap pemain memberimu $25.", en: "It's your birthday! Each player gives you $25." },

  // ── Community Chest ──────────────────────────────────────────
  "card.COMMUNITY_CHEST.1": { id: "Maju ke MULAI (Kumpulkan $200).", en: "Advance to GO (collect $200)." },
  "card.COMMUNITY_CHEST.2": { id: "Kesalahan bank menguntungkanmu. Kumpulkan $200.", en: "Bank error in your favor. Collect $200." },
  "card.COMMUNITY_CHEST.3": { id: "Biaya dokter. Bayar $50.", en: "Doctor's fee. Pay $50." },
  "card.COMMUNITY_CHEST.4": { id: "Dari penjualan saham, kamu dapat $45.", en: "From a stock sale you earn $45." },
  "card.COMMUNITY_CHEST.5": { id: "Kartu Bebas dari Penjara. Simpan kartu ini sampai dibutuhkan.", en: "Get Out of Jail Free. Keep this card until you need it." },
  "card.COMMUNITY_CHEST.6": { id: "Masuk penjara. Jangan lewati MULAI, jangan kumpulkan $200.", en: "Go to jail. Do not pass GO, do not collect $200." },
  "card.COMMUNITY_CHEST.7": { id: "Pengembalian pajak penghasilan. Kumpulkan $20.", en: "Income tax refund. Collect $20." },
  "card.COMMUNITY_CHEST.8": { id: "Asuransi jiwa jatuh tempo. Kumpulkan $100.", en: "Life insurance matures. Collect $100." },
  "card.COMMUNITY_CHEST.9": { id: "Bayar biaya rumah sakit sebesar $100.", en: "Pay hospital fees of $100." },
  "card.COMMUNITY_CHEST.10": { id: "Bayar pajak sekolah sebesar $150.", en: "Pay school fees of $150." },
  "card.COMMUNITY_CHEST.11": { id: "Terima $25 biaya konsultasi.", en: "Receive a $25 consultancy fee." },
  "card.COMMUNITY_CHEST.12": { id: "Kamu menang undian kupon belanja. Kumpulkan $10.", en: "You win a shopping voucher. Collect $10." },
  "card.COMMUNITY_CHEST.13": { id: "Kamu dikenai pajak perbaikan jalan: $40 per rumah, $115 per hotel.", en: "Street repairs assessed: $40 per house, $115 per hotel." },
  "card.COMMUNITY_CHEST.14": { id: "Kamu mewarisi $100.", en: "You inherit $100." },
  "card.COMMUNITY_CHEST.15": { id: "Dana Hari Natal jatuh tempo. Kumpulkan $100.", en: "Your holiday fund matures. Collect $100." },
  "card.COMMUNITY_CHEST.16": { id: "Kumpulkan $50 dari setiap pemain.", en: "Collect $50 from every player." },
  "card.COMMUNITY_CHEST.17": { id: "Bayar $50 ke setiap pemain.", en: "Pay $50 to every player." },
  "card.COMMUNITY_CHEST.18": { id: "Pengembalian uang pajak. Kumpulkan $50.", en: "Tax refund. Collect $50." },
  "card.COMMUNITY_CHEST.19": { id: "Pengembalian asuransi kesehatan. Kumpulkan $75.", en: "Health insurance refund. Collect $75." },
  "card.COMMUNITY_CHEST.20": { id: "Bayar tagihan listrik sebesar $75.", en: "Pay your electricity bill of $75." },
  "card.COMMUNITY_CHEST.21": { id: "Menangkan hadiah lotere kecil. Kumpulkan $25.", en: "Win a small lottery prize. Collect $25." },
  "card.COMMUNITY_CHEST.22": { id: "Terima bonus tahunan dari pekerjaan. Kumpulkan $200.", en: "Receive your annual work bonus. Collect $200." },

  // ── Card categories ──────────────────────────────────────────
  "card.cat.CASH_IN": { id: "Uang Masuk", en: "Cash In" },
  "card.cat.CASH_OUT": { id: "Uang Keluar", en: "Cash Out" },
  "card.cat.MOVE": { id: "Pergerakan", en: "Movement" },
  "card.cat.JAIL": { id: "Penjara", en: "Jail" },
  "card.cat.REPAIRS": { id: "Perbaikan", en: "Repairs" },
  "card.cat.INTERACTION": { id: "Interaksi Pemain", en: "Player Interaction" },
  "card.cat.OTHER": { id: "Lainnya", en: "Other" },

  // ── Deck names ───────────────────────────────────────────────
  "card.deck.CHANCE": { id: "Kesempatan", en: "Chance" },
  "card.deck.COMMUNITY_CHEST": { id: "Dana Umum", en: "Community Chest" },
};
