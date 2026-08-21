# Roadmap Menuju Launch — Konglomerat

Dokumen ini memetakan jalur dari **"game lokal vs AI"** ke **dua tujuan berbeda**
yang sering dicampur: *dipamerkan di portofolio* vs *diluncurkan sebagai produk
online*. Barnya beda jauh. Detail arsitektur keamanan/multiplayer ada di
[`SECURITY_AND_MULTIPLAYER_PLAN.md`](./SECURITY_AND_MULTIPLAYER_PLAN.md) — di sini
fokus ke **urutan & cakupan launch**.

---

## 0. Status sekarang

- Single-device, hotseat: semua pemain (human + AI) di satu layar.
- Client-only: engine di Zustand `gameStore` + persist `localStorage`.
- Engine rapi & terisolasi: modul pure `bank.ts`, `government.ts`, `ai.ts`, `utils.ts`.
- Mobile **diblok total** (halaman peringatan).
- **Sudah ada** (update terakhir): repo publik `Fachryxyf/konglomerat` + auto-deploy Vercel di
  `konglomerat.fachryxyf.com`; laman dokumentasi publik di root (bilingual, dark mode);
  suite Vitest 43 test; seluruh aksi pemain lewat gerbang `dispatch` dengan aktor eksplisit.
- **Belum:** akun, backend, jaringan, mobile responsif.

---

## 1. Dua tujuan, dua bar berbeda

| | Portofolio / demo | Produk online publik |
|---|---|---|
| Multiplayer | tak wajib (vs AI cukup) | **wajib** server-authoritative |
| IP/Trademark | aman (non-komersil) | **wajib rebrand** (Hasbro) |
| Mobile | boleh diblok (desktop-only by design) | **wajib responsif** |
| Akun/DB | tak perlu | wajib (identity + persistence) |
| Ops (Sentry/ToS) | minimal | wajib |
| **Effort** | **hari** | **bulan** |

**Kesimpulan cepat:** untuk porto sudah siap dan sudah tayang (§2 selesai). Untuk
produk, ikuti fase di §3 — penghalang pertama adalah fondasi engine murni, bukan
infra.

---

## 2. Portfolio-ready (quick wins — hari, bukan bulan)

- [x] Repo GitHub publik + `.gitignore` bersih (tanpa secret) → `Fachryxyf/konglomerat`, dengan About, topics, dan prerelease `v1.0.0-beta.1`.
- [x] Deploy demo → **https://konglomerat.fachryxyf.com/konglomerat** (Vercel, auto-deploy dari `main`).
- [x] README ditulis ulang: semua sistem + arsitektur + badge, dan **batasan disebut eksplisit** (hotseat, desktop-only, tanpa akun).
- [x] Screenshot di README (papan + menu pemerintahan).
- [x] Suite test resmi — Vitest, 43 test (`bun run test`).
- [x] Catatan "desktop-only by design" agar blokir mobile dibaca sebagai keputusan.
- [x] Laman dokumentasi publik di root domain (buku panduan bilingual + dark mode), berbagi satu sumber isi dengan panduan in-game.

> §2 selesai. Kalau tujuannya portofolio, proyek ini sudah bisa dipamerkan apa adanya.

---

## 3. Product-launch (fase, urut realistis)

### Fase A — Fondasi multiplayer (paling berat)
Multiplayer = **3 submasalah**, bukan satu:

1. **Server otoritatif.** Logika pindah ke server: client kirim *intent*, server
   validasi + broadcast state. Tanpa ini, siapa pun bisa `useGame.getState().transferMoney(...)`
   di devtools. → lihat plan keamanan (engine murni `applyIntent`, `validateIntent`, RNG server).
2. **Transport real-time.** WebSocket. Vercel serverless kurang cocok untuk koneksi
   persisten → **PartyKit / Liveblocks / Ably / socket Node sendiri** + **Redis** untuk state room.
3. **Lobby & lifecycle.** Room/join-code, matchmaking, **reconnect**, presence,
   **turn timeout** (disconnect di tengah giliran → auto-skip / AI takeover).

Status per sekarang — **fondasi sebagian berdiri, server belum ada**:

- [x] **Determinisme RNG** — semua acak lewat seam `rng()` (`rng.ts`); terbukti reproducible di test.
- [x] **`validateIntent` + skema zod + invariant global** — gerbang terpusat & murni (`validateIntent.ts`, `schemas.ts`, `invariants.ts`).
- [x] **Semua aksi pemain lewat `dispatch`** dengan aktor eksplisit (`use-intent.ts`) — kontrak yang sama yang akan dipakai server (aktor dari sesi, bukan payload).
- [ ] **Reducer murni `applyIntent(state, intent, ctx)`** — belum. Penghalangnya: orkestrasi giliran memakai `setTimeout` untuk animasi, jadi transisi state dan jadwal presentasi masih satu kesatuan. Server tidak boleh punya timer.
- [ ] **`GameEvent` sebagai output engine** — belum. Log/animasi masih ditulis langsung di tengah transisi via `addLog`.
- [ ] **AI sebagai modul murni** — pengacakannya sudah lewat `rng()`, tapi orkestrasinya masih hook React (`use-ai-controller.ts`).
- [ ] Server jalankan engine yang sama; client optimistic + rekonsiliasi `version`.
- [ ] Pilih transport + Redis; bikin room/lobby; reconnect & turn timeout.

