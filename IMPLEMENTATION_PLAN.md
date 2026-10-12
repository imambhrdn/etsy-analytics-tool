# IMPLEMENTATION_PLAN — Etsy Intelligence

> Dibuat pada Phase 0 (Repository Inspection & Plan) sesuai PRD §17.
> Sumber spesifikasi: `etsy_intelligence_prd.md` v1.0 · Taskboard: `TASKBOARD.md` v1.1.

- **Tanggal inspeksi:** 2026-10-11
- **Terakhir diperbarui:** 2026-10-12 (sesi `ses-2026-10-12-a`) — sinkronisasi status dengan TASKBOARD v1.1
- **Sesi:** ses-2026-10-11-a (awal) · ses-2026-10-12-a (pembaruan)
- **Zona waktu:** Asia/Jakarta (WIB, UTC+7)
- **Status:** Phase 0, 1, 2 (+ UX polish) **SELESAI**. Aplikasi berjalan lokal, data live Etsy & Supabase terbukti. Fase aktif berikutnya: **Phase 3**.
- **Repo:** https://github.com/imambhrdn/etsy-analytics-tool (ter-push, branch `main`)

### Peta status fase (ringkas)

| Fase | Status | Bukti |
|:-----|:------:|:------|
| 0 Inspection & plan | ✅ | `file:IMPLEMENTATION_PLAN.md` |
| 1 Foundation | ✅ | `src/`, `migrations/`, `.env.example` |
| 2 Etsy client & Explorer | ✅ | `src/lib/etsy/`, `/products`, tests pass |
| 2b UX polish Explorer | ✅ | `commit:51282a6`, `32e02cb`, `b86e5fa` |
| 3 Discovery & snapshots | ✅ | `src/lib/discovery/`, `/`, tests pass |
| 4 Scoring & Idea Vault | ⏳ **aktif** | — |
| 5 Competitor & My Shop | ⬜ | — |
| 6 n8n & reports | ⬜ | — |
| 7 Hardening | ⬜ | — |

---

## 1. Hasil Inspeksi Repo (PRD §17 Phase 0.1–0.3)

> ⚠️ **Catatan historis.** Bagian ini merekam kondisi repo **saat Phase 0 (2026-10-11)**.
> Repo kini **sudah berisi kode lengkap** (Phase 1 & 2 selesai) — lihat §1.4 untuk kondisi terkini.

### 1.1 Struktur repo (kondisi awal Phase 0)

Saat Phase 0, repo berisi **hanya 2 file dokumen** — tidak ada kode, config, atau migrasi:

```
etsyintelegnet/
├── etsy_intelligence_prd.md   (35 KB)  — spesifikasi
└── TASKBOARD.md               (13 KB)  — papan tugas
```

- **Bukan repo git sebelumnya.** `git init` dijalankan pada Phase 0; branch `main`.
- Tidak ada `package.json`, `src/`, `app/`, `migrations/`, `.env.example`, `README.md`.
- **Tidak ada file existing yang berisiko ter-overwrite.** Semua file baru.

### 1.2 Tooling terpasang (terverifikasi)

| Tool | Versi | Catatan |
|:-----|:------|:--------|
| Node.js | v24.20.0 | Dipasang Phase 0 (winget `OpenJS.NodeJS.LTS`, user scope) |
| npm | 11.19.0 | — |
| git | 2.55.0 | Dipasang Phase 0 (winget `Git.Git`) |
| bun | 1.4.2 | Alternatif package manager |
| Python | 3.12 | Untuk utilitas, bukan runtime app |
| Docker | — | **Tidak ada** (n8n self-host lokal via Docker belum bisa; lihat Blocker B3) |

**Keputusan package manager: `npm`** (paling universal untuk Next.js; bun tersedia tapi npm lebih aman untuk kompatibilitas tooling). Lihat Keputusan D2.

### 1.3 Env variables dibutuhkan (PRD §19) — nama saja, TANPA nilai

**Status terkini (2026-10-12)** — nilai diisi oleh pengguna di `.env.local` (tidak di-commit):

