"use client";

import { useState, type ReactNode } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Dices, Home, Building2, Coins, HandCoins, Lock, Landmark,
  Scale, ShieldAlert, TrendingUp, Skull, Sparkles, MousePointerClick, X,
} from "lucide-react";
import { useT, useLocale } from "@/lib/i18n";

interface Props {
  onClose: () => void;
}

// ---------- small content helpers ----------
function H({ children }: { children: ReactNode }) {
  return <h4 className="font-bold text-sm text-emerald-700 dark:text-emerald-300 mt-3 mb-1">{children}</h4>;
}
function P({ children }: { children: ReactNode }) {
  return <p className="text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300 mb-2">{children}</p>;
}
function UL({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1 text-[13px] text-zinc-700 dark:text-zinc-300 mb-2">{children}</ul>;
}
function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="text-[12px] rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 px-3 py-2 text-blue-800 dark:text-blue-200 my-2">
      💡 {children}
    </div>
  );
}
function Warn({ children }: { children: ReactNode }) {
  return (
    <div className="text-[12px] rounded-md bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 px-3 py-2 text-rose-800 dark:text-rose-200 my-2">
      ⚠️ {children}
    </div>
  );
}
function KV({ rows }: { rows: [string, string][] }) {
  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 my-2 text-[12px]">
      {rows.map(([k, v], i) => (
        <div key={i} className="flex justify-between gap-3 px-2.5 py-1.5">
          <span className="text-zinc-500">{k}</span>
          <span className="font-medium text-zinc-800 dark:text-zinc-200 text-right">{v}</span>
        </div>
      ))}
    </div>
  );
}

