import type { Dict } from "./index";

// Game-log message templates. Placeholders ({name}, {space}, …) are filled from
// the params passed to addLog; {space}/{title}/etc. that reference other keys are
// resolved recursively so names follow the active locale.
export const LOG_DICT: Dict = {
  // ── Dice / turns ──────────────────────────────────────────────
  "log.roll.summary": { id: "{name} melempar {d1} + {d2} = {total}", en: "{name} rolled {d1} + {d2} = {total}" },
  "log.roll.dice": { id: "{name} melempar dadu: {d1} + {d2} = {total}{doubles}", en: "{name} rolls the dice: {d1} + {d2} = {total}{doubles}" },
  "log.roll.doublesSuffix": { id: " (KEMBAR!)", en: " (DOUBLES!)" },
  "log.game.start": { id: "Permainan dimulai dengan {count} pemain (modal awal ${cash}).", en: "Game started with {count} players (${cash} starting cash)." },
  "log.game.win": { id: "{name} MEMENANGKAN PERMAINAN!", en: "{name} WINS THE GAME!" },
  "log.turn.startRoll": { id: "Giliran {name}. Lempar dadu untuk mulai.", en: "{name}'s turn. Roll the dice to begin." },
  "log.turn.again": { id: "{name} dapat giliran lagi karena kembar.", en: "{name} gets another turn for rolling doubles." },
  "log.turn.start": { id: "Giliran {name}.", en: "{name}'s turn." },

  // ── Movement / landing ────────────────────────────────────────
  "log.move.passGo": { id: "{name} melewati GO, kumpulkan $200.", en: "{name} passes GO and collects $200." },
  "log.move.landed": { id: "{name} mendarat di {space}.", en: "{name} lands on {space}." },
  "log.move.toSpace": { id: "{name} bergerak ke {space}.", en: "{name} moves to {space}." },
  "log.move.spaces": { id: "{name} bergerak {steps} kotak.", en: "{name} moves {steps} spaces." },
  "log.land.go": { id: "{name} berada di GO.", en: "{name} is on GO." },
  "log.land.visitingJail": { id: "{name} hanya mampir di penjara.", en: "{name} is just visiting jail." },
  "log.land.freeParking": { id: "{name} berada di Parkir Bebas. Tidak terjadi apa-apa.", en: "{name} is on Free Parking. Nothing happens." },
  "log.land.goToJail": { id: "{name} masuk penjara!", en: "{name} goes to jail!" },
  "log.land.ownProperty": { id: "{name} mendarat di properti sendiri.", en: "{name} lands on their own property." },
  "log.land.mortgaged": { id: "{name} mendarat di {space} yang digadaikan. Tidak bayar sewa.", en: "{name} lands on the mortgaged {space}. No rent due." },

  // ── Taxes / rent ──────────────────────────────────────────────
  "log.tax.luxury": { id: "{name} bayar Pajak Kemewahan $100.", en: "{name} pays $100 Luxury Tax." },
  "log.tax.incomePercent": { id: "{name} bayar Pajak Penghasilan 10% dari total aset ${net} = ${tax}.", en: "{name} pays Income Tax: 10% of ${net} net worth = ${tax}." },
  "log.tax.incomeFlat": { id: "{name} bayar Pajak Penghasilan flat $200.", en: "{name} pays the flat $200 Income Tax." },
  "log.rent.pay": { id: "{name} bayar sewa ${rent} ke {owner} untuk {space}.", en: "{name} pays ${rent} rent to {owner} for {space}." },
  "log.rent.payMult": { id: "{name} bayar sewa ${rent} ke {owner} untuk {space} (multiplier {mult}x).", en: "{name} pays ${rent} rent to {owner} for {space} ({mult}× multiplier)." },

  // ── Cards ─────────────────────────────────────────────────────
  "log.card.draw": { id: "{name} mengambil kartu {deck}: \"{instruction}\"", en: "{name} draws a {deck} card: \"{instruction}\"" },
  "log.card.goojKeep": { id: "{name} menyimpan kartu Bebas dari Penjara.", en: "{name} keeps a Get Out of Jail Free card." },

  // ── Bank / card cash ──────────────────────────────────────────
  "log.bank.receive": { id: "{name} menerima ${amount} dari bank.", en: "{name} receives ${amount} from the bank." },
  "log.bank.pay": { id: "{name} bayar ${amount} ke bank.", en: "{name} pays ${amount} to the bank." },
  "log.collectEach": { id: "{name} mengumpulkan ${amount} dari setiap pemain (total ${total}).", en: "{name} collects ${amount} from each player (${total} total)." },
  "log.payEach": { id: "{name} bayar ${amount} ke setiap pemain (total ${total}).", en: "{name} pays ${amount} to each player (${total} total)." },
  "log.repairs": { id: "{name} bayar biaya perbaikan: {houses} rumah × ${perHouse} + {hotels} hotel × ${perHotel} = ${cost}.", en: "{name} pays for repairs: {houses} houses × ${perHouse} + {hotels} hotels × ${perHotel} = ${cost}." },

  // ── Jail ──────────────────────────────────────────────────────
  "log.jail.outDoubles": { id: "{name} keluar dari penjara dengan dadu kembar!", en: "{name} rolls doubles and gets out of jail!" },
  "log.jail.forcedBail": { id: "{name} gagal lempar kembar 3x. Wajib bayar jaminan ${bail} untuk keluar.", en: "{name} failed to roll doubles 3 times. Must pay ${bail} bail to get out." },
  "log.jail.stay": { id: "{name} tidak dapat kembar (percobaan {attempt}/3). Tetap di penjara.", en: "{name} didn't roll doubles (attempt {attempt}/3). Stays in jail." },
  "log.jail.tripleDoubles": { id: "{name} lempar kembar 3x berturut-turut! LANGSUNG KE PENJARA!", en: "{name} rolled doubles three times in a row! STRAIGHT TO JAIL!" },
  "log.jail.fromCard": { id: "{name} masuk penjara (kartu).", en: "{name} goes to jail (card)." },
  "log.jail.noBail": { id: "{name} tidak punya ${bail} untuk jaminan. Harus coba lempar kembar.", en: "{name} can't afford the ${bail} bail. Must try for doubles." },
  "log.jail.payBail": { id: "{name} bayar jaminan ${bail} untuk keluar penjara.", en: "{name} pays ${bail} bail to leave jail." },
  "log.jail.useCard": { id: "{name} menggunakan kartu Bebas dari Penjara.", en: "{name} uses a Get Out of Jail Free card." },
  "log.jail.sentenced": { id: "{name} dijebloskan ke penjara — {reason}.", en: "{name} is thrown in jail — {reason}." },
  "log.jail.reason.bribeScandal": { id: "terseret kasus suap pejabat", en: "caught up in a bribery scandal" },
  "log.jail.reason.evasion": { id: "terbukti menggelapkan pembukuan", en: "convicted of cooking the books" },

  // ── Buy / auction ─────────────────────────────────────────────
  "log.buy.insufficient": { id: "{name} tidak punya cukup uang untuk membeli {space}.", en: "{name} can't afford to buy {space}." },
  "log.buy.bought": { id: "{name} membeli {space} seharga ${price}.", en: "{name} buys {space} for ${price}." },
  "log.auction.start": { id: "Lelang dimulai untuk {space}.", en: "Auction started for {space}." },
  "log.auction.cantBuildings": { id: "Tidak bisa melelang {space} — masih ada bangunan di color set.", en: "Can't auction {space} — the color set still has buildings." },
  "log.auction.noOthers": { id: "Tidak ada pemain lain untuk ikut lelang.", en: "No other players to join the auction." },
  "log.auction.ownerSells": { id: "{name} melelang propertinya: {space}.", en: "{name} puts {space} up for auction." },
  "log.auction.bid": { id: "{name} menawar ${amount}.", en: "{name} bids ${amount}." },
  "log.auction.leave": { id: "{name} keluar dari lelang.", en: "{name} drops out of the auction." },
  "log.auction.endSeller": { id: "Lelang {space} berakhir tanpa penawar — properti tetap milik {name}.", en: "Auction for {space} ended with no bids — it stays with {name}." },
  "log.auction.endBank": { id: "Lelang {space} berakhir tanpa pemenang. Properti kembali ke bank.", en: "Auction for {space} ended with no winner. It returns to the bank." },
  "log.auction.win": { id: "{name} memenangkan lelang {space} dengan ${bid}.", en: "{name} wins the auction for {space} at ${bid}." },

  // ── Build / sell buildings ────────────────────────────────────
  "log.build.inJail": { id: "{name} sedang dipenjara — tak bisa membangun.", en: "{name} is in jail — can't build." },
  "log.build.evenRule": { id: "Tidak bisa bangun: aturan merata color set.", en: "Can't build: the even-build rule applies to the color set." },
  "log.build.insufficientHouses": { id: "Saldo tidak cukup untuk bangun {count} rumah.", en: "Not enough cash to build {count} houses." },
  "log.build.insufficientHousesCost": { id: "Saldo tidak cukup untuk bangun {count} rumah (butuh ${cost}).", en: "Not enough cash to build {count} houses (need ${cost})." },
  "log.build.bankNoHouses": { id: "Bank kehabisan rumah (butuh {need}, tersisa {left}).", en: "The bank is out of houses (need {need}, {left} left)." },
  "log.build.houses": { id: "{name} membangun {count} rumah di {space} (${cost}).", en: "{name} builds {count} houses on {space} (${cost})." },
  "log.build.hotelNeed4": { id: "Hotel hanya bisa dibangun di properti dengan 4 rumah.", en: "A hotel can only be built on a property with 4 houses." },
  "log.build.bankNoHotels": { id: "Bank kehabisan hotel.", en: "The bank is out of hotels." },
  "log.build.insufficientHotel": { id: "Saldo tidak cukup untuk bangun hotel (${cost}).", en: "Not enough cash to build a hotel (${cost})." },
  "log.build.hotel": { id: "{name} membangun hotel di {space} (${cost}).", en: "{name} builds a hotel on {space} (${cost})." },
  "log.sell.evenRule": { id: "Tidak bisa jual: aturan merata color set.", en: "Can't sell: the even-build rule applies to the color set." },
  "log.sell.houses": { id: "{name} menjual {count} rumah di {space} (refund ${refund}).", en: "{name} sells {count} houses on {space} (${refund} refund)." },
  "log.sell.hotelBankNoHouses": { id: "Bank tidak punya cukup rumah untuk dijual kembali hotel.", en: "The bank lacks enough houses to break down the hotel." },
  "log.sell.hotel": { id: "{name} menjual hotel di {space} (refund ${refund}).", en: "{name} sells the hotel on {space} (${refund} refund)." },

  // ── Mortgage / sell to bank ───────────────────────────────────
  "log.mortgage.cantBuildings": { id: "Tidak bisa menggadaikan {space} — masih ada bangunan.", en: "Can't mortgage {space} — it still has buildings." },
  "log.mortgage.cantSetBuildings": { id: "Tidak bisa menggadaikan — ada bangunan di color set.", en: "Can't mortgage — the color set still has buildings." },
  "log.mortgage.done": { id: "{name} menggadaikan {space} (terima ${value}).", en: "{name} mortgages {space} (receives ${value})." },
  "log.mortgage.redeem": { id: "{name} melunasi gadai {space} (bayar ${cost}).", en: "{name} unmortgages {space} (pays ${cost})." },
  "log.sellbank.cantBuildings": { id: "Tidak bisa menjual {space} — masih ada bangunan.", en: "Can't sell {space} — it still has buildings." },
  "log.sellbank.cantSetBuildings": { id: "Tidak bisa menjual {space} — ada bangunan di color set.", en: "Can't sell {space} — the color set still has buildings." },
  "log.sellbank.done": { id: "{name} menjual {space} ke bank (terima ${value}).", en: "{name} sells {space} to the bank (receives ${value})." },

  // ── Loans ─────────────────────────────────────────────────────
  "log.loan.rejected": { id: "Pinjaman ditolak — plafon kredit {name} hanya ${limit}.", en: "Loan denied — {name}'s credit limit is only ${limit}." },
  "log.loan.taken": { id: "🏦 {name} meminjam ${principal} dari bank (tenor {term} ronde, bunga {rate}%/ronde).", en: "🏦 {name} borrows ${principal} from the bank ({term}-round term, {rate}%/round interest)." },
  "log.loan.cantRepay": { id: "{name} tak punya ${payoff} untuk melunasi pinjaman.", en: "{name} can't afford the ${payoff} to repay the loan." },
  "log.loan.repaidEarly": { id: "🏦 {name} melunasi pinjaman lebih awal (${payoff}).", en: "🏦 {name} repays a loan early (${payoff})." },
  "log.loan.installment": { id: "🏦 {name} bayar cicilan pinjaman ${total} (pokok ${principal} + bunga ${interest}).", en: "🏦 {name} pays a loan installment of ${total} (${principal} principal + ${interest} interest)." },
  "log.loan.installmentLast": { id: "🏦 {name} melunasi cicilan terakhir ${total} (pokok ${principal} + bunga ${interest}).", en: "🏦 {name} pays the final installment of ${total} (${principal} principal + ${interest} interest)." },

  // ── Government / crime ────────────────────────────────────────
  "log.gov.propertyTax": { id: "🏛️ {name} bayar pajak properti ${tax} ({rate}%/ronde).", en: "🏛️ {name} pays ${tax} property tax ({rate}%/round)." },
  "log.crime.bribeNoCash": { id: "{name} tak punya ${cost} untuk menyuap sipir.", en: "{name} can't afford the ${cost} to bribe the guard." },
  "log.crime.bribeCaught": { id: "🚨 {name} ketahuan menyuap sipir! Suap hangus + denda ${fine}, tetap dipenjara.", en: "🚨 {name} caught bribing the guard! Bribe lost + ${fine} fine, stays jailed." },
  "log.crime.bribeOk": { id: "🤫 {name} menyuap sipir ${cost} dan keluar penjara tanpa prosedur.", en: "🤫 {name} bribes the guard ${cost} and slips out of jail." },
  "log.crime.lobbyActive": { id: "{name} sudah punya perk lobi yang aktif.", en: "{name} already has an active lobbying perk." },
  "log.crime.lobbyNoCash": { id: "{name} tak punya ${cost} untuk melobi.", en: "{name} can't afford the ${cost} to lobby." },
  "log.crime.lobbyCaught": { id: "🚨 Skandal! {name} ketahuan melobi pemerintah — denda ${fine}, lobi gagal.", en: "🚨 Scandal! {name} caught lobbying the government — ${fine} fine, lobbying failed." },
  "log.crime.lobbyOk": { id: "🤝 {name} berhasil melobi: bebas pajak properti & sewa +10% sampai siklus ekonomi berikutnya.", en: "🤝 {name} lobbies successfully: property-tax exempt & +10% rent until the next economic cycle." },
  "log.crime.evadeArm": { id: "{name} mengatur pembukuan — sewa berikutnya yang ia bayar akan digelapkan (risiko audit).", en: "{name} cooks the books — the next rent they pay will be under-reported (audit risk)." },
  "log.crime.evadeCancel": { id: "{name} membatalkan rencana penggelapan pembukuan.", en: "{name} calls off the book-cooking plan." },
  "log.crime.rigNoCash": { id: "{name} tak punya ${cost} untuk memanipulasi lelang.", en: "{name} can't afford the ${cost} to rig the auction." },
  "log.crime.rigCaught": { id: "🚨 {name} ketahuan memanipulasi lelang {space}! Lelang dibatalkan + denda ${fine}.", en: "🚨 {name} caught rigging the auction for {space}! Auction cancelled + ${fine} fine." },
  "log.crime.rigOk": { id: "🤫 {name} menyuap panitia lelang (${cost}) dan memenangkan {space}.", en: "🤫 {name} bribes the auctioneer (${cost}) and wins {space}." },
  "log.crime.auditCaught": { id: "🚨 {name} kena audit — bayar sewa penuh + denda penggelapan ${penalty}.", en: "🚨 {name} gets audited — pays full rent + ${penalty} evasion penalty." },
  "log.crime.evadeOk": { id: "🤫 {name} menggelapkan pembukuan — sewa dibayar hanya ${reduced} (dari ${rent}).", en: "🤫 {name} cooks the books — pays only ${reduced} rent (of ${rent})." },

  // ── Trade ─────────────────────────────────────────────────────
  "log.trade.inJail": { id: "{name} sedang dipenjara — tak bisa mengajukan trade.", en: "{name} is in jail — can't propose a trade." },
  "log.trade.propose": { id: "{from} mengajukan tawaran trade ke {to}.", en: "{from} proposes a trade to {to}." },
  "log.trade.failCash": { id: "Trade gagal: aset {name} tidak cukup untuk menutup cash.", en: "Trade failed: {name}'s assets can't cover the cash." },
  "log.trade.success": { id: "Trade berhasil antara {from} dan {to}.", en: "Trade completed between {from} and {to}." },
  "log.trade.reject": { id: "{to} menolak tawaran trade dari {from}.", en: "{to} rejects the trade offer from {from}." },

  // ── Investor pact ─────────────────────────────────────────────
  "log.pact.investorFree": { id: "{payer} (investor) bebas sewa di properti {owner}.", en: "{payer} (investor) pays no rent on {owner}'s property." },
  "log.pact.vassalBase": { id: "{payer} hanya bayar sewa dasar tanah ke investornya {owner}.", en: "{payer} pays only the base land rent to their investor {owner}." },
  "log.pact.share": { id: "Bagi hasil pakta: ${share} dari sewa {owner} → investor.", en: "Pact share: ${share} of {owner}'s rent → investor." },
  "log.pact.done": { id: "Pakta investasi {owner} selesai — modal investor sudah kembali.", en: "{owner}'s investor pact is complete — the capital has been recouped." },

  // ── Events / fiscal / policy log lines ────────────────────────
  "log.event.fired": { id: "{tier} (Ronde {round}) — {title}: {detail}", en: "{tier} (Round {round}) — {title}: {detail}" },
  "log.fiscal.start": { id: "📅 {title} (Ronde {round}) dimulai.", en: "📅 {title} (Round {round}) begins." },
  "log.fiscal.subsidy": { id: "Subsidi pemulihan: {name} menerima $200.", en: "Recovery subsidy: {name} receives $200." },
  "log.fiscal.evadeWin": { id: "{name} lolos dari pajak (tidak bayar).", en: "{name} dodges the tax (pays nothing)." },
  "log.fiscal.evadeCaught": { id: "{name} ketahuan mangkir pajak — denda ${penalty}.", en: "{name} caught dodging taxes — ${penalty} fine." },
  "log.fiscal.pay": { id: "{name} membayar pajak kekayaan ${tax}.", en: "{name} pays ${tax} wealth tax." },
  "log.fiscal.invest": { id: "{name} borong aset: +${gain} dari {count} properti.", en: "{name} buys up assets: +${gain} from {count} properties." },
  "log.fiscal.hold": { id: "{name} simpan tunai — terpotong inflasi 8%.", en: "{name} holds cash — eroded 8% by inflation." },
  "log.policy.applied": { id: "🏦 Kebijakan Ekonomi — {title}: {detail} ({bits}).", en: "🏦 Economic Policy — {title}: {detail} ({bits})." },

  // ── Liquidation / rescue / bankruptcy ─────────────────────────
  "log.liquidate": { id: "{name} menjual/menggadaikan aset untuk membayar (saldo kini ${balance}).", en: "{name} sells/mortgages assets to pay up (balance now ${balance})." },
  "log.rescue.invest": { id: "{inv} menanam modal ${debt} untuk menyelamatkan {tgt} (pakta bagi hasil sampai ${target}).", en: "{inv} invests ${debt} to rescue {tgt} (revenue-share pact up to ${target})." },
  "log.bankrupt": { id: "{name} DINYATAKAN BANGKRUT!", en: "{name} IS DECLARED BANKRUPT!" },
  "log.assets.toCreditor": { id: "Semua aset {name} diserahkan ke {creditor}.", en: "All of {name}'s assets are handed over to {creditor}." },
  "log.assets.toBank": { id: "Aset {name} dikembalikan ke bank.", en: "{name}'s assets are returned to the bank." },
};