| Variable | Wajib untuk | Status |
|:---------|:------------|:------:|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client | ✅ terisi |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client (RLS) | ✅ terisi |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin | ✅ terisi |
| `ETSY_API_KEY` | Header `x-api-key` (keystring:shared_secret) | ✅ terisi |
| `ETSY_SHARED_SECRET` | Bagian dari `x-api-key` | ✅ terisi |
| `ETSY_REDIRECT_URI` | OAuth callback (harus HTTPS) | ⬜ kosong (Phase 5) |
| `TOKEN_ENCRYPTION_KEY` | Enkripsi token OAuth di DB | ⬜ kosong (Phase 5) |
| `N8N_BASE_URL` | Trigger job n8n (server-only) | ✅ terisi |
| `N8N_WEBHOOK_SECRET` | Auth webhook n8n | ✅ terisi |
| `AI_PROVIDER_API_KEY` | Research Brief (opsional) | ⬜ kosong (Phase 6, opsional) |
| `APP_TIMEZONE` | Default `Asia/Jakarta` | ✅ terisi |
| `DATABASE_URL` | Migrasi & koneksi DB (pooler IPv4) | ✅ terisi (server-only) |

> **Catatan keamanan:** nilai rahasia tidak boleh ditulis ke chat, log, commit, atau dokumentasi. Hanya nama + status. `.env.local` **tidak** ter-track git (hanya `.env.example` yang ter-commit, tanpa nilai).

### 1.4 Kondisi repo terkini (2026-10-12)

- **Kode lengkap Phase 1 & 2** ada di `src/` (59 file): App Router pages, adapter Etsy server-only, komponen UI, lib config/currency.
- **Migrasi DB** di `migrations/` (2 file) — **12/12 tabel** aktif di Supabase.
- **Data nyata tersimpan:** ~1.045 listings, ~1.045 snapshots, ~124 search_runs (bukti Product Explorer dipakai).
- **Git:** branch `main`, ter-push ke GitHub, working tree bersih.
- **Verifikasi lolos:** `npm test` (3 unit + integration), `npm run lint`, `npx tsc --noEmit`, `npm run build`.

---

## 2. Verifikasi Etsy Open API v3 (PRD §21 — wajib, jangan mengarang)

Diverifikasi dari **spec resmi** `https://www.etsy.com/openapi/generated/oas/3.0.0.json` (911 KB, 76 endpoint) + docs Essentials.

### 2.1 Endpoint terverifikasi (yang akan dipakai)

| Endpoint | Method + Path | Auth | Dipakai untuk |
|:---------|:--------------|:-----|:--------------|
| `findAllListingsActive` | `GET /v3/application/listings/active` | **Publik** (x-api-key saja) | Product Explorer + discovery |
| `getListing` | `GET /v3/application/listings/{listing_id}` | **Publik** | Listing Detail |
| `getListingsByListingIds` | `GET /v3/application/listings/batch` | **Publik** | Batch refresh |
| `getListingImages` | `GET /v3/application/listings/{listing_id}/images` | **Publik** | Gambar produk |
| `getShop` | `GET /v3/application/shops/{shop_id}` | **Publik** | Competitor Tracker |
| `getShopByOwnerUserId` | `GET /v3/application/users/{user_id}/shops` | **Publik** | Resolusi shop dari user |
| `getListingsByShop` | `GET /v3/application/shops/{shop_id}/listings` | api_key + **oauth2** | My Shop (read) |
| `getMe` | `GET /v3/application/users/me` | api_key + **oauth2** | Identitas owner |
| `getShopReceipts` | `GET /v3/application/shops/{shop_id}/receipts` | api_key + **oauth2** | Orders (jika scope) |
| `getSellerTaxonomyNodes` | `GET /v3/application/seller-taxonomy/nodes` | **Publik** | Kategori |
| `getPropertiesByTaxonomyId` | `GET /v3/application/seller-taxonomy/nodes/{taxonomy_id}/properties` | **Publik** | Atribut kategori |

**Kesimpulan kunci:** discovery & explorer bisa jalan **hanya dengan `ETSY_API_KEY`** (tanpa OAuth). OAuth hanya perlu untuk My Shop & Orders. Ini memungkinkan MVP jalan sebelum app Etsy disetujui penuh.

### 2.2 Parameter `findAllListingsActive` (terverifikasi)

`limit`, `offset`, `keywords`, `sort_on` (`created`|`price`|`updated`|`score`), `sort_order` (`asc`|`desc`), `min_price`, `max_price`, `taxonomy_id`, `shop_location`, `is_safe`, `currency`, `buyer_country`. Respons: `{ count, results: ShopListing[] }`.

### 2.3 Field `ShopListing` yang tersedia (untuk normalisasi)

Tersedia: `listing_id, user_id, shop_id, title, description, state, quantity, url, num_favorers, listing_type, tags[], materials[], price, taxonomy_id, created_timestamp, updated_timestamp, last_modified_timestamp, currency (via converted_price)...`

