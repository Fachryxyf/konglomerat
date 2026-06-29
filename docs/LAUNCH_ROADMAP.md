# Roadmap Menuju Launch — Web Monopoly

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
- Belum: git repo, deploy, akun, backend, jaringan.

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

**Kesimpulan cepat:** untuk porto kamu praktis sudah siap — tinggal *quick wins*
di §2. Untuk produk, ikuti fase di §3.

---

## 2. Portfolio-ready (quick wins — hari, bukan bulan)

- [ ] `git init` + `.gitignore` bersih + commit pertama → push GitHub.
- [ ] Deploy demo (Vercel) → **link yang bisa diklik**.
- [ ] README ditulis ulang: semua sistem (bank, ekonomi/fiskal, pemerintahan/korupsi, rescue, event, panduan) + bagian arsitektur.
- [ ] Screenshot/GIF di README (game = jualan visual).
- [ ] Commit test suite (angkat dari scratchpad).
- [ ] Catatan "desktop-only by design" agar blokir mobile dibaca sebagai keputusan.

> Ini tidak butuh rombak apa pun. Bisa dikerjakan sekarang.

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

- [ ] Refactor engine jadi reducer murni + deterministik (RNG via `ctx.rng`).
- [ ] `validateIntent` + skema zod + invariant global (anti-cheat & anti-inject).
- [ ] Server jalankan engine yang sama; client optimistic + rekonsiliasi `version`.
- [ ] Pilih transport + Redis; bikin room/lobby; reconnect & turn timeout.

> **Anti-cheat otomatis beres begitu server otoritatif** — bukan pekerjaan terpisah.

### Fase B — Identitas & persistence
- [ ] Guest ID stabil (minimal) → idealnya auth (OAuth/email).
- [ ] Database: room, user, **match history** pindah dari localStorage ke **Postgres** (+ Redis untuk state live).

### Fase C — IP / Trademark (blocker #1 untuk launch publik) — ✅ sebagian besar selesai
"Monopoly" merek dagang Hasbro; papan klasik (nama petak, warna, kartu) dilindungi.
Demo/porto aman; **komersil/publik wajib rebrand.** Banyak proyek mati di sini.
- [x] **Nama produk baru** — "KONGLOMERAT" (terpusat di `theme.ts`).
- [x] **Nama petak & tema board sendiri** — metropolis fiktif "Kota Raya" (28 tile + 4 transit + 2 utilitas, semua nama orisinal di `boardData.ts`).
- [x] **Teks kartu ditulis ulang** — GO→MULAI, nama lama→baru, kartu khas Hasbro (mis. "kontes kecantikan") diganti; deck → "Kesempatan" / "Dana Umum".
- [x] **Branding UI** — header, setup, metadata, mobile-gate, modal detail/katalog/panduan semua memakai nama baru.
- [x] Mekanik (harga/sewa/warna) dipertahankan — mekanik tak ber-hak cipta; hanya ekspresi yang diorisinalkan.
- [ ] Sisa: README + logo/aset visual orisinal (ikut saat git/branding final), dan review akhir flavor-text kartu bila perlu.

### Fase D — Mobile responsif
Mayoritas pemain kasual di HP. Saat ini diblok total.
- [ ] Layout papan adaptif (portrait), kontrol sentuh, modal mobile-friendly.
- [ ] Ganti halaman blokir jadi pengalaman main beneran di HP.

### Fase E — Standar produksi
- [ ] **Sentry** (error monitoring) + analytics.
- [ ] **Load-test** server socket (banyak room paralel).
- [ ] Moderasi (kalau ada chat / nama kustom).
- [ ] **Terms of Service & Privacy Policy** (wajib begitu ada akun).
- [ ] i18n (sekarang Indonesia-only).
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
- **Fase C** murah secara kode tapi krusial secara legal; jangan ditunda kalau niat publik.
- **Fase D** effort UX besar tersendiri; bisa paralel dgn Fase B.
- Jangan kerjakan Fase B–E sebelum Fase A stabil — semua bergantung pada model state server.
