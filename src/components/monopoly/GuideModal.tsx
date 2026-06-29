"use client";

import { useState, type ReactNode } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Dices, Home, Building2, Coins, HandCoins, Lock, Landmark,
  Scale, ShieldAlert, TrendingUp, Skull, Sparkles, MousePointerClick, X,
} from "lucide-react";

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
const CHAPTERS: { id: string; title: string; icon: ReactNode; body: ReactNode }[] = [
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

export default function GuideModal({ onClose }: Props) {
  const [active, setActive] = useState(CHAPTERS[0].id);
  const chapter = CHAPTERS.find((c) => c.id === active) ?? CHAPTERS[0];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl w-[94vw] h-[84vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          <div className="font-bold">Buku Panduan</div>
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
          <Button variant="outline" className="w-full h-8 text-xs" onClick={onClose}>Tutup panduan</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
