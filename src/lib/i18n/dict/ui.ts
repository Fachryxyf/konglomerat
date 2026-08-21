import type { Dict } from "./index";

// Static UI copy (buttons, labels, modal text). Keys are namespaced by area:
// `ui.<area>.<name>`. Populated incrementally as components are localized.
export const UI: Dict = {
  "ui.loading": { id: "Memuat permainan…", en: "Loading game…" },
  "ui.lang.label": { id: "Bahasa", en: "Language" },

  // ── Public docs page (site root) ───────────────────────────────
  "ui.docs.tagline": {
    id: "Bangun imperium properti & ekonomi di Kota Raya.",
    en: "Build a property & economy empire in Kota Raya.",
  },
  "ui.docs.intro": {
    id: "Permainan papan strategi ekonomi untuk 2–8 pemain (campuran manusia & AI), dengan bank sentral, pinjaman berbunga, tahun fiskal, sampai jalur belakang pemerintahan.",
    en: "An economic strategy board game for 2–8 players (mix of humans & AI), with a central bank, interest-bearing loans, fiscal years, and government back channels.",
  },
  "ui.docs.play": { id: "Mainkan sekarang", en: "Play now" },
  "ui.docs.source": { id: "Kode sumber", en: "Source code" },
  "ui.docs.rulebook": { id: "Buku Panduan", en: "Rulebook" },
  "ui.docs.contents": { id: "Isi", en: "Contents" },
  "ui.docs.status": { id: "Beta — desktop, hotseat & AI", en: "Beta — desktop, hotseat & AI" },
  "ui.docs.desktopNote": {
    id: "Papan butuh layar lebar. Buka dari desktop untuk pengalaman terbaik.",
    en: "The board needs a wide screen. Open on desktop for the best experience.",
  },

  // ── Board cell short labels & badges ──────────────────────────
  "ui.cell.go": { id: "MULAI", en: "GO" },
  "ui.cell.jail": { id: "PENJARA", en: "JAIL" },
  "ui.cell.parking": { id: "PARKIR", en: "PARKING" },
  "ui.cell.gotojail": { id: "KE PENJARA", en: "TO JAIL" },
  "ui.badge.mortgaged": { id: "GADAI", en: "MORTGAGED" },
  "ui.badge.owned": { id: "Dimiliki: {name}", en: "Owned by {name}" },
  "ui.badge.hotel": { id: "Hotel", en: "Hotel" },
  "ui.badge.house": { id: "Rumah", en: "House" },

  // ── Game log ──────────────────────────────────────────────────
  "ui.log.title": { id: "Log Aktivitas", en: "Event Log" },
  "ui.log.entries": { id: "{n} entri", en: "{n} entries" },
  "ui.log.empty": { id: "Belum ada aktivitas.", en: "No activity yet." },

  // ── Fiscal modal ──────────────────────────────────────────────
  "ui.fiscal.decisionForPre": { id: "Keputusan untuk", en: "Decision for" },
  "ui.fiscal.decisionForPost": { id: "— kekayaan bersih ${net}.", en: "— net worth ${net}." },
  "ui.fiscal.othersFollow": { id: "{n} pemain lain menyusul.", en: "{n} more players to decide." },

  // ── Policy banner ─────────────────────────────────────────────
  "ui.policy.bannerTitle": { id: "Kebijakan: {title}", en: "Policy: {title}" },

  // ── Game header / shell ───────────────────────────────────────
  "ui.header.turn": { id: "Giliran #{turn} • {name}", en: "Turn #{turn} • {name}" },
  "ui.header.properties": { id: "Properti", en: "Properties" },
  "ui.header.cards": { id: "Kartu", en: "Cards" },
  "ui.header.bank": { id: "Bank", en: "Bank" },
  "ui.header.government": { id: "Pemerintah", en: "Government" },
  "ui.header.guide": { id: "Panduan", en: "Guide" },
  "ui.header.reset": { id: "Reset", en: "Reset" },
  "ui.reset.title": { id: "Reset permainan?", en: "Reset the game?" },
  "ui.reset.desc": {
    id: "Semua progres (pemain, properti, uang, dan log) akan dihapus dan kamu kembali ke layar setup. Tindakan ini tidak bisa dibatalkan.",
    en: "All progress (players, properties, cash, and the log) will be erased and you'll return to the setup screen. This can't be undone.",
  },
  "ui.reset.confirm": { id: "Ya, reset", en: "Yes, reset" },
  "ui.catalog.title": { id: "Katalog Properti", en: "Property Catalog" },
  "ui.catalog.available": { id: "Tersedia", en: "Available" },
  "ui.catalog.all": { id: "Semua", en: "All" },
  "ui.players": { id: "Pemain", en: "Players" },
  "ui.viewProps": { id: "Lihat properti {name}", en: "View {name}'s properties" },
  "ui.tips.label": { id: "Tips:", en: "Tip:" },
  "ui.tips.body": {
    id: "Klik properti pemain untuk mengelola (bangun/gadai/trade). Klik Katalog di atas untuk lihat semua properti.",
    en: "Click a player's property to manage it (build/mortgage/trade). Use the Catalog above to see every property.",
  },

  // ── Common ────────────────────────────────────────────────────
  "ui.common.close": { id: "Tutup", en: "Close" },
  "ui.common.cancel": { id: "Batal", en: "Cancel" },
  "ui.common.confirm": { id: "Konfirmasi", en: "Confirm" },

  // ── Space detail descriptions (non-purchasable spaces) ────────
  "ui.space.go.desc": {
    id: "Kumpulkan $200 setiap kali melewati atau mendarat di sini.",
    en: "Collect $200 every time you pass or land here.",
  },
  "ui.space.jail.desc": {
    id: "Jika hanya lewat, kamu cuma 'mampir' (aman). Jika dipenjara: bayar $50, pakai kartu, atau lempar kembar untuk keluar (maks 3 percobaan).",
    en: "Just passing through? You're only visiting (safe). If jailed: pay $50, use a card, or roll doubles to get out (max 3 tries).",
  },
  "ui.space.parking.desc": {
    id: "Kotak istirahat — tidak ada aksi maupun biaya.",
    en: "A resting tile — no action, no fee.",
  },
  "ui.space.gotojail.desc": {
    id: "Langsung ke penjara tanpa melewati MULAI dan tanpa menerima $200.",
    en: "Straight to jail — do not pass GO, do not collect $200.",
  },
  "ui.space.chance.desc": {
    id: "Ambil satu kartu Kesempatan dan jalankan instruksinya.",
    en: "Draw a Chance card and follow its instruction.",
  },
  "ui.space.chest.desc": {
    id: "Ambil satu kartu Dana Umum dan jalankan instruksinya.",
    en: "Draw a Community Chest card and follow its instruction.",
  },
  "ui.space.incomeTax.desc": {
    id: "Bayar $200 atau 10% dari total kekayaan bersih — pilih yang lebih kecil.",
    en: "Pay $200 or 10% of your net worth — whichever is lower.",
  },
  "ui.space.luxuryTax.desc": {
    id: "Bayar pajak mewah $100 ke bank.",
    en: "Pay a $100 luxury tax to the bank.",
  },

  // ── Government modal & crimes ─────────────────────────────────
  "ui.gov.title": { id: "Pemerintahan & \"Jalur Belakang\"", en: "Government & \"Back Channels\"" },
  "ui.gov.suspicion": { id: "Tingkat Kecurigaan", en: "Suspicion Level" },
  "ui.gov.heatVal": { id: "{label} ({n}/{max})", en: "{label} ({n}/{max})" },
  "ui.gov.suspicionNote": {
    id: "Makin tinggi kecurigaan, makin besar peluang aksimu ketahuan. Kecurigaan turun perlahan tiap ronde kalau kamu tidak berulah.",
    en: "The higher your suspicion, the more likely your schemes get caught. Suspicion cools slowly each round when you lie low.",
  },
  "ui.gov.jailedNote": {
    id: "Kamu sedang dipenjara. Aktivitas (bangun, trade, lobi) dibekukan. Jaminan resmi saat ini: ${bail}.",
    en: "You're in jail. Activities (build, trade, lobby) are frozen. Current official bail: ${bail}.",
  },
  "ui.gov.metaCostRiskFine": { id: "Biaya ${cost} • risiko {pct}% • denda ${fine}", en: "Cost ${cost} • {pct}% risk • ${fine} fine" },
  "ui.gov.metaEvade": { id: "Bayar hanya {pct}% sewa berikutnya • risiko audit {risk}%", en: "Pay only {pct}% of your next rent • {risk}% audit risk" },
  "ui.gov.metaRigInactive": { id: "Hanya saat ada lelang berjalan • risiko {pct}%", en: "Only during a running auction • {pct}% risk" },
  "ui.gov.cta.bribe": { id: "Suap ${cost}", en: "Bribe ${cost}" },
  "ui.gov.cta.lobby": { id: "Lobi ${cost}", en: "Lobby ${cost}" },
  "ui.gov.cta.perkActive": { id: "Perk aktif", en: "Perk active" },
  "ui.gov.cta.evadeOn": { id: "Aktifkan", en: "Arm" },
  "ui.gov.cta.evadeOff": { id: "Batalkan", en: "Cancel" },
  "ui.gov.cta.rig": { id: "Manipulasi", en: "Rig it" },
  "ui.gov.hint.jailOnly": { id: "Hanya saat dipenjara.", en: "Only while jailed." },
  "ui.gov.hint.noAuction": { id: "Tidak ada lelang berjalan.", en: "No auction running." },
  "ui.gov.hint.notInAuction": { id: "Kamu tidak ikut lelang ini.", en: "You're not in this auction." },
  "gov.heat.clean": { id: "Bersih", en: "Clean" },
  "gov.heat.watched": { id: "Diawasi", en: "Watched" },
  "gov.heat.wanted": { id: "Buron Ringan", en: "Wanted" },
  "gov.heat.mostWanted": { id: "Sangat Dicari", en: "Most Wanted" },
  "gov.crime.BRIBE_GUARD.label": { id: "Suap Sipir Penjara", en: "Bribe the Jail Guard" },
  "gov.crime.BRIBE_GUARD.desc": { id: "Bayar suap untuk keluar penjara instan. Ketahuan: suap hangus, denda, tetap dipenjara.", en: "Pay a bribe to leave jail instantly. If caught: bribe lost, fined, still jailed." },
  "gov.crime.LOBBY.label": { id: "Lobi Regulasi", en: "Lobby Regulators" },
  "gov.crime.LOBBY.desc": { id: "Suap pemerintah agar bebas pajak properti & sewa propertimu +10% sampai siklus berikutnya. Ketahuan: skandal & denda.", en: "Bribe the government to skip property tax and boost your rents +10% until the next cycle. If caught: scandal & fine." },
  "gov.crime.EVADE.label": { id: "Gelapkan Pembukuan", en: "Cook the Books" },
  "gov.crime.EVADE.desc": { id: "Atur sewa berikutnya yang kamu bayar jadi 40% saja. Kena audit: bayar penuh + denda 1,5× selisih (penjara bila heat tinggi).", en: "Set the next rent you pay to just 40%. If audited: pay in full + a 1.5× penalty on the gap (jail if heat is high)." },
  "gov.crime.RIG_AUCTION.label": { id: "Manipulasi Lelang", en: "Rig the Auction" },
  "gov.crime.RIG_AUCTION.desc": { id: "Suap agar langsung menangkan lelang berjalan di tawaran sekarang. Ketahuan: lelang batal, denda, heat melonjak.", en: "Bribe your way to instantly win the running auction at the current bid. If caught: auction cancelled, fine, heat spikes." },

  // ── Bank modal ────────────────────────────────────────────────
  "ui.bank.title": { id: "Bank Sentral & Pinjaman", en: "Central Bank & Loans" },
  "ui.bank.policyTitle": { id: "Kebijakan Berlaku", en: "Active Policy" },
  "ui.bank.baseRate": { id: "Suku bunga acuan (Bank Sentral)", en: "Base rate (central bank)" },
  "ui.bank.loanRate": { id: "Bunga pinjaman (acuan + margin)", en: "Loan rate (base + margin)" },
  "ui.bank.perRound": { id: "{v}% / ronde", en: "{v}% / round" },
  "ui.bank.rentReg": { id: "Regulasi sewa", en: "Rent regulation" },
  "ui.bank.neutral": { id: "Netral", en: "Neutral" },
  "ui.bank.rentVal": { id: "{sign}{v}% ({mode})", en: "{sign}{v}% ({mode})" },
  "ui.bank.rentControl": { id: "kontrol sewa", en: "rent control" },
  "ui.bank.deregulation": { id: "deregulasi", en: "deregulation" },
  "ui.bank.propTax": { id: "Pajak properti (pemerintah)", en: "Property tax (government)" },
  "ui.bank.none": { id: "Tidak ada", en: "None" },
  "ui.bank.cash": { id: "Saldo kas", en: "Cash balance" },
  "ui.bank.net": { id: "Kekayaan bersih", en: "Net worth" },
  "ui.bank.debt": { id: "Total utang", en: "Total debt" },
  "ui.bank.creditLeft": { id: "Sisa plafon kredit", en: "Credit remaining" },
  "ui.bank.activeLoans": { id: "Pinjaman Aktif", en: "Active Loans" },
  "ui.bank.noLoans": { id: "Belum ada pinjaman.", en: "No loans yet." },
  "ui.bank.principalLeft": { id: "Sisa pokok ${v}", en: "Principal left ${v}" },
  "ui.bank.loanInfo": { id: "{rounds} ronde tersisa • cicilan ~${inst}/ronde", en: "{rounds} rounds left • ~${inst}/round" },
  "ui.bank.repay": { id: "Lunasi ${v}", en: "Repay ${v}" },
  "ui.bank.applyLoan": { id: "Ajukan Pinjaman", en: "Apply for a Loan" },
  "ui.bank.cantBorrow": { id: "Plafon kredit tidak cukup untuk meminjam (butuh aset lebih banyak).", en: "Your credit limit is too low to borrow (you need more assets)." },
  "ui.bank.term": { id: "Tenor:", en: "Term:" },
  "ui.bank.termVal": { id: "{t} ronde", en: "{t} rounds" },
  "ui.bank.estLabel": { id: "Estimasi cicilan ronde pertama:", en: "Estimated first installment:" },
  "ui.bank.estDetail": { id: "(pokok ${p} + bunga ${i}). Bunga mengikuti suku bunga acuan yang berlaku.", en: "(principal ${p} + interest ${i}). Interest tracks the prevailing base rate." },
  "ui.bank.borrow": { id: "Pinjam ${v}", en: "Borrow ${v}" },
  "ui.bank.turnOnly": { id: "Hanya bisa pinjam saat giliranmu", en: "You can only borrow on your turn" },

  // ── Property manager modal ────────────────────────────────────
  "ui.pm.balanceProps": { id: "Saldo: ${bal} • Properti: {n}", en: "Balance: ${bal} • Properties: {n}" },
  "ui.pm.inJail": { id: "Di Penjara", en: "In Jail" },
  "ui.pm.goojChip": { id: "Kartu Bebas Penjara ×{n}", en: "Get Out of Jail Free ×{n}" },
  "ui.pm.tab.properties": { id: "Properti", en: "Properties" },
  "ui.pm.tab.build": { id: "Bangun", en: "Build" },
  "ui.pm.tab.trade": { id: "Trade", en: "Trade" },
  "ui.pm.noProps": { id: "Belum memiliki properti.", en: "No properties yet." },
  "ui.pm.dotHotel": { id: " • Hotel", en: " • Hotel" },
  "ui.pm.dotHouses": { id: " • {n} rumah", en: " • {n} houses" },
  "ui.pm.dotStations": { id: " • {n} stasiun dimiliki", en: " • {n} stations owned" },
  "ui.pm.unmortgage": { id: "Lunasi", en: "Unmortgage" },
  "ui.pm.mortgage": { id: "Gadai", en: "Mortgage" },
  "ui.pm.auction": { id: "Lelang", en: "Auction" },
  "ui.pm.sellBank": { id: "Jual Bank", en: "Sell to Bank" },
  "ui.pm.auctionTitle": { id: "Lelang properti ini ke pemain lain (hasil masuk ke kamu)", en: "Auction this property to other players (proceeds go to you)" },
  "ui.pm.sellBankTitle": { id: "Jual ke bank (terima ${v})", en: "Sell to the bank (receive ${v})" },
  "ui.pm.buildTurnOnly": { id: "Hanya bisa membangun saat giliranmu sendiri.", en: "You can only build on your own turn." },
  "ui.pm.aiAuto": { id: "Player AI — membangun otomatis.", en: "AI player — builds automatically." },
  "ui.pm.bankLabel": { id: "Bank:", en: "Bank:" },
  "ui.pm.bankHouses": { id: "{n} rumah", en: "{n} houses" },
  "ui.pm.bankHotels": { id: "{n} hotel tersedia", en: "{n} hotels available" },
  "ui.pm.noMonopoly": { id: "Belum memiliki monopoli color set apapun.", en: "No full color-set monopoly yet." },
  "ui.pm.perHouseNow": { id: "${price}/rumah • Saat ini: {state}", en: "${price}/house • Now: {state}" },
  "ui.pm.stateHotel": { id: "Hotel", en: "Hotel" },
  "ui.pm.stateHouses": { id: "{n} rumah", en: "{n} houses" },
  "ui.pm.buildTitle": { id: "Bangun {count} rumah (${cost})", en: "Build {count} houses (${cost})" },
  "ui.pm.buildBtn": { id: "+{count} (${cost})", en: "+{count} (${cost})" },
  "ui.pm.hotelTitle": { id: "Bangun Hotel (${cost})", en: "Build Hotel (${cost})" },
  "ui.pm.hotelBtn": { id: "Hotel (${cost})", en: "Hotel (${cost})" },
  "ui.pm.sellHotelBtn": { id: "- Hotel (+${refund})", en: "- Hotel (+${refund})" },
  "ui.pm.sellHouseTitle": { id: "Jual {count} rumah (+${refund})", en: "Sell {count} houses (+${refund})" },
  "ui.pm.sellHouseBtn": { id: "-{count} (+${refund})", en: "-{count} (+${refund})" },

  // ── Trade tab ─────────────────────────────────────────────────
  "ui.tt.notYourTurn": { id: "Trade hanya bisa dilakukan saat giliranmu sendiri.", en: "Trading is only possible on your own turn." },
  "ui.tt.helpNote": {
    id: "Mau beli properti lawan? Pilih propertinya di kolom kanan (kamu terima), lalu isi bayaranmu di \"Cash yang KAMU bayar\" kolom kiri.",
    en: "Want to buy an opponent's property? Select it in the right column (you receive), then enter your payment in \"Cash YOU pay\" on the left.",
  },
  "ui.tt.tradeWith": { id: "Trade dengan:", en: "Trade with:" },
  "ui.tt.givesPay": { id: "{name} serahkan (kamu BAYAR) ↑", en: "{name} gives (you PAY) ↑" },
  "ui.tt.givesReceive": { id: "{name} serahkan (kamu TERIMA) ↓", en: "{name} gives (you RECEIVE) ↓" },
  "ui.tt.cashYouPay": { id: "Cash yang KAMU bayar (maks ${max}):", en: "Cash YOU pay (max ${max}):" },
  "ui.tt.cashYouAsk": { id: "Cash yang kamu MINTA dari {name} (maks ${max}):", en: "Cash you ASK from {name} (max ${max}):" },
  "ui.tt.propsYouGive": { id: "Properti kamu yang dilepas ({n} dipilih):", en: "Your properties to give ({n} selected):" },
  "ui.tt.propsYouAsk": { id: "Properti {name} yang kamu minta ({n} dipilih):", en: "{name}'s properties you want ({n} selected):" },
  "ui.tt.noProps": { id: "Tidak ada properti", en: "No properties" },
  "ui.tt.goojOwned": { id: "Kartu Bebas Penjara ({n} dimiliki):", en: "Get Out of Jail Free ({n} held):" },
  "ui.tt.noGooj": { id: "Tidak punya kartu", en: "No cards" },
  "ui.tt.offerN": { id: "Tawarkan {n} kartu", en: "Offer {n} cards" },
  "ui.tt.askN": { id: "Minta {n} kartu", en: "Ask for {n} cards" },
  "ui.tt.summary": { id: "Ringkasan Trade:", en: "Trade Summary:" },
  "ui.tt.sumCash": { id: "{from} → ${v} → {to}", en: "{from} → ${v} → {to}" },
  "ui.tt.sumProps": { id: "{from} → {n} properti → {to}", en: "{from} → {n} properties → {to}" },
  "ui.tt.sumGooj": { id: "{from} → {n} kartu Bebas Penjara → {to}", en: "{from} → {n} Get Out of Jail Free → {to}" },
  "ui.tt.submit": { id: "Ajukan Trade", en: "Propose Trade" },

  // ── Guide modal ───────────────────────────────────────────────
  "ui.guide.title": { id: "Buku Panduan", en: "Guide Book" },
  "ui.guide.close": { id: "Tutup panduan", en: "Close guide" },

  // ── Mobile warning ────────────────────────────────────────────
  "ui.mobile.title": { id: "Tidak bisa dimainkan di mobile", en: "Can't be played on mobile" },
  "ui.mobile.body": {
    id: "Papan permainan butuh layar lebar. Buka lagi di laptop atau desktop (atau perlebar jendela browser) untuk mulai bermain.",
    en: "The board needs a wide screen. Open this on a laptop or desktop (or widen your browser window) to start playing.",
  },

  // ── Game over modal ───────────────────────────────────────────
  "ui.gameover.title": { id: "Game Selesai!", en: "Game Over!" },
  "ui.gameover.desc": { id: "memenangkan permainan!", en: "wins the game!" },
  "ui.gameover.standings": { id: "Klasemen Akhir:", en: "Final Standings:" },
  "ui.gameover.bankrupt": { id: "Bangkrut", en: "Bankrupt" },
  "ui.gameover.active": { id: "Aktif", en: "Active" },
  "ui.gameover.playAgain": { id: "Main Lagi", en: "Play Again" },

  // ── Rescue modal ──────────────────────────────────────────────
  "ui.rescue.title": { id: "Selamatkan dari Kebangkrutan?", en: "Rescue from Bankruptcy?" },
  "ui.rescue.desc": { id: "akan bangkrut (defisit ${debt}). {investor}, mau menanam modal?", en: "is about to go bankrupt (${debt} deficit). {investor}, want to invest?" },
  "ui.rescue.termsTitle": { id: "Syarat Pakta Investasi:", en: "Investor Pact Terms:" },
  "ui.rescue.term.pay": { id: "Kamu bayar ${debt}, {name} kembali bermain.", en: "You pay ${debt} and {name} stays in the game." },
  "ui.rescue.term.share": { id: "Kamu terima 50% sewa yang {name} kumpulkan, sampai total ${target} (1,5× modal).", en: "You collect 50% of the rent {name} earns, up to ${target} (1.5× your capital)." },
  "ui.rescue.term.vassal": { id: "{name} injak propertimu → cuma bayar sewa dasar.", en: "{name} landing on your property → pays only base rent." },
  "ui.rescue.term.free": { id: "Kamu injak properti {name} → gratis.", en: "You landing on {name}'s property → free." },
  "ui.rescue.term.risk": { id: "Risiko: kalau dia bangkrut lagi, modalmu hangus.", en: "Risk: if they go bankrupt again, your capital is lost." },
  "ui.rescue.invest": { id: "Tanam Modal ${debt}", en: "Invest ${debt}" },
  "ui.rescue.reject": { id: "Tolak", en: "Decline" },
  "ui.rescue.next": { id: "Kalau kamu tolak, ditawarkan ke investor berikutnya.", en: "If you decline, it's offered to the next investor." },

  // ── Trade proposal modal ──────────────────────────────────────
  "ui.trade.title": { id: "Proposal Trade", en: "Trade Proposal" },
  "ui.trade.desc": { id: "{from} mengajukan trade kepada {to}", en: "{from} proposes a trade to {to}" },
  "ui.trade.gives": { id: "{token} {name} berikan:", en: "{token} {name} gives:" },
  "ui.trade.gooj": { id: "{n}× Kartu Bebas Penjara", en: "{n}× Get Out of Jail Free" },
  "ui.trade.nothing": { id: "Tidak ada", en: "Nothing" },
  "ui.trade.goojNote": {
    id: "Kartu Bebas Penjara bisa diperdagangkan antar pemain. Jika kamu punya kartu ini saat di penjara, kamu bisa keluar tanpa bayar $50.",
    en: "Get Out of Jail Free cards can be traded between players. If you hold one while jailed, you can leave without paying $50.",
  },
  "ui.trade.goojNoteLabel": { id: "Kartu Bebas Penjara", en: "Get Out of Jail Free" },
  "ui.trade.accept": { id: "Terima", en: "Accept" },
  "ui.trade.reject": { id: "Tolak", en: "Reject" },

  // ── Game control (turn panel) ─────────────────────────────────
  "ui.control.turn": { id: "Giliran", en: "Turn" },
  "ui.control.inJail": { id: "Di Penjara ({n}/3)", en: "In Jail ({n}/3)" },
  "ui.control.doubles": { id: "Kembar: {n}/3", en: "Doubles: {n}/3" },
  "ui.control.roll": { id: "LEMPAR DADU", en: "ROLL DICE" },
  "ui.control.spaceHint": { id: "(Spasi)", en: "(Space)" },
  "ui.control.jailChoice": { id: "Pilihan Penjara:", en: "Jail options:" },
  "ui.control.payBail": { id: "Bayar $50", en: "Pay $50" },
  "ui.control.useGooj": { id: "Pakai Kartu GOOJ ({n})", en: "Use GOOJ Card ({n})" },
  "ui.control.rollShort": { id: "Lempar Dadu", en: "Roll Dice" },
  "ui.control.endTurn": { id: "AKHIRI GILIRAN", en: "END TURN" },
  "ui.control.aiThinking": { id: "AI sedang berpikir...", en: "AI is thinking…" },
  "ui.control.aiEnding": { id: "AI mengakhiri giliran...", en: "AI is ending its turn…" },
  "ui.phase.rolling": { id: "Melempar dadu...", en: "Rolling the dice…" },
  "ui.phase.moving": { id: "Bergerak...", en: "Moving…" },
  "ui.phase.action": { id: "Memproses aksi...", en: "Processing action…" },
  "ui.phase.cardDraw": { id: "Mengambil kartu...", en: "Drawing a card…" },
  "ui.phase.auction": { id: "Lelang berlangsung...", en: "Auction in progress…" },

  // ── Player panel ──────────────────────────────────────────────
  "ui.player.bankrupt": { id: "BANGKRUT", en: "BANKRUPT" },
  "ui.player.aiTitle": { id: "AI {diff}", en: "AI {diff}" },
  "ui.player.goojTitle": { id: "Kartu Bebas Penjara (bisa dijual)", en: "Get Out of Jail Free card (tradeable)" },
  "ui.player.colorTitle": { id: "{color} ({status})", en: "{color} ({status})" },
  "ui.player.monopoly": { id: "Monopoli", en: "Monopoly" },
  "ui.player.incomplete": { id: "Tidak Lengkap", en: "Incomplete" },
  "ui.player.noProps": { id: "Belum ada properti", en: "No properties yet" },

  // ── Auction modal ─────────────────────────────────────────────
  "ui.auction.title": { id: "Lelang: {space}", en: "Auction: {space}" },
  "ui.auction.subtitle": { id: "Harga asli ${price} • {n} peserta aktif", en: "List price ${price} • {n} active bidders" },
  "ui.auction.price": { id: "Harga: ${price}", en: "Price: ${price}" },
  "ui.auction.highestBid": { id: "Tawaran Tertinggi", en: "Highest Bid" },
  "ui.auction.by": { id: "oleh", en: "by" },
  "ui.auction.yourTurn": { id: "Giliran {name} menawar", en: "{name}'s turn to bid" },
  "ui.auction.min": { id: "Min ${v}", en: "Min ${v}" },
  "ui.auction.bid": { id: "Tawar", en: "Bid" },
  "ui.auction.leave": { id: "Keluar dari lelang", en: "Leave the auction" },
  "ui.auction.bidding": { id: "{name} sedang menawar...", en: "{name} is bidding…" },
  "ui.auction.waiting": { id: "Menunggu...", en: "Waiting…" },
  "ui.auction.finish": { id: "Selesaikan Lelang", en: "Finish Auction" },

  // ── Rent payment modal ────────────────────────────────────────
  "ui.rentpay.title": { id: "Pembayaran Sewa", en: "Rent Payment" },
  "ui.rentpay.desc": { id: "{payer} membayar sewa {amount} ke {payee}", en: "{payer} pays {amount} rent to {payee}" },
  "ui.rentpay.autoClose": { id: "Modal akan otomatis tutup dalam {s}s", en: "This dialog will close automatically in {s}s" },
  "ui.rentpay.balance": { id: "Saldo: ${v}", en: "Balance: ${v}" },
  "ui.rentpay.rentLabel": { id: "sewa", en: "rent" },
  "ui.rentpay.property": { id: "Properti:", en: "Property:" },
  "ui.rentpay.rentDetail": { id: "Detail sewa:", en: "Rent breakdown:" },
  "ui.rentpay.detail.util": { id: "{mult}x × dadu ({dice}) = ${amount}", en: "{mult}× × dice ({dice}) = ${amount}" },
  "ui.rentpay.detail.railroad": { id: "{count} stasiun dimiliki × ${each} = ${amount}", en: "{count} stations owned × ${each} = ${amount}" },
  "ui.rentpay.detail.hotel": { id: "Sewa Hotel = ${amount}", en: "Hotel rent = ${amount}" },
  "ui.rentpay.detail.houses": { id: "Sewa {houses} rumah = ${amount}", en: "Rent with {houses} houses = ${amount}" },
  "ui.rentpay.detail.base": { id: "Sewa dasar (mungkin 2x monopoli) = ${amount}", en: "Base rent (possibly 2× monopoly) = ${amount}" },
  "ui.rentpay.onProp.hotel": { id: "Hotel di properti ini", en: "Hotel on this property" },
  "ui.rentpay.onProp.houses": { id: "{houses} rumah di properti ini", en: "{houses} houses on this property" },

  // ── Tax modal ─────────────────────────────────────────────────
  "ui.tax.title": { id: "Pajak Penghasilan", en: "Income Tax" },
  "ui.tax.choose": { id: "{name} harus memilih opsi pembayaran:", en: "{name} must choose a payment option:" },
  "ui.tax.netWorth": { id: "Net worth saat ini:", en: "Current net worth:" },
  "ui.tax.tenPercent": { id: "10% dari aset", en: "10% of net worth" },
  "ui.tax.flat": { id: "Bayar flat", en: "Pay flat" },

  // ── Buy modal ─────────────────────────────────────────────────
  "ui.buy.title": { id: "Beli Properti?", en: "Buy Property?" },
  "ui.buy.landedOn": { id: "{name} mendarat di", en: "{name} landed on" },
  "ui.buy.utilOne": { id: "Jika pemilik memiliki 1 utilitas, sewa = 4x angka dadu.", en: "If the owner holds 1 utility, rent = 4× the dice roll." },
  "ui.buy.utilTwo": { id: "Jika pemilik memiliki 2 utilitas, sewa = 10x angka dadu.", en: "If the owner holds 2 utilities, rent = 10× the dice roll." },
  "ui.buy.housePrice": { id: "Harga Rumah:", en: "House price:" },
  "ui.buy.mortgagePrice": { id: "Harga Gadai:", en: "Mortgage price:" },
  "ui.buy.balanceOf": { id: "Saldo {name}:", en: "{name}'s balance:" },
  "ui.buy.buy": { id: "Beli (${price})", en: "Buy (${price})" },
  "ui.buy.auction": { id: "Lelang", en: "Auction" },
  "ui.buy.insufficient": { id: "Saldo tidak cukup. Properti akan dilelang.", en: "Not enough cash. The property goes to auction." },

  // ── Property catalog ──────────────────────────────────────────
  "ui.propcat.desc": {
    id: "Lihat semua 28 properti ({avail} tersedia • {owned} dimiliki • {mort} digadaikan)",
    en: "All 28 properties ({avail} available • {owned} owned • {mort} mortgaged)",
  },
  "ui.propcat.available": { id: "Tersedia ({n})", en: "Available ({n})" },
  "ui.propcat.owned": { id: "Dimiliki ({n})", en: "Owned ({n})" },
  "ui.propcat.owner": { id: "Pemilik:", en: "Owner:" },
  "ui.propcat.groupByColor": { id: "Kelompokkan warna", en: "Group by color" },
  "ui.propcat.flatList": { id: "Daftar rata", en: "Flat list" },
  "ui.propcat.noMatch": { id: "Tidak ada properti yang cocok dengan filter ini.", en: "No properties match this filter." },
  "ui.propcat.railroadGroup": { id: "Stasiun Kereta", en: "Railroads" },
  "ui.propcat.utilityGroup": { id: "Perusahaan Utilitas", en: "Utilities" },
  "ui.propcat.monopoly": { id: "MONOPOLI", en: "MONOPOLY" },
  "ui.propcat.nProps": { id: "{n} properti", en: "{n} properties" },
  "ui.propcat.legend.monopoly": { id: "Monopoli (2x sewa dasar)", en: "Monopoly (2× base rent)" },
  "ui.propcat.legend.mortgaged": { id: "Digadaikan", en: "Mortgaged" },

  // ── Card catalog ──────────────────────────────────────────────
  "ui.cardcat.title": { id: "Katalog Kartu Acara", en: "Event Card Catalog" },
  "ui.cardcat.desc": {
    id: "Lihat semua {total} kartu Kesempatan & Dana Umum • {chance} Kesempatan + {cc} Dana Umum",
    en: "Browse all {total} Chance & Community Chest cards • {chance} Chance + {cc} Community Chest",
  },
  "ui.cardcat.all": { id: "Semua ({n})", en: "All ({n})" },
  "ui.cardcat.deckCount": { id: "{deck} ({n})", en: "{deck} ({n})" },
  "ui.cardcat.allCategories": { id: "Semua Kategori", en: "All Categories" },
  "ui.cardcat.noMatch": {
    id: "Tidak ada kartu yang cocok dengan filter ini.",
    en: "No cards match this filter.",
  },
  "ui.cardcat.chanceNote": {
    id: "Kesempatan: kotak oranye di papan",
    en: "Chance: the orange spaces on the board",
  },
  "ui.cardcat.chestNote": {
    id: "Dana Umum: kotak kuning di papan",
    en: "Community Chest: the yellow spaces on the board",
  },
  "ui.cardcat.goojTitle": {
    id: "Kartu Bebas Penjara (Get Out of Jail Free):",
    en: "Get Out of Jail Free card:",
  },
  "ui.cardcat.goojNote": {
    id: "Kartu ini bisa disimpan dan dipakai untuk keluar penjara tanpa bayar $50, dan bisa diperdagangkan ke pemain lain lewat menu Trade (klik properti pemain → tab Trade).",
    en: "Keep this card to leave jail without paying $50. It can also be traded to other players via the Trade menu (click a player's property → Trade tab).",
  },

  // ── Card draw modal ───────────────────────────────────────────
  "ui.carddraw.title": { id: "Kartu {deck}", en: "{deck} Card" },
  "ui.carddraw.drawing": { id: "{name} mengambil kartu", en: "{name} draws a card" },
  "ui.carddraw.aiProcessing": {
    id: "AI memproses kartu... auto-lanjut dalam {s}s",
    en: "AI processing card… auto-continue in {s}s",
  },
  "ui.carddraw.skipPre": { id: "Tekan", en: "Press" },
  "ui.carddraw.skipPost": { id: "untuk lewati", en: "to skip" },
  "ui.key.space": { id: "Spasi", en: "Space" },
  "ui.carddraw.execute": { id: "Eksekusi & Lanjut", en: "Execute & Continue" },

  // ── Property card / deed ──────────────────────────────────────
  "ui.deed.property": { id: "Sertifikat", en: "Title Deed" },
  "ui.deed.railroad": { id: "Stasiun", en: "Railroad" },
  "ui.deed.utility": { id: "Utilitas", en: "Utility" },
  "ui.card.available.short": { id: "Tersedia", en: "Available" },
  "ui.card.available.long": { id: "Tersedia (bisa dibeli/lelang)", en: "Available (buy or auction)" },
  "ui.card.housePrice": { id: "Harga Rumah / Hotel:", en: "House / Hotel price:" },
  "ui.card.housePriceEach": { id: "${v} masing-masing", en: "${v} each" },
  "ui.card.sellBuilding": { id: "Jual bangunan:", en: "Sell buildings:" },
  "ui.card.perUnitHalf": { id: "${v} / unit (½ harga)", en: "${v} / unit (½ price)" },
  "ui.card.mortgageValue": { id: "Nilai Gadai:", en: "Mortgage value:" },
  "ui.card.redeem": { id: "Tebus Gadai (+10%):", en: "Unmortgage (+10%):" },
  "ui.card.buyPrice": { id: "Harga Beli:", en: "Purchase price:" },
  "ui.card.nHouses": { id: "{n} rumah", en: "{n} houses" },
  "ui.rent.base": { id: "Sewa Dasar", en: "Base rent" },
  "ui.rent.monopolySuffix": { id: " (2x monopoli)", en: " (2× monopoly)" },
  "ui.rent.withHouses": { id: "dengan {n} Rumah:", en: "with {n} houses:" },
  "ui.rent.withHotel": { id: "dengan HOTEL:", en: "with HOTEL:" },
  "ui.rent.railroad": { id: "Sewa ({n} stasiun):", en: "Rent ({n} stations):" },
  "ui.rent.util.one": { id: "Jika pemilik punya 1 utilitas:", en: "If the owner holds 1 utility:" },
  "ui.rent.util.two": { id: "Jika pemilik punya 2 utilitas:", en: "If the owner holds 2 utilities:" },
  "ui.rent.util.value": { id: "Sewa = {m}x angka dadu", en: "Rent = {m}× the dice roll" },

  // ── Setup screen ──────────────────────────────────────────────
  "ui.setup.subtitle": {
    id: "Bangun imperium properti & ekonomi di Kota Raya",
    en: "Build a property & economic empire in Grand City",
  },
  "ui.setup.playerCount": { id: "Jumlah Pemain", en: "Players" },
  "ui.setup.startingCash": { id: "Modal Awal", en: "Starting Cash" },
  "ui.setup.nPlayers": { id: "{n} Pemain", en: "{n} Players" },
  "ui.setup.playersLabel": { id: "Pemain", en: "Players" },
  "ui.setup.defaultName": { id: "Pemain {n}", en: "Player {n}" },
  "ui.setup.namePlaceholder": { id: "Nama Pemain {n}", en: "Player {n} name" },
  "ui.setup.human": { id: "Manusia", en: "Human" },
  "ui.setup.ai": { id: "AI", en: "AI" },
  "ui.setup.rulesTitle": { id: "Aturan Standar", en: "House Rules" },
  "ui.setup.rule.cash": {
    id: "Modal awal ${cash} per pemain",
    en: "${cash} starting cash per player",
  },
  "ui.setup.rule.go": {
    id: "Koleksi $200 saat melewati MULAI",
    en: "Collect $200 each time you pass GO",
  },
  "ui.setup.rule.jail": {
    id: "3x dadu kembar berturut-turut = masuk penjara",
    en: "Three doubles in a row sends you to jail",
  },
  "ui.setup.rule.build": {
    id: "Bangun rumah/hotel hanya pada monopoli color set",
    en: "Build houses/hotels only on a full color-set monopoly",
  },
  "ui.setup.rule.auction": {
    id: "Properti tak dibeli dilelang ke pemain lain",
    en: "Properties left unbought go to auction",
  },
  "ui.setup.rule.supply": {
    id: "32 rumah & 12 hotel tersedia (limited supply)",
    en: "32 houses & 12 hotels available (limited supply)",
  },
  "ui.setup.aiLevelTitle": { id: "Level AI", en: "AI Difficulty" },
  "ui.setup.tip": {
    id: "Tip: tekan Spasi untuk lempar dadu saat bermain. Selengkapnya ada di tombol Panduan.",
    en: "Tip: press Space to roll the dice while playing. More in the Guide.",
  },
  "ui.setup.start": { id: "MULAI BERMAIN", en: "START GAME" },

  // ── AI difficulty ─────────────────────────────────────────────
  "ui.ai.easy.label": { id: "Mudah", en: "Easy" },
  "ui.ai.easy.desc": {
    id: "Beli 60% properti, jarang bangun rumah, sering tolak properti mahal",
    en: "Buys ~60% of properties, rarely builds, often skips pricey lots",
  },
  "ui.ai.medium.label": { id: "Menengah", en: "Medium" },
  "ui.ai.medium.desc": {
    id: "Beli cerdas, jaga cadangan uang, bangun rumah saat monopoli",
    en: "Buys smart, keeps a cash reserve, builds on monopolies",
  },
  "ui.ai.hard.label": { id: "Sulit", en: "Hard" },
  "ui.ai.hard.desc": {
    id: "Agresif beli & bangun, pintar gadai, trade aktif untuk monopoli",
    en: "Aggressive buyer & builder, mortgages shrewdly, trades for monopolies",
  },
};