> **Anti-cheat otomatis beres begitu server otoritatif** — bukan pekerjaan terpisah.
> Sampai saat itu, engine hidup di client dan **state bisa dimanipulasi dari devtools**.
> Gerbang `dispatch` mempersempit permukaan & menangkap bug, tapi bukan anti-cheat.

### Fase B — Identitas & persistence
- [ ] Guest ID stabil (minimal) → idealnya auth (OAuth/email).
- [ ] Database: room, user, **match history** pindah dari localStorage ke **Postgres** (+ Redis untuk state live).

### Fase C — IP / Trademark (blocker #1 untuk launch publik) — sebagian besar selesai
"Monopoly" merek dagang Hasbro; papan klasik (nama petak, warna, kartu) dilindungi.
Demo/porto aman; **komersil/publik wajib rebrand.** Banyak proyek mati di sini.
- [x] **Nama produk baru** — "KONGLOMERAT" (terpusat di `theme.ts`).
- [x] **Nama petak & tema board sendiri** — metropolis fiktif "Kota Raya" (28 tile + 4 transit + 2 utilitas, semua nama orisinal di `boardData.ts`).
- [x] **Teks kartu ditulis ulang** — GO→MULAI, nama lama→baru, kartu khas Hasbro (mis. "kontes kecantikan") diganti; deck → "Kesempatan" / "Dana Umum".
- [x] **Branding UI** — header, setup, metadata, mobile-gate, modal detail/katalog/panduan semua memakai nama baru.
- [x] Mekanik (harga/sewa/warna) dipertahankan — mekanik tak ber-hak cipta; hanya ekspresi yang diorisinalkan.
- [x] **README + aset visual orisinal** — glyph skyline `BrandMark` dipakai di favicon, logo, dan header docs; screenshot papan & menu pemerintahan.
- [ ] Sisa: review akhir flavor-text kartu bila perlu, dan konsultasi hukum sebelum monetisasi.

### Fase D — Mobile responsif
Mayoritas pemain kasual di HP. Saat ini diblok total.
- [ ] Layout papan adaptif (portrait), kontrol sentuh, modal mobile-friendly.
- [ ] Ganti halaman blokir jadi pengalaman main beneran di HP.

### Fase E — Standar produksi
- [ ] **Sentry** (error monitoring) + analytics.
- [ ] **Load-test** server socket (banyak room paralel).
- [ ] Moderasi (kalau ada chat / nama kustom).
- [ ] **Terms of Service & Privacy Policy** (wajib begitu ada akun).
- [x] i18n — bilingual ID/EN (`src/lib/i18n/`), termasuk log permainan yang re-render mengikuti bahasa aktif.
- [ ] Polish: efek suara, layar ringkasan akhir (net worth chart), loop retensi.

---

## 4. Urutan rekomendasi & "Minimum Viable Launch"

**Urutan realistis produk:** (1) server-authoritative + socket → (2) rebrand IP →
(3) mobile responsif → (4) akun/DB → (5) standar produksi.

**MVL (Minimum Viable Launch)** — set terkecil yang layak rilis publik:
- Server-authoritative + socket (Fase A) — **non-negotiable**.
- Rebrand IP (Fase C) — **non-negotiable** untuk publik.
- Guest identity + DB match (Fase B, versi ringan).
- Mobile responsif (Fase D) — kalau target pemain kasual.
- Sentry + ToS/Privacy (Fase E, minimal).

Sisanya (auth penuh, i18n, analytics dalam, retensi) bisa **post-launch**.

---

## 5. Catatan risiko/effort

- **Fase A** = effort terbesar & paling berisiko (re-arsitektur). Mulai dari engine
  murni dulu — itu juga memperketat single-player & 100% reusable.
- **Sisa Fase A yang konkret sekarang**: 28 `setTimeout` di `gameStore.ts` yang mencampur
  transisi state dengan jadwal animasi. Selama itu ada, `applyIntent` tak bisa murni dan
  server tak bisa menjalankan engine yang sama. Ini pekerjaan pemisahan, bukan penulisan
  ulang: transisi jadi instan & murni, presentasi (jeda langkah pion, delay AI) pindah ke
  client sebagai konsumen `GameEvent`.
- **Fase C** murah secara kode tapi krusial secara legal; jangan ditunda kalau niat publik.
- **Fase D** effort UX besar tersendiri; bisa paralel dgn Fase B.
- Jangan kerjakan Fase B–E sebelum Fase A stabil — semua bergantung pada model state server.