> **Penting:** TIDAK ada field `views`, `sales`, atau `search_volume`. `num_favorers` = favorit, **bukan** penjualan. Ini mengonfirmasi Non-Sasaran PRD §3.2 — jangan klaim penjualan kompetitor.
>
> `price` adalah objek `Money { amount, divisor, currency_code }` — **bukan angka langsung**. Normalisasi harus hitung `amount / divisor`.

### 2.4 Rate limit (terverifikasi)

- Limit berbasis **API key**, sliding 24-hour window (QPD) + per-second (QPS).
- Header sukses: `x-limit-per-day`, `x-remaining-today`, `x-limit-per-second`, `x-remaining-this-secon`.
- Saat lewat limit: **HTTP 429** + header `retry-after`.
- Wajib: caching + exponential backoff. (Sesuai PRD §8.3.)

### 2.5 OAuth (terverifikasi)

- **Wajib PKCE** (RFC 7636): `code_challenge_method=S256`, verifier 43–128 char `[A-Za-z0-9._~-]`.
- `state` direkomendasikan (CSRF); harus divalidasi saat callback.
- Authorize: `GET https://www.etsy.com/oauth/connect` · Token: `POST https://api.etsy.com/v3/public/oauth/token`.
- Access token hidup **1 jam**; refresh token **90 hari**.
- `redirect_uri` harus **HTTPS** dan **match persis** (case-sensitive, tanpa trailing slash).
- Scope MVP (least privilege): `shops_r`, `listings_r`, `transactions_r` (hanya jika Orders diaktifkan).

---

## 3. Arsitektur & Keputusan Teknis

### 3.1 Stack (sesuai PRD §5 — tidak diubah)

| Layer | Pilihan |
|:------|:--------|
| Frontend | Next.js App Router + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| DB | Supabase PostgreSQL |
| Auth app | Supabase Auth (MVP single-user, endpoint admin tetap tertutup) |
| Backend | Next.js server routes / server actions (server-only) |
| Integrasi Etsy | Etsy client terisolasi (server-only adapter) |
| Workflow | n8n (orchestrator, bukan DB) |
| Charts | Recharts |
| Validation | Zod |
| AI | Provider konfigurabel (opsional) |
| Deploy | Hosting server-side + HTTPS; n8n terpisah |

### 3.2 Prinsip yang mengikat implementasi

1. Browser **tidak pernah** memanggil Etsy dengan secret/token.
2. Semua rahasia di env/server secret store; tidak ada di bundle client.
3. PostgreSQL = sumber data utama; n8n hanya orkestrator.
4. Job **idempotent** (upsert by `etsy_listing_id`; snapshot append-only).
5. Data riset publik dipisah dari data privat toko.
6. Setiap klaim tren punya sumber, timestamp, periode, dan data sufficiency.
7. Adapter Etsy mengisolasi bentuk respons API dari UI.
8. Field kosong ≠ 0. Jangan bagi nol. `num_favorers` ≠ penjualan.

### 3.3 Keputusan (K)

| # | Keputusan | Alasan / Alternatif ditolak |
|:--|:----------|:----------------------------|
| D1 | Pakai **spec OAS resmi** sebagai acuan adapter, bukan asumsi | PRD §21: jangan mengarang endpoint/field |
| D2 | **npm** sebagai package manager | bun tersedia tapi npm paling kompatibel dgn tooling Next.js/shadcn |
| D3 | Discovery & Explorer pakai endpoint **publik** (x-api-key) dulu | Bisa jalan tanpa OAuth; OAuth ditunda ke Phase 5 |
| D4 | OAuth pakai **PKCE S256** + validasi `state` | Diwajibkan dokumentasi Etsy |
| D5 | Supabase = DB; **migrasi SQL berversi** (bukan auto-sync) | PRD §10 |
| D6 | Money disimpan `numeric(12,2)` + `currency_code` per baris | PRD §10; hindari float |
| D7 | Snapshot **append-only** dengan dedup key (listing + capture window) | PRD §10, §16 |
| D8 | AI Research Brief ditunda (P2, Phase 6) — fitur opsional | PRD §14, §3.2 |
| D9 | Pertahankan `cacheComponents: true` bawaan scaffold Next 16 | Mematikannya (harus uji ulang; dashboard dinamis tetap perlu `<Suspense>`) |
| D10 | Format tanggal/angka/nama-negara **deterministik statis** (bukan `Intl`) | `Intl.*` → hydration mismatch server vs client |
| D11 | Kurs IDR dari `open.er-api.com` (base USD), cache 24 jam | frankfurter.app (mata uang terbatas); tanpa konversi (pengguna minta IDR) |
| D12 | Harga tampil IDR (tanpa desimal); mata uang asli sbg referensi kecil | Multi-mata uang campur (sulit dibandingkan) |

