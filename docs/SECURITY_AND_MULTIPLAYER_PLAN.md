# Rencana Keamanan & Multiplayer — Web Monopoly

Dokumen ini merancang cara menutup tiga kekhawatiran keamanan — **anti-cheat**,
**anti parameter injection**, dan **anti manipulasi DOM** — sekaligus jalur
menuju multiplayer online. Intinya: ketiganya bukan tiga pekerjaan terpisah,
melainkan **satu prinsip yang sama**.

> Untuk gambaran besar urutan menuju launch (multiplayer, IP/trademark, mobile,
> akun/DB, ops), lihat [`LAUNCH_ROADMAP.md`](./LAUNCH_ROADMAP.md). Dokumen ini
> adalah deep-dive teknis dari Fase A roadmap tersebut.

---

## 0. Prinsip inti: Trust Boundary

> **Server adalah satu-satunya sumber kebenaran. Client hanya tampilan + cache + UX.**

Kondisi sekarang: seluruh engine hidup di client (`gameStore.ts` + `localStorage`).
Pemain memiliki runtime browser-nya, jadi **semua proteksi client-side bisa
dibypass** (edit state, panggil action, lewati `Object.freeze`, edit DOM).

Ketiga kekhawatiran adalah turunan dari trust boundary yang salah tempat:

| Kekhawatiran | Akar masalah | Solusi sebenarnya |
|---|---|---|
| Anti-cheat (manipulasi state/uang) | logika & state di client | server simpan & validasi state otoritatif |
| Anti parameter injection | input aksi dipercaya apa adanya | server validasi tiap *intent* dengan skema + invariant |
| Anti manipulasi DOM | DOM dianggap sumber data | **DOM cuma view** — server tak pernah percaya client; manipulasi jadi tak relevan |

**Konsekuensi penting soal DOM:** kita tidak "mencegah" orang mengedit DOM.
Kalau seseorang mengubah tampilan jadi `$999.999`, itu tidak mengubah apa pun
selama server yang memegang saldo. Upaya "mengunci" DOM (MutationObserver yang
me-revert) adalah perlombaan yang pasti kalah dan sia-sia. **Diabaikan by design.**

---

## 1. Arsitektur target

### 1.1 Engine murni (deterministik)

Ekstrak logika game jadi **reducer murni** yang bisa jalan identik di client & server:

```ts
// engine/applyIntent.ts  (tanpa React, tanpa Zustand, tanpa I/O)
function applyIntent(state: GameState, intent: Intent, ctx: EngineCtx): {
  state: GameState;
  events: GameEvent[];   // log, animasi, suara — efek untuk di-render
  error?: ValidationError;
}
```

Syarat determinisme (krusial untuk otoritas server & anti-cheat):
- **Tanpa `Math.random()` langsung.** RNG diinjeksi via `ctx.rng` (seeded).
  Saat ini acak tersebar di `rollDice()`, `events.ts`, `ai.ts`, `government.ts`
  (`catchChance`), `bank.ts` (`rollMonetaryPolicy`). Semua harus lewat `ctx.rng`.
- **Tanpa `Date.now()` / timer** di dalam engine.
- **Tanpa `get()/set()` Zustand** — state masuk-keluar sebagai argumen & return.

> Engine-mu sudah setengah jalan: `bank.ts`, `government.ts`, `ai.ts`, `utils.ts`
> sudah modul pure. Pekerjaan utama Phase 0 adalah melepas `gameStore`'s actions
> dari `get()/set()` jadi fungsi `(state, intent) => state`.

### 1.2 Aliran data

```
Client (view + optimistic)                 Server (authoritative)
─────────────────────────                  ──────────────────────
user klik "Beli"
  └─ kirim Intent ─────────────────────▶   validateIntent(state, intent)
  └─ applyIntent lokal (optimistic UI)        ├─ valid  → applyIntent → state v+1
                                              │           broadcast {diff, version}
  ◀──────────── state resmi / koreksi ───────┘
  └─ rekonsiliasi: kalau beda dgn optimistic,
     state server menang (client koreksi)     └─ tidak valid → tolak + (opsi) flag
```

Client boleh "optimistic" pakai engine yang sama untuk responsif, tapi **server
selalu menang**. Setiap state punya `version` monoton untuk deteksi desync.

---

## 2. Layer validasi: `validateIntent` (jantung anti-cheat & anti-inject)

Satu gerbang yang dipakai **identik** di client (feedback instan) dan server
(otoritatif). Dua lapis:

### 2.1 Skema payload (anti parameter injection — lapis bentuk)

Validasi bentuk & batas tiap intent dengan **zod**:

```ts
const BuyProperty = z.object({ type: z.literal("BUY_PROPERTY") });
const ProposeTrade = z.object({
  type: z.literal("PROPOSE_TRADE"),
  toId: z.number().int().nonnegative(),
  cashFrom: z.number().int().min(0),   // tak boleh negatif
  cashTo:   z.number().int().min(0),
  propertiesFrom: z.array(z.number().int()).max(28),
  propertiesTo:   z.array(z.number().int()).max(28),
  goojFrom: z.number().int().min(0),
  goojTo:   z.number().int().min(0),
});
const TakeLoan = z.object({
  type: z.literal("TAKE_LOAN"),
  amount: z.number().int().positive(),
  term: z.union([z.literal(3), z.literal(5), z.literal(8)]),
});
// ...satu skema per intent
```

Ini langsung menutup injeksi nilai aneh (`cashTo: -9999`, `amount: 1e9`,
`term: 999`, properti di luar 0–39, dst).

### 2.2 Invariant aturan main (anti-cheat — lapis logika)

Cek konteks terhadap state otoritatif, **bukan** klaim client:

- `BUY_PROPERTY`: petak benar-benar tak bermilik, harga ≤ saldo pembeli, fase = ACTION, giliran pemain yang benar.
- `PROPOSE_TRADE`: pengaju memiliki semua `propertiesFrom`; mitra memiliki `propertiesTo`; `goojFrom ≤` kartu yang dipunya; pengaju tidak dipenjara.
- `TAKE_LOAN`: `amount ≤ creditLimit(net, debt)`.
- `BUILD_HOUSE`: punya monopoli, aturan merata, stok bank cukup, bukan saat dipenjara.
- `BRIBE_GUARD`: sedang dipenjara & saldo ≥ biaya. `RIG_AUCTION`: lelang aktif & pemain peserta.
- **Otorisasi giliran**: setiap intent membawa `playerId` dari sesi terautentikasi — server memaksa `intent.playerId === state.currentPlayer`, bukan dari payload.

Banyak cek ini **sudah ada** tersebar di `gameStore` (mis. guard `if (player.inJail) return`, `if (player.balance < price) return`). Tugasnya: **angkat jadi `validateIntent` terpusat & murni** supaya bisa dijalankan di server.

### 2.3 Invariant global (deteksi tamper)

Assertion yang dijalankan tiap transisi; kalau gagal = ada manipulasi/bug:
- **Kekekalan uang**: total uang pemain + yang keluar ke bank konsisten dengan transaksi.
- **Konsistensi kepemilikan**: `ownership[i].ownerId` ⇄ `players[owner].properties` saling cocok.
- **Stok bank**: rumah+hotel terpakai ≤ 32/12.

Di server, kegagalan invariant → tolak transisi + log + (opsi) tandai pemain.

---

## 3. Otoritas server & transport (anti-cheat sejati)

- **Transport**: WebSocket. Vercel serverless tak cocok untuk koneksi persisten —
  pilih **PartyKit / Liveblocks / Ably / socket server Node sendiri** (mis. di
  Fly.io / Railway), state room di memori + **Redis** untuk durabilitas/scale.
- **RNG di server**: dadu, kartu, event, catch-chance korupsi di-roll **server**
  dengan seed rahasia (`ctx.rng`). Client tak pernah menentukan hasil acak →
  mustahil "atur dadu".
- **Lobby & lifecycle**: room + join-code, presence, **reconnect**, dan
  **turn timeout** (pemain disconnect → giliran auto-skip/AI-takeover).
- **State sync**: broadcast diff + `version`; client yang ketinggalan minta full snapshot.

---

## 4. Hardening tambahan (polisi tidur — opsional, bukan jaminan)

Berguna menahan iseng kasual, tapi **bukan** pengganti otoritas server:
- Jangan expose store ke `window` di production; build prod sudah minify.
- **Rate limiting** intent per sesi (anti spam/flood).
- **Server-side anti-abuse**: deteksi pola intent ilegal berulang → kick/ban.
- Telemetry: **Sentry** untuk error, log percobaan intent invalid.
- Validasi nama/chat (moderasi) bila ada input teks bebas.

---

## 5. Peta fase & urutan rekomendasi

| Fase | Isi | Status keamanan | Kapan |
|---|---|---|---|
| **0. Engine murni** | lepas reducer dari Zustand; RNG via `ctx.rng`; tipe `Intent`/`GameEvent` | fondasi | **sekarang** |
| **1. `validateIntent` + zod + invariant** | gerbang validasi terpusat, dipakai client | menutup inject + cek aturan di satu tempat (masih client-trust) | **sekarang** |
| **2. Otoritas server + socket** | server jalankan engine yang sama; RNG server; rooms; reconnect | **anti-cheat sejati**; DOM/inject jadi tak relevan | saat commit ke online |
| **3. Hardening & ops** | rate limit, tamper telemetry, Sentry, moderasi | pematangan | menjelang launch |