// ---------- chapters ----------
type Chapter = { id: string; title: string; icon: ReactNode; body: ReactNode };
const CHAPTERS_ID: Chapter[] = [
  {
    id: "dasar", title: "Dasar Permainan", icon: <Dices className="w-4 h-4" />,
    body: (
      <>
        <P>Tujuanmu sederhana: jadi pemain terakhir yang belum bangkrut. Kekayaan dibangun dari membeli properti, menariknya jadi monopoli, lalu menagih sewa setinggi mungkin.</P>
        <H>Alur giliran</H>
        <UL>
          <li>Lempar dua dadu, bidakmu maju sejumlah angkanya.</li>
          <li>Jalankan aksi petak tempat kamu mendarat (beli, bayar sewa, kartu, pajak, dll).</li>
          <li>Boleh kelola aset (bangun, gadai, trade, bank, pemerintah) lalu akhiri giliran.</li>
        </UL>
        <H>Dadu kembar</H>
        <UL>
          <li>Dapat angka kembar → kamu jalan lagi setelah menyelesaikan petak.</li>
          <li>Kembar <strong>3× berturut-turut</strong> → langsung masuk penjara.</li>
        </UL>
        <H>Melewati MULAI</H>
        <P>Setiap kali melewati atau mendarat di <strong>MULAI</strong> kamu menerima <strong>$200</strong>.</P>
        <Tip>Tekan <strong>Spasi</strong> untuk melempar dadu, atau untuk menutup modal/notifikasi yang sedang terbuka.</Tip>
      </>
    ),
  },
  {
    id: "properti", title: "Properti & Lelang", icon: <Home className="w-4 h-4" />,
    body: (
      <>
        <H>Membeli</H>
        <P>Mendarat di petak kosong yang bisa dibeli → kamu boleh membelinya seharga tertera, atau menolak.</P>
        <H>Lelang</H>
        <UL>
          <li>Jika kamu <strong>menolak</strong> membeli, properti otomatis dilelang ke semua pemain.</li>
          <li>Kamu juga bisa <strong>melelang properti sendiri</strong> lewat menu kelola untuk cari uang cepat.</li>
        </UL>
        <H>Monopoli (color set)</H>
        <P>Memiliki <strong>semua</strong> petak satu warna = monopoli. Tanpa membangun pun, sewa dasar di set itu jadi <strong>2×</strong>. Monopoli juga syarat untuk membangun rumah.</P>
        <Tip>Klik petak/properti mana pun di papan untuk melihat kartu detail (sewa per tingkat, harga, gadai).</Tip>
      </>
    ),
  },
  {
    id: "bangun", title: "Rumah & Hotel", icon: <Building2 className="w-4 h-4" />,
    body: (
      <>
        <P>Setelah punya monopoli, kamu bisa membangun untuk melipatgandakan sewa.</P>
        <H>Aturan</H>
        <UL>
          <li>Harga per rumah/hotel = nilai <em>housePrice</em> properti tersebut.</li>
          <li><strong>Bangun merata</strong>: selisih jumlah rumah antar petak dalam satu set maksimal 1.</li>
          <li>4 rumah → bisa ditingkatkan jadi <strong>1 hotel</strong>.</li>
          <li>Jual bangunan kapan saja, dapat <strong>setengah</strong> harga beli.</li>
          <li>Stok bank terbatas: <strong>32 rumah</strong> &amp; <strong>12 hotel</strong>.</li>
        </UL>
        <Warn>Selama kamu <strong>dipenjara</strong>, kamu tidak bisa membangun.</Warn>
      </>
    ),
  },
  {
    id: "sewa", title: "Sewa", icon: <Coins className="w-4 h-4" />,
    body: (
      <>
        <P>Mendarat di properti milik pemain lain = bayar sewa ke pemiliknya.</P>
        <H>Properti warna</H>
        <UL>
          <li>Sewa naik bertingkat: dasar → 1/2/3/4 rumah → hotel.</li>
          <li>Sewa dasar <strong>2×</strong> bila pemilik memegang monopoli (tanpa rumah).</li>
        </UL>
        <H>Stasiun (railroad)</H>
        <P>Sewa tergantung jumlah stasiun yang dimiliki pemilik: makin banyak, makin mahal.</P>
        <H>Utilitas (listrik/air)</H>
        <P>Sewa = angka dadu × pengali (1 utilitas = lebih kecil, 2 utilitas = jauh lebih besar).</P>
        <Warn>Pemilik yang sedang <strong>dipenjara</strong> hanya menerima <strong>separuh</strong> sewa — estatnya tak terkelola.</Warn>
      </>
    ),
  },
  {
    id: "gadai", title: "Gadai (Mortgage)", icon: <Lock className="w-4 h-4" />,
    body: (
      <>
        <P>Butuh uang cepat? Gadaikan properti ke bank.</P>
        <UL>
          <li>Gadai memberi <strong>50%</strong> harga properti; properti gadai tidak menghasilkan sewa.</li>
          <li>Menebus gadai biayanya nilai gadai <strong>+ 10%</strong> bunga.</li>
          <li>Tak ada bangunan boleh tersisa di set saat menggadai.</li>
        </UL>
        <Tip>Kamu juga bisa <strong>menjual properti ke bank</strong> (50% nilai) lewat menu kelola, bukan cuma menggadai.</Tip>
      </>
    ),
  },
  {
    id: "penjara", title: "Penjara", icon: <ShieldAlert className="w-4 h-4" />,
    body: (
      <>
        <H>Cara masuk</H>
        <UL>
          <li>Mendarat di petak "Masuk Penjara".</li>
          <li>Menarik kartu yang menyuruh ke penjara.</li>
          <li>Melempar kembar 3× berturut-turut.</li>
          <li>Ketahuan melakukan kejahatan berat (heat tinggi).</li>
        </UL>
        <H>Cara keluar</H>
        <UL>
          <li>Bayar <strong>jaminan</strong>, gunakan kartu bebas penjara, atau lempar kembar.</li>
          <li>Gagal kembar 3× → wajib bayar jaminan.</li>
        </UL>
        <H>Penjara itu MAHAL sekarang</H>
        <KV rows={[
          ["Jaminan", "max( $50 + $70×(jumlah masuk−1), 8% kekayaan )"],
          ["Sewa masuk", "dipotong 50% selama kamu dibui"],
          ["Aktivitas", "bangun / trade / lobi dibekukan"],
          ["Catatan kriminal", "heat +25 saat bebas"],
        ]} />
        <Warn>Residivis &amp; pemain kaya membayar jaminan jauh lebih besar dari $50 lama.</Warn>
      </>
    ),
  },
  {
    id: "kartu", title: "Pajak & Kartu", icon: <Sparkles className="w-4 h-4" />,
    body: (
      <>
        <H>Pajak</H>
        <UL>
          <li><strong>Income Tax</strong>: bayar $200 atau 10% kekayaan bersih — pilih yang lebih kecil.</li>
          <li><strong>Luxury Tax</strong>: bayar nominal tetap ke bank.</li>
        </UL>
        <H>Kesempatan &amp; Dana Umum</H>
        <P>Tarik kartu dan jalankan instruksinya: terima/bayar uang, pindah petak, masuk/bebas penjara, perbaikan per rumah, dll. Kartu muncul beranimasi dari papan.</P>
        <Tip>Lihat semua isi kartu kapan saja lewat tombol <strong>Kartu</strong> di header.</Tip>
      </>
    ),
  },
  {
    id: "trade", title: "Trade", icon: <HandCoins className="w-4 h-4" />,
    body: (
      <>
        <P>Tukar properti, uang, dan kartu bebas penjara dengan pemain lain (manusia atau AI).</P>
        <UL>
          <li>Kolom atas = yang <strong>kamu serahkan</strong> (kamu bayar). Kolom bawah = yang <strong>kamu terima</strong>.</li>
          <li>Tak ada batas atas uang yang diminta — pemain kaya-properti tapi miskin-tunai tetap bisa bertransaksi.</li>
          <li>AI menilai tawaran dari sisi nilai &amp; sinergi monopoli; AI juga bisa menawar antar sesama AI.</li>
        </UL>
        <Warn>Pemain yang <strong>dipenjara</strong> tidak bisa mengajukan trade.</Warn>
      </>
    ),
  },
  {
    id: "bank", title: "Bank & Pinjaman", icon: <Landmark className="w-4 h-4" />,
    body: (
      <>
        <P>Buka menu <strong>Bank</strong> di header untuk meminjam uang ke bank sentral.</P>
        <KV rows={[
          ["Bunga pinjaman", "suku bunga acuan + 2% margin / ronde"],
          ["Tenor", "3, 5, atau 8 ronde"],
          ["Plafon kredit", "60% kekayaan bersih − utang berjalan"],
          ["Cicilan", "ditagih otomatis tiap akhir giliranmu"],
        ]} />
        <UL>
          <li>Bunga <strong>mengambang</strong>: ikut suku bunga acuan yang berlaku, jadi kebijakan bank sentral memengaruhi pinjaman berjalan.</li>
          <li>Bisa <strong>lunasi lebih awal</strong> kapan saja saat giliranmu.</li>
          <li>Gagal bayar → likuidasi paksa → bisa bangkrut.</li>
        </UL>
        <Tip>AI juga memakai bank: meminjam saat kas tipis tapi kaya aset, melunasi saat berlimpah.</Tip>
      </>
    ),
  },
  {
    id: "ekonomi", title: "Ekonomi & Tahun Fiskal", icon: <TrendingUp className="w-4 h-4" />,
    body: (
      <>
        <P>Tiap <strong>12 ronde</strong> ada satu siklus ekonomi yang menggoyang seluruh permainan.</P>
        <H>Kebijakan moneter otonom</H>
        <P>Bank sentral &amp; pemerintah (NPC) memilih iklim ekonomi — Ekspansi, Resesi, Inflasi, Pengetatan, atau Normalisasi — lalu menyetel ulang:</P>
        <UL>
          <li><strong>Suku bunga acuan</strong> (memengaruhi semua pinjaman).</li>
          <li><strong>Regulasi sewa</strong> (kontrol sewa ↓ atau deregulasi ↑).</li>
          <li><strong>Pajak properti per-ronde</strong>.</li>
        </UL>
        <H>Tahun Fiskal</H>
        <P>Berselang-seling antara <strong>Reformasi Pajak</strong> (pajak kekayaan progresif — patuh atau mangkir/judi) dan <strong>Inflasi</strong> (simpan tunai vs borong aset). Pemain manusia memilih lewat modal; AI memutuskan otomatis.</P>
        <P>Sesudah ronde ke-10, tiap ronde juga berpeluang memunculkan <strong>event acak</strong> berperingkat: Reguler, Spesial, Langka, hingga Mythos.</P>
      </>
    ),
  },
  {
    id: "pemerintah", title: "Pemerintah & Cara Curang", icon: <Scale className="w-4 h-4" />,
    body: (
      <>
        <P>Menu <strong>Pemerintah</strong> menyimpan "jalur belakang". Tiap aksi punya peluang ketahuan yang naik seiring <strong>kecurigaan (heat)</strong>.</P>
        <KV rows={[
          ["Peluang ketahuan", "risiko dasar + (heat/100 × 55%)"],
          ["Heat per kejahatan", "+12 (lebih besar bila ketahuan)"],
          ["Heat luruh", "−6 / ronde bila lying low"],
        ]} />
        <H>Aksi</H>
        <UL>
          <li><strong>Suap Sipir</strong> ($80): keluar penjara instan. Ketahuan: suap hangus + denda $200, tetap dibui.</li>
          <li><strong>Lobi Regulasi</strong> ($150): bebas pajak properti + sewa propertimu +10% sampai siklus berikutnya. Ketahuan: skandal &amp; denda $250.</li>
          <li><strong>Gelapkan Pembukuan</strong>: sewa berikutnya yang kamu bayar jadi 40%. Kena audit: bayar penuh + denda 1,5× selisih (penjara bila heat tinggi).</li>
          <li><strong>Manipulasi Lelang</strong>: menangkan lelang berjalan di tawaran sekarang. Ketahuan: lelang batal + denda $180.</li>
        </UL>
        <Warn>Makin sering &amp; makin "tidak rapi", makin tinggi heat — dan makin besar risiko pidana + denda.</Warn>
      </>
    ),
  },
  {
    id: "bangkrut", title: "Bangkrut & Investor", icon: <Skull className="w-4 h-4" />,
    body: (
      <>
        <P>Jika utang melebihi yang bisa kamu bayar, kamu otomatis melikuidasi (jual bangunan per set, lalu gadai). Masih kurang juga → bangkrut.</P>
        <H>Penyelamatan investor</H>
        <P>Tepat di ambang bangkrut, pemain lain bisa menawarkan <strong>menyelamatkanmu</strong>:</P>
        <UL>
          <li>Investor melunasi utangmu.</li>
          <li>Sebagai imbalan, investor menerima <strong>50% pendapatan sewamu</strong> sampai modalnya kembali <strong>1,5×</strong>.</li>
          <li>Selama pakta: kamu hanya bayar sewa tanah dasar di properti investor, dan investor gratis di propertimu.</li>
          <li>Kamu tetap bisa menang — pakta berakhir begitu modal investor balik.</li>
        </UL>
      </>
    ),
  },
  {
    id: "kontrol", title: "Kontrol & Tips", icon: <MousePointerClick className="w-4 h-4" />,
    body: (
      <>
        <H>Kontrol</H>
        <UL>
          <li><strong>Spasi</strong>: lempar dadu, atau tutup modal/notifikasi teratas.</li>
          <li><strong>Klik petak</strong>: lihat kartu detail properti.</li>
          <li><strong>Klik propertimu</strong>: buka menu kelola (bangun, gadai, trade, jual/lelang).</li>
          <li>Header: <strong>Properti</strong>, <strong>Kartu</strong>, <strong>Bank</strong>, <strong>Pemerintah</strong>, <strong>Reset</strong>.</li>
        </UL>
        <H>Tips menang</H>
        <UL>
          <li>Kejar monopoli warna ber-ROI tinggi (Oranye/Merah sering didarati).</li>
          <li>Sisakan tunai untuk sewa &amp; cicilan — jangan over-leverage.</li>
          <li>Perhatikan suku bunga sebelum meminjam; jangan menumpuk heat saat sedang diawasi.</li>
        </UL>
      </>
    ),
  },
];