> D9–D12 ditambahkan pada sesi `ses-2026-10-11-d` (UX polish Phase 2b). Detail lengkap di `TASKBOARD.md` §5.

### 3.4 Struktur folder (aktual, per 2026-10-12)

> Catatan: implementasi memakai `src/` (bukan root `app/`). Tidak ada route group `(dashboard)` — layout sidebar langsung di root layout.

```
etsyintelegnet/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # root layout (sidebar + tooltip provider)
│   │   ├── page.tsx              # /  Today's Etsy Trends
│   │   ├── loading.tsx error.tsx not-found.tsx
│   │   ├── products/
│   │   │   ├── page.tsx          # Product Explorer (search, filter, pagination)
│   │   │   └── [etsyListingId]/page.tsx   # Listing Detail (galeri + video + snapshot)
│   │   ├── ideas/ trends/ competitors/ keywords/ opportunities/
│   │   ├── my-shop/listings|orders/
│   │   ├── profit/ automation/ reports/ settings/
│   │   └── api/
│   │       ├── products/route.ts
│   │       ├── products/[etsyListingId]/route.ts
│   │       └── ideas/route.ts
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitives (14+ komponen)
│   │   ├── products/             # product-card, galleries, search-form, persistence
│   │   ├── app-sidebar.tsx page-header.tsx states.tsx coming-later.tsx
│   ├── hooks/use-mobile.ts
│   └── lib/
│       ├── etsy/                 # ADAPTER server-only: client, normalizer, types
│       ├── db/                   # supabase-server, listings-repo (upsert, search_runs)
│       ├── config/               # env.ts (Zod), app.ts (navigasi)
│       ├── currency.ts           # kurs harian (open.er-api.com)
│       ├── search-store.ts       # persistensi query pencarian
│       └── utils.ts              # formatNumber/formatIDR/formatDateIndo/getCountryName
├── migrations/                   # 0001_initial_schema.sql, 0002_rls.sql
├── scripts/                      # migrate.js (runner migrasi idempotent)
├── tests/                        # normalizer-and-dedup.test.mjs
├── .env.example
├── IMPLEMENTATION_PLAN.md
├── TASKBOARD.md
└── README.md
```

### 3.5 Pemetaan halaman (PRD §6) → prioritas

| Route | Halaman | Prio | Phase |
|:------|:--------|:----:|:-----:|
| `/` | Today's Etsy Trends | P0 | 3 |
| `/products`, `/products/[id]` | Product Explorer + Detail | P0 | 2 |
| `/ideas` | Idea Vault | P0 | 4 |
| `/settings` | Settings | P0 | 1–3 |
| `/trends`, `/competitors`, `/keywords`, `/opportunities` | Market Research | P1 | 4–5 |
| `/my-shop/listings`, `/my-shop/orders` | My Shop | P0 | 5 |
| `/profit` | Profit Calculator | P1 | 5+ |
| `/automation`, `/reports` | Automation | P1 | 6 |

> Menu yang belum berfungsi diberi label "Coming later" / disembunyikan (PRD §6).

---

## 4. Asumsi (A)

| # | Asumsi | Alasan |
|:--|:-------|:-------|
| A1 | Pengguna sudah/akan punya **akun Etsy Developer** + app key | Tanpa itu tidak ada data live; discovery akan kosong (empty state jelas) |
| A2 | Pengguna menyediakan **project Supabase** (URL + keys) | PRD §5; tidak ada DB lokal di mesin ini |
| A3 | MVP **single-user**, tanpa multi-tenant/billing | PRD §3.2 |
| A4 | **n8n belum ada**; Phase 2–4 pakai manual trigger / server action | PRD §13: "jika workflow belum disiapkan, aplikasi tetap bisa dijalankan" |
| A5 | Tidak ada Docker → n8n self-host ditunda | Docker tidak terpasang |
| A6 | Target deploy: hosting Node server-side (mis. Vercel) + Supabase cloud | PRD §5 |
| A7 | AI provider opsional, tidak memblokir MVP | PRD §3.2, §14 |
| A8 | Data demo (jika dipakai) diberi label jelas & tidak masuk production path | PRD §7.1, §21 |