**Rekomendasi:** kerjakan **Fase 0 + 1 sekarang**. Alasannya:
1. **Reusable 100%** — `applyIntent` + `validateIntent` yang sama dipakai server di Fase 2 tanpa nulis ulang.
2. **Memperketat single-player** & merapikan arsitektur (testable, deterministik).
3. **Emas untuk portofolio** — menunjukkan kamu paham *trust boundary*, determinisme, dan validasi berlapis, bukan sekadar nempel fitur.

Fase 2 (server) ditunda sampai kamu benar-benar mau online — karena di situlah anti-cheat/inject/DOM **benar-benar** terjawab, dan butuh komitmen infra.

---

## 6. Checklist eksekusi Fase 0–1

Status per implementasi terakhir:

- [x] Union `Intent` — `intents.ts` (27 intent, plus `TradeIntentPayload`, `IntentResult`).
- [x] **Injeksi RNG** — `rng.ts` (seam `rng()` + `setRng`/`seedRng` mulberry32); semua `Math.random()` di engine (utils, ai, events, fiscal, bank, cardData, gameStore) dialihkan ke `rng()`. Terbukti deterministik di test.
- [x] **Skema zod** per intent — `schemas.ts` + `parseIntent()` (gate bentuk & batas; anti-inject).
- [x] **`validateIntent`** — `validateIntent.ts` (pure; rule + invariant aturan + otorisasi giliran/aktor).
- [x] **Invariant global** — `invariants.ts` (`checkInvariants`/`assertInvariants`: konsistensi ownership dua arah, stok bank, batas bangunan, loan ≥ 0).
- [x] **Gerbang `dispatch`** di store — `parseIntent → validateIntent → apply → assertInvariants` (dev). Satu pintu yang akan dicerminkan server.
- [x] **Suite test resmi** — `src/lib/monopoly/intent-gate.test.ts` (gerbang 3 lapis + determinisme RNG) dan `engine.test.ts` (regresi aturan & hotseat). Jalankan `bun run test`.
- [x] **Kursi === id** dijamin invariant (`checkInvariants`), bukan lagi asumsi tak tertulis: engine mengalamatkan pemain lewat kursi (`currentPlayerIndex`) sekaligus id (`ownerId`), dan server wajib mempertahankan kesamaan itu.
- [x] **Animasi terikat aktor** — langkah pion mengikat `moverId`, bukan `currentPlayerIndex` yang dibaca ulang tiap tick. Prasyarat sinkronisasi: state antar-tick tak boleh bergantung pada "siapa yang sedang duduk sekarang".
- [x] **Otorisasi giliran lelang** — `AUCTION_BID` menolak penawar yang bukan sedang bergilir (dulu siapa pun bisa menawar kapan pun).

Sisa (ditunda — masuk Fase 2 saat server dibangun):

- [ ] **Migrasi call-site UI → `dispatch`** (gerbang sudah ada & teruji, tapi UI masih memanggil action langsung: 38 binding `useGame((s) => s.<action>)` + 11 `useGame.getState().<action>()`). Ini pekerjaan mekanis dan bisa dilakukan sekarang tanpa server — hanya berisiko regresi, jadi ditahan sampai suite test menutupi lebih banyak alur.
- [ ] **`GameEvent` sebagai output engine** (log/animasi/suara) — bagian dari pemurnian penuh reducer. Saat ini efek ditulis langsung via `addLog` + 28 `setTimeout` di dalam store; server tidak boleh punya timer.
- [ ] **`applyIntent(state, intent, ctx)` murni** (lepas total dari `get/set` Zustand) — penghalang terbesar: orkestrasi giliran memakai `setTimeout` untuk animasi, sehingga transisi bukan fungsi murni. Perlu memisahkan "transisi state" (murni, instan) dari "jadwal presentasi" (client-only).
- [ ] **AI di luar UI** — `use-ai-controller.ts` masih hook React yang menggerakkan AI (timer + urutan aksi ada di lapisan view). Pengacakannya sudah lewat `rng()` sehingga deterministik, tapi orkestrasinya perlu jadi modul murni agar server bisa menjalankan AI tanpa React.
- [ ] **`AUCTION_LEAVE` belum ada di kosakata `Intent`** — UI memanggil `auctionLeave` langsung; `AUCTION_PASS` ada tapi dipetakan ke aksi yang sama. Rapikan saat migrasi dispatch.