const CHAPTERS_EN: Chapter[] = [
  {
    id: "dasar", title: "Game Basics", icon: <Dices className="w-4 h-4" />,
    body: (
      <>
        <P>Your goal is simple: be the last player left standing. Wealth comes from buying properties, turning them into monopolies, then charging the highest rent you can.</P>
        <H>Turn flow</H>
        <UL>
          <li>Roll two dice; your token advances that many spaces.</li>
          <li>Resolve the space you land on (buy, pay rent, draw a card, pay tax, etc.).</li>
          <li>Optionally manage assets (build, mortgage, trade, bank, government), then end your turn.</li>
        </UL>
        <H>Doubles</H>
        <UL>
          <li>Roll doubles → you go again after resolving the space.</li>
          <li>Doubles <strong>three times in a row</strong> → straight to jail.</li>
        </UL>
        <H>Passing GO</H>
        <P>Each time you pass or land on <strong>GO</strong> you collect <strong>$200</strong>.</P>
        <Tip>Press <strong>Space</strong> to roll the dice, or to dismiss the top open modal/notification.</Tip>
      </>
    ),
  },
  {
    id: "properti", title: "Property & Auctions", icon: <Home className="w-4 h-4" />,
    body: (
      <>
        <H>Buying</H>
        <P>Land on an unowned, purchasable space → you may buy it at the listed price, or decline.</P>
        <H>Auctions</H>
        <UL>
          <li>If you <strong>decline</strong> to buy, the property is auctioned to all players.</li>
          <li>You can also <strong>auction your own property</strong> from the manage menu to raise cash fast.</li>
        </UL>
        <H>Monopoly (color set)</H>
        <P>Owning <strong>all</strong> tiles of one color = a monopoly. Even without building, base rent on that set doubles to <strong>2×</strong>. A monopoly is also required to build houses.</P>
        <Tip>Click any tile/property on the board to see its detail card (rent per level, price, mortgage).</Tip>
      </>
    ),
  },
  {
    id: "bangun", title: "Houses & Hotels", icon: <Building2 className="w-4 h-4" />,
    body: (
      <>
        <P>Once you hold a monopoly, you can build to multiply rent.</P>
        <H>Rules</H>
        <UL>
          <li>Price per house/hotel = that property's <em>housePrice</em> value.</li>
          <li><strong>Build evenly</strong>: house counts across the set may differ by at most 1.</li>
          <li>4 houses → can be upgraded to <strong>1 hotel</strong>.</li>
          <li>Sell buildings anytime for <strong>half</strong> the purchase price.</li>
          <li>The bank's supply is limited: <strong>32 houses</strong> &amp; <strong>12 hotels</strong>.</li>
        </UL>
        <Warn>While you're <strong>in jail</strong>, you can't build.</Warn>
      </>
    ),
  },
  {
    id: "sewa", title: "Rent", icon: <Coins className="w-4 h-4" />,
    body: (
      <>
        <P>Landing on another player's property means paying rent to its owner.</P>
        <H>Color properties</H>
        <UL>
          <li>Rent scales up: base → 1/2/3/4 houses → hotel.</li>
          <li>Base rent is <strong>2×</strong> if the owner holds the monopoly (with no houses).</li>
        </UL>
        <H>Railroads (stations)</H>
        <P>Rent depends on how many stations the owner holds: the more they own, the pricier it gets.</P>
        <H>Utilities (power/water)</H>
        <P>Rent = the dice roll × a multiplier (1 utility = smaller, 2 utilities = much larger).</P>
        <Warn>An owner who is <strong>in jail</strong> collects only <strong>half</strong> rent — their estate goes unmanaged.</Warn>
      </>
    ),
  },
  {
    id: "gadai", title: "Mortgage", icon: <Lock className="w-4 h-4" />,
    body: (
      <>
        <P>Need cash fast? Mortgage a property to the bank.</P>
        <UL>
          <li>Mortgaging pays <strong>50%</strong> of the property price; mortgaged property earns no rent.</li>
          <li>Unmortgaging costs the mortgage value <strong>+ 10%</strong> interest.</li>
          <li>No buildings may remain in the set when you mortgage.</li>
        </UL>
        <Tip>You can also <strong>sell a property to the bank</strong> (50% of value) from the manage menu, not just mortgage it.</Tip>
      </>
    ),
  },
  {
    id: "penjara", title: "Jail", icon: <ShieldAlert className="w-4 h-4" />,
    body: (
      <>
        <H>How you get in</H>
        <UL>
          <li>Landing on the "Go To Jail" tile.</li>
          <li>Drawing a card that sends you to jail.</li>
          <li>Rolling doubles three times in a row.</li>
          <li>Getting caught committing a serious crime (high heat).</li>
        </UL>
        <H>How you get out</H>
        <UL>
          <li>Pay <strong>bail</strong>, use a Get Out of Jail Free card, or roll doubles.</li>
          <li>Fail doubles 3× → you must pay bail.</li>
        </UL>
        <H>Jail is EXPENSIVE now</H>
        <KV rows={[
          ["Bail", "max( $50 + $70×(times jailed−1), 8% of net worth )"],
          ["Incoming rent", "cut 50% while you're locked up"],
          ["Activities", "build / trade / lobby are frozen"],
          ["Criminal record", "heat +25 on release"],
        ]} />
        <Warn>Repeat offenders &amp; wealthy players pay bail far above the old $50.</Warn>
      </>
    ),
  },
  {
    id: "kartu", title: "Taxes & Cards", icon: <Sparkles className="w-4 h-4" />,
    body: (
      <>
        <H>Taxes</H>
        <UL>
          <li><strong>Income Tax</strong>: pay $200 or 10% of net worth — whichever is lower.</li>
          <li><strong>Luxury Tax</strong>: pay a fixed amount to the bank.</li>
        </UL>
        <H>Chance &amp; Community Chest</H>
        <P>Draw a card and follow its instruction: collect/pay money, move tiles, go to/leave jail, per-house repairs, and more. Cards animate up from the board.</P>
        <Tip>Browse every card anytime via the <strong>Cards</strong> button in the header.</Tip>
      </>
    ),
  },
  {
    id: "trade", title: "Trade", icon: <HandCoins className="w-4 h-4" />,
    body: (
      <>
        <P>Swap properties, cash, and Get Out of Jail Free cards with other players (human or AI).</P>
        <UL>
          <li>Top column = what <strong>you give</strong> (you pay). Bottom column = what <strong>you receive</strong>.</li>
          <li>No upper limit on requested cash — a property-rich, cash-poor player can still deal.</li>
          <li>AI judges offers by value &amp; monopoly synergy; AIs can also trade among themselves.</li>
        </UL>
        <Warn>A player who is <strong>in jail</strong> can't propose a trade.</Warn>
      </>
    ),
  },
  {
    id: "bank", title: "Bank & Loans", icon: <Landmark className="w-4 h-4" />,
    body: (
      <>
        <P>Open the <strong>Bank</strong> menu in the header to borrow from the central bank.</P>
        <KV rows={[
          ["Loan interest", "base rate + 2% margin / round"],
          ["Term", "3, 5, or 8 rounds"],
          ["Credit limit", "60% of net worth − outstanding debt"],
          ["Installments", "auto-charged at the end of each of your turns"],
        ]} />
        <UL>
          <li>Interest is <strong>floating</strong>: it tracks the prevailing base rate, so central-bank policy affects running loans.</li>
          <li>You can <strong>repay early</strong> anytime on your turn.</li>
          <li>Default → forced liquidation → possible bankruptcy.</li>
        </UL>
        <Tip>AI uses the bank too: borrowing when cash-thin but asset-rich, repaying when flush.</Tip>
      </>
    ),
  },
  {
    id: "ekonomi", title: "Economy & Fiscal Year", icon: <TrendingUp className="w-4 h-4" />,
    body: (
      <>
        <P>Every <strong>12 rounds</strong> an economic cycle shakes up the whole game.</P>
        <H>Autonomous monetary policy</H>
        <P>The central bank &amp; government (NPCs) pick an economic climate — Expansion, Recession, Inflation, Austerity, or Normalization — then re-tune:</P>
        <UL>
          <li>The <strong>base interest rate</strong> (affects all loans).</li>
          <li><strong>Rent regulation</strong> (rent control ↓ or deregulation ↑).</li>
          <li>The <strong>per-round property tax</strong>.</li>
        </UL>
        <H>Fiscal Year</H>
        <P>It alternates between <strong>Tax Reform</strong> (a progressive wealth tax — comply or evade/gamble) and <strong>Inflation</strong> (hold cash vs. buy assets). Humans choose via a modal; AI decides automatically.</P>
        <P>After round 10, each round also has a chance to spring a tiered <strong>random event</strong>: Regular, Special, Rare, up to Mythos.</P>
      </>
    ),
  },
  {
    id: "pemerintah", title: "Government & Cheats", icon: <Scale className="w-4 h-4" />,
    body: (
      <>
        <P>The <strong>Government</strong> menu holds the "back channels". Each action has a catch chance that rises with your <strong>suspicion (heat)</strong>.</P>
        <KV rows={[
          ["Catch chance", "base risk + (heat/100 × 55%)"],
          ["Heat per crime", "+12 (more if caught)"],
          ["Heat decay", "−6 / round when lying low"],
        ]} />
        <H>Actions</H>
        <UL>
          <li><strong>Bribe the Guard</strong> ($80): leave jail instantly. If caught: bribe lost + $200 fine, still jailed.</li>
          <li><strong>Lobby Regulators</strong> ($150): skip property tax + your rents +10% until the next cycle. If caught: scandal &amp; $250 fine.</li>
          <li><strong>Cook the Books</strong>: the next rent you pay drops to 40%. If audited: pay in full + a 1.5× penalty on the gap (jail if heat is high).</li>
          <li><strong>Rig the Auction</strong>: win the running auction at the current bid. If caught: auction cancelled + $180 fine.</li>
        </UL>
        <Warn>The more often &amp; "sloppier" you play, the higher your heat — and the bigger the risk of charges + fines.</Warn>
      </>
    ),
  },
  {
    id: "bangkrut", title: "Bankruptcy & Investors", icon: <Skull className="w-4 h-4" />,
    body: (
      <>
        <P>If your debt exceeds what you can pay, you auto-liquidate (sell buildings per set, then mortgage). Still short → bankruptcy.</P>
        <H>Investor rescue</H>
        <P>Right at the brink of bankruptcy, another player can offer to <strong>rescue you</strong>:</P>
        <UL>
          <li>The investor pays off your debt.</li>
          <li>In return, the investor takes <strong>50% of your rent income</strong> until they recoup <strong>1.5×</strong> their capital.</li>
          <li>During the pact: you pay only base land rent on the investor's properties, and they pay nothing on yours.</li>
          <li>You can still win — the pact ends as soon as the investor's capital is recouped.</li>
        </UL>
      </>
    ),
  },
  {
    id: "kontrol", title: "Controls & Tips", icon: <MousePointerClick className="w-4 h-4" />,
    body: (
      <>
        <H>Controls</H>
        <UL>
          <li><strong>Space</strong>: roll the dice, or close the top modal/notification.</li>
          <li><strong>Click a tile</strong>: see its property detail card.</li>
          <li><strong>Click your property</strong>: open the manage menu (build, mortgage, trade, sell/auction).</li>
          <li>Header: <strong>Properties</strong>, <strong>Cards</strong>, <strong>Bank</strong>, <strong>Government</strong>, <strong>Reset</strong>.</li>
        </UL>
        <H>Tips to win</H>
        <UL>
          <li>Chase high-ROI color monopolies (Orange/Red get landed on often).</li>
          <li>Keep cash on hand for rent &amp; installments — don't over-leverage.</li>
          <li>Watch interest rates before borrowing; don't pile on heat while you're being watched.</li>
        </UL>
      </>
    ),
  },
];

export default function GuideModal({ onClose }: Props) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const CHAPTERS = locale === "en" ? CHAPTERS_EN : CHAPTERS_ID;
  const [active, setActive] = useState(CHAPTERS_ID[0].id);
  const chapter = CHAPTERS.find((c) => c.id === active) ?? CHAPTERS[0];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl w-[94vw] h-[84vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          <div className="font-bold">{t("ui.guide.title")}</div>
          <button onClick={onClose} className="ml-auto text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Chapter nav */}
          <nav className="w-36 sm:w-48 shrink-0 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
            {CHAPTERS.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-[12px] transition ${
                  active === c.id
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-600 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                }`}
              >
                <span className={active === c.id ? "text-white" : "text-emerald-600"}>{c.icon}</span>
                <span className="truncate">{c.title}</span>
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0 overflow-y-auto scrollbar-thin px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-emerald-600">{chapter.icon}</span>
              <h3 className="text-lg font-bold">{chapter.title}</h3>
            </div>
            <div>{chapter.body}</div>
          </div>
        </div>

        <div className="px-4 py-2.5 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
          <Button variant="outline" className="w-full h-8 text-xs" onClick={onClose}>{t("ui.guide.close")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