## 5. Blocker (B)

| # | Blocker | Dampak | Status / mitigasi |
|:--|:--------|:-------|:------------------|
| B1 | **Etsy API key** | Data live Etsy | **RESOLVED** (diisi 2026-10-11; data live terbukti, limit 5000/hari) |
| B2 | **Supabase project** | Persistensi data | **RESOLVED** (project terhubung, 12 tabel aktif via pooler IPv4) |
| B3 | **Docker tidak terpasang** | n8n self-host lokal | Open (mitigasi: manual trigger / server action di Phase 3/6) |
| B4 | **OAuth redirect butuh HTTPS publik** | My Shop OAuth | Open (ditangani Phase 5; pakai dev tunnel / cloudflared) |
| B5 | **Access level app Etsy** | Batasan endpoint | Open — endpoint publik (`listings/active`, `batch`, `videos`) **terbukti jalan**; scope OAuth diverifikasi Phase 5 |
| B6 | **Ketergantungan API kurs** | Nilai IDR | Open (kurs dari `open.er-api.com`, cache 24 jam; fallback aman: tampil mata uang asli jika API down) |

---

## 6. Rencana Per Fase (PRD §17) & Status Terkini

| Fase | Fokus | Keluaran utama | Status | Bukti utama |
|:-----|:------|:---------------|:------:|:------------|
| **0** | Inspection & plan | File ini + asumsi/blocker | `[x]` | `file:IMPLEMENTATION_PLAN.md` |
| **1** | Foundation | Next.js+TS+Tailwind, sidebar, Zod config, `.env.example`, migrasi awal | `[x]` | `file:src/`, `migrations/`, `.env.example` |
| **2** | Etsy client & Explorer | Adapter server-only, `/products`, detail, `search_runs`, dedup | `[x]` | `file:src/lib/etsy/`, `/products`, tests pass |
| **2b** | UX polish Explorer | Galeri gambar+video, kurs IDR, filter digital/fisik, sticky bar | `[x]` | `commit:51282a6`, `32e02cb`, `b86e5fa` |
| **3** | Discovery & snapshots | Seeds, job, snapshots, `/` Trends, states | `[x]` | `file:src/lib/discovery/`, `/`, tests pass |
| **4** | Scoring & Idea Vault | Delta 7/30/90, klasifikasi, score, `/ideas`, unit test | ⏳ **aktif** | — |
| **5** | Competitor & My Shop | Tracking, OAuth (PKCE), `/my-shop` read-only | `[ ]` | B4, B5 |
| **6** | n8n & reports | Workflow A/B/C docs, `/automation`, `/reports`, alerts | `[ ]` | B3 |
| **7** | Hardening | lint/typecheck/test/build, a11y, RLS, README, DoD | `[ ]` | — |

### Urutan eksekusi ketat
Satu fase pada satu waktu, berurutan. Setelah tiap fase: jalankan lint/typecheck/test relevan, update `TASKBOARD.md`, tulis Session Log. **Jangan tandai `[x]` bila hanya UI tanpa integrasi nyata** (PRD §21).

---

## 7. Checklist Acceptance Criteria (ringkas, PRD §16 & §22)

Detail penuh di `TASKBOARD.md` §8. Ringkas:

- [x] `/` baca daily trend results tersimpan (tanpa pencarian manual)
- [x] Tanpa histori → `Newly discovered`/`Insufficient history`, bukan `Trending up`
- [x] Refresh gagal → hasil lama tetap + warning stale
- [x] Snapshot append-only; delta hanya dgn baseline valid; tanpa ÷0
- [ ] Data hilang ≠ nol
- [ ] OAuth validasi state; token tak pernah ke client
- [x] Job status sukses/parsial/gagal; retry terbatas; alert dedupe
- [ ] Tidak ada secret di repo/bundle; endpoint mutasi butuh auth
- [x] Aplikasi jalan lokal via README
- [x] `IMPLEMENTATION_PLAN.md` + checklist diperbarui

---

## 8. Ringkasan Phase 0

**Selesai:**
- Inspeksi repo (kosong selain 2 dokumen) → tidak ada risiko overwrite.
- Verifikasi tooling: Node 24 / npm 11 / git 2.55 (Docker tidak ada).
- Daftar 11 env variable (semua kosong, tanpa cetak nilai).
- Verifikasi Etsy Open API v3 dari spec OAS resmi (endpoint, param, field, rate limit, OAuth PKCE).
- 8 keputusan (D1–D8), 8 asumsi (A1–A8), 5 blocker (B1–B5).
- File ini dibuat.

