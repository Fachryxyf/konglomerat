import type { Dict } from "./index";

// Wave-event titles/details, monetary-policy copy, and fiscal-year decision text.
export const EVENTS_DICT: Dict = {
  // ── Event tier labels ─────────────────────────────────────────
  "event.tier.REGULAR": { id: "Event", en: "Event" },
  "event.tier.SPECIAL": { id: "Event Spesial", en: "Special Event" },
  "event.tier.RARE": { id: "Event Langka", en: "Rare Event" },
  "event.tier.MYTHOS": { id: "Event Mythos", en: "Mythos Event" },

  // ── Wave events ───────────────────────────────────────────────
  "event.allPassGo.title": { id: "Semua Lewat GO", en: "Everyone Passes GO" },
  "event.allPassGo.detail": { id: "Setiap pemain seakan melewati GO dan menerima $200.", en: "Every player passes GO and collects $200." },
  "event.bankDividend.title": { id: "Dividen Bank", en: "Bank Dividend" },
  "event.bankDividend.detail": { id: "Bank membagikan dividen $150 ke setiap pemain.", en: "The bank pays a $150 dividend to every player." },
  "event.stockSale.title": { id: "Penjualan Saham", en: "Stock Sale" },
  "event.stockSale.detail": { id: "Setiap pemain menerima $40 per properti yang dimiliki (min $60).", en: "Every player receives $40 per property owned (min $60)." },
  "event.socialFund.title": { id: "Dana Sosial Bank", en: "Bank Welfare Fund" },
  "event.socialFund.detail": { id: "Pemain berkas tipis (< $200) menerima $300, lainnya $100.", en: "Players who are short on cash (< $200) receive $300, everyone else $100." },
  "event.inheritance.title": { id: "Warisan Keluarga", en: "Family Inheritance" },
  "event.inheritance.detail": { id: "Setiap pemain menerima warisan tak terduga $200.", en: "Every player receives an unexpected $200 inheritance." },

  "event.realEstateBoom.title": { id: "Boom Real Estat", en: "Real Estate Boom" },
  "event.realEstateBoom.detail": { id: "Harga properti melonjak — setiap pemain menerima $70 per properti (min $100).", en: "Property prices surge — every player receives $70 per property (min $100)." },
  "event.taxRebate.title": { id: "Pengembalian Pajak", en: "Tax Rebate" },
  "event.taxRebate.detail": { id: "Setiap pemain menerima restitusi pajak sebesar 15% dari kasnya.", en: "Every player receives a tax rebate worth 15% of their cash." },
  "event.buildBonus.title": { id: "Bonus Pembangunan", en: "Development Bonus" },
  "event.buildBonus.detail": { id: "Pengembang dapat insentif: +$70 per rumah dan +$160 per hotel yang dimiliki.", en: "Developers are rewarded: +$70 per house and +$160 per hotel owned." },
  "event.cityLottery.title": { id: "Menang Undian Kota", en: "City Lottery Win" },
  "event.cityLottery.detail": { id: "Satu pemain beruntung memenangkan undian kota senilai $500!", en: "One lucky player wins the $500 city lottery!" },

  "event.wealthTax.title": { id: "Pajak Kekayaan", en: "Wealth Tax" },
  "event.wealthTax.detail": { id: "Pemain terkaya menyetor 25% kasnya, dibagi rata ke pemain lain.", en: "The richest player surrenders 25% of their cash, split evenly among the rest." },
  "event.monetaryCrisis.title": { id: "Krisis Moneter", en: "Monetary Crisis" },
  "event.monetaryCrisis.detail": { id: "Resesi melanda — setiap pemain kehilangan 20% kasnya ke bank.", en: "A recession hits — every player loses 20% of their cash to the bank." },
  "event.jackpot.title": { id: "Jackpot Atlantic City", en: "Atlantic City Jackpot" },
  "event.jackpot.detail": { id: "Keberuntungan berpihak pada yang tertinggal — pemain termiskin menang $700.", en: "Fortune favors the underdog — the poorest player wins $700." },

  "event.invisibleHand.title": { id: "Tangan Tak Terlihat", en: "The Invisible Hand" },
  "event.invisibleHand.detail": { id: "Pasar diatur ulang — seluruh kas dikumpulkan dan dibagi rata ke semua pemain.", en: "The market is reset — all cash is pooled and split evenly among every player." },
  "event.tycoonEmpire.title": { id: "Imperium Sang Taipan", en: "The Tycoon's Empire" },
  "event.tycoonEmpire.detail": { id: "Sang taipan terkaya mengukuhkan kekuasaan — menerima $1.200!", en: "The richest tycoon cements their power — receives $1,200!" },
  "event.goldenRain.title": { id: "Hujan Emas", en: "Golden Rain" },
  "event.goldenRain.detail": { id: "Keajaiban langka — setiap pemain menerima $600.", en: "A rare miracle — every player receives $600." },

  // ── Monetary policy (announced via the policy banner & log) ───
  "policy.BOOM.title": { id: "Ekspansi Ekonomi", en: "Economic Expansion" },
  "policy.BOOM.detail": { id: "Permintaan memanas — Bank Sentral menaikkan suku bunga; sewa naik (deregulasi).", en: "Demand heats up — the central bank raises rates; rents rise (deregulation)." },
  "policy.RECESSION.title": { id: "Resesi & Stimulus", en: "Recession & Stimulus" },
  "policy.RECESSION.detail": { id: "Ekonomi lesu — Bank Sentral memangkas bunga untuk stimulus; pemerintah berlakukan kontrol sewa.", en: "The economy slows — the central bank cuts rates to stimulate; the government imposes rent control." },
  "policy.INFLATION.title": { id: "Lonjakan Inflasi", en: "Inflation Surge" },
  "policy.INFLATION.detail": { id: "Inflasi melonjak — bunga dinaikkan agresif; pajak properti diberlakukan untuk meredam.", en: "Inflation spikes — rates are hiked aggressively; a property tax is imposed to cool it." },
  "policy.AUSTERITY.title": { id: "Pengetatan Fiskal", en: "Fiscal Austerity" },
  "policy.AUSTERITY.detail": { id: "Pemerintah memperketat anggaran — pajak properti per-ronde dinaikkan.", en: "The government tightens its budget — the per-round property tax is raised." },
  "policy.REFORM.title": { id: "Normalisasi Kebijakan", en: "Policy Normalization" },
  "policy.REFORM.detail": { id: "Kebijakan dinormalisasi — bunga & regulasi kembali mendekati netral.", en: "Policy is normalized — rates & regulations drift back toward neutral." },
  "policy.bits.rate": { id: "bunga acuan {v}%", en: "base rate {v}%" },
  "policy.bits.rent": { id: "sewa {sign}{v}%", en: "rent {sign}{v}%" },
  "policy.bits.tax": { id: "pajak properti {v}%/ronde", en: "property tax {v}%/round" },

  // ── Fiscal Year decisions ─────────────────────────────────────
  "fiscal.tax.title": { id: "Tahun Fiskal: Reformasi Pajak", en: "Fiscal Year: Tax Reform" },
  "fiscal.tax.intro": { id: "Pemerintah memungut pajak kekayaan progresif — makin kaya, makin besar tarifnya. Pilih sikapmu:", en: "The government levies a progressive wealth tax — the richer you are, the higher the rate. Choose your stance:" },
  "fiscal.tax.pay.label": { id: "Patuh — Bayar Pajak", en: "Comply — Pay the Tax" },
  "fiscal.tax.pay.desc": { id: "Bayar pajak progresif (5–12% dari kekayaan bersih) dengan tertib. Aman.", en: "Pay the progressive tax (5–12% of net worth) dutifully. Safe." },
  "fiscal.tax.evade.label": { id: "Mangkir — Hindari Pajak", en: "Evade — Dodge the Tax" },
  "fiscal.tax.evade.desc": { id: "55% lolos tanpa bayar; 45% ketahuan dan kena denda 1,6× lipat. Judi.", en: "55% slip away free; 45% get caught and fined 1.6×. A gamble." },
  "fiscal.inflation.title": { id: "Tahun Fiskal: Inflasi Melonjak", en: "Fiscal Year: Inflation Surge" },
  "fiscal.inflation.intro": { id: "Inflasi menggerus nilai uang tunai, sementara aset menguat. Pilih strategimu:", en: "Inflation erodes cash while assets hold value. Choose your strategy:" },
  "fiscal.inflation.hold.label": { id: "Simpan Tunai", en: "Hold Cash" },
  "fiscal.inflation.hold.desc": { id: "Kas terpotong 8% oleh inflasi. Konservatif.", en: "Cash is cut 8% by inflation. Conservative." },
  "fiscal.inflation.invest.label": { id: "Borong Aset (Spekulasi)", en: "Buy Assets (Speculate)" },
  "fiscal.inflation.invest.desc": { id: "Kas terpotong 15%, tapi dapat +$60 per properti yang dimiliki. Untung kalau aset banyak.", en: "Cash is cut 15%, but you gain +$60 per property owned. Pays off with many assets." },
};