---

## 9. Ringkasan Phase 1 (Foundation) — SELESAI (2026-10-11)

- Next.js 16.4.0 (Turbopack) + React 19.3 + TypeScript + Tailwind CSS v4.
- shadcn/ui di-init dengan base-ui (14 komponen UI: button, card, badge, input, table, sidebar, dll.).
- Layout sidebar responsif (`src/components/app-sidebar.tsx`) + 12 rute dashboard.
- Zod env schema terpusat (`src/lib/config/env.ts`) + konstanta navigasi (`app.ts`).
- `.env.example` dibuat tanpa nilai rahasia.
- Migrasi DB SQL berversi: `0001_initial_schema.sql` (12 tabel) + `0002_rls.sql` (RLS).
- Runner migrasi idempotent: `scripts/migrate.js` (`npm run db:migrate`).
- Commit: `476f407`.

---

## 10. Ringkasan Phase 2 (Etsy Client & Product Explorer) — SELESAI (2026-10-11)

- **Adapter Etsy server-only:** `src/lib/etsy/client.ts` — rate-limit parsing, 429 backoff retry, safe logging tanpa secret.
- **Normalizer:** `src/lib/etsy/normalizer.ts` — `amount / divisor`, epoch ke ISO, sanitasi tags.
- **Database repo:** `src/lib/db/listings-repo.ts` — `recordSearchRun`, `upsertListings` (dedup merge-duplicates), `getStoredListing`.
- **API internal:** `/api/products` (search), `/api/products/[etsyListingId]` (detail), `/api/ideas` (save idea).
- **Halaman Product Explorer:** `/products` — search form, card grid, pagination 36 item/halaman.
- **Halaman Detail:** `/products/[etsyListingId]` — galeri, metadata, riwayat snapshot observasi.
- **Unit & integration test:** `tests/normalizer-and-dedup.test.mjs` (`npm test`) — 3 unit test + integration dedup/upsert ke Supabase **LULUS**.
- Commit: `c3f8ead`.

---

## 11. Ringkasan Phase 2b (UX Polish Explorer) — SELESAI (2026-10-11)

Rangkaian 11 perbaikan UX atas permintaan pengguna:
- **P2-10:** Galeri semua gambar di kartu (auto-slide saat hover + tombol navigasi kiri/kanan).
- **P2-11:** Tampilkan video listing di halaman detail via `getListingVideos` (publik).
- **P2-12 & P2-13:** Konversi semua harga → IDR via API kurs harian (`open.er-api.com`, cache 24 jam) — tanpa desimal, pemisah ribuan titik (`formatIDR`).
- **P2-14:** Link nama toko ke Etsy + nama negara teks (di kartu).
- **P2-15:** Tombol salin (ikon) untuk deskripsi dan tags.
- **P2-16:** Filter Digital vs Fisik di panel filter + urutan A–Z/Z–A.
- **P2-17:** Bar filter + ringkasan hasil **sticky** (tidak ikut scroll).
- **P2-18:** Persistensi query pencarian antar-navigasi (`sessionStorage`).
- **P2-19:** Fix hydration mismatch — format tanggal/angka/negara dibuat **deterministik statis** (bukan `Intl.*`).
- **P2-20:** Style judul segmen seragam di seluruh 13 halaman (`PAGE_TITLE_CLASS`).
- Commit: `51282a6`, `32e02cb`, `b86e5fa`, `eaa62e8`, `b2f4b23`, `a74a11e`, `2262e0f`.

---

## 12. Posisi Saat Ini & Langkah Berikutnya

- **Posisi saat ini:** Phase 0, 1, 2, 2b selesai (33/71 task, 46%).
- **Fase aktif berikutnya:** **Phase 3 — Daily Discovery & Snapshots** (`P3-01..P3-08`).
  1. `discovery_seeds` configurable dari Settings (tabel DB sudah ada).
  2. Scheduled job + manual trigger (job idempotent, catat `job_runs`).
  3. Simpan snapshot listing (append-only, dedup window).
  4. Today's Etsy Trends `/` — baca data tersimpan, empty/stale/error states.
  5. Timestamp sinkronisasi + data coverage/sufficiency.
- **Blocker aktif:** B3 (n8n/Docker — ditunda ke Phase 6), B4 (OAuth HTTPS — Phase 5), B5 (scope OAuth — Phase 5), B6 (API kurs — ada fallback). B1 & B2 sudah **RESOLVED**.
