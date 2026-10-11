# IMPLEMENTATION_PLAN — Etsy Intelligence

> Dibuat pada Phase 0 (Repository Inspection & Plan) sesuai PRD §17.
> Sumber spesifikasi: `etsy_intelligence_prd.md` v1.0 · Taskboard: `TASKBOARD.md` v1.0.

- **Tanggal inspeksi:** 2026-10-11
- **Sesi:** ses-2026-10-11-a
- **Zona waktu:** Asia/Jakarta (WIB, UTC+7)
- **Status:** Plan selesai. Belum ada kode aplikasi (repo kosong selain dokumen).

---

## 1. Hasil Inspeksi Repo (PRD §17 Phase 0.1–0.3)

### 1.1 Struktur repo

Repo berisi **hanya 2 file dokumen** — tidak ada kode, config, atau migrasi:

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

Semua **belum diset** (kosong). Tidak ada `.env*` di repo.

| Variable | Wajib untuk | Status |
|:---------|:------------|:------:|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client | ❌ kosong |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client (RLS) | ❌ kosong |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin | ❌ kosong |
| `ETSY_API_KEY` | Header `x-api-key` (keystring:shared_secret) | ❌ kosong |
| `ETSY_SHARED_SECRET` | Bagian dari `x-api-key` | ❌ kosong |
| `ETSY_REDIRECT_URI` | OAuth callback (harus HTTPS) | ❌ kosong |
| `TOKEN_ENCRYPTION_KEY` | Enkripsi token OAuth di DB | ❌ kosong |
| `N8N_BASE_URL` | Trigger job n8n (server-only) | ❌ kosong |
| `N8N_WEBHOOK_SECRET` | Auth webhook n8n | ❌ kosong |
| `AI_PROVIDER_API_KEY` | Research Brief (opsional) | ❌ kosong |
| `APP_TIMEZONE` | Default `Asia/Jakarta` | ❌ kosong (pakai default kode) |

> **Catatan keamanan:** nilai rahasia tidak boleh ditulis ke chat, log, commit, atau dokumentasi. Hanya nama + status.

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

### 3.4 Struktur folder target (Phase 1, PRD §17 P1-08)

```
etsyintelegnet/
├── app/                      # Next.js App Router
│   ├── (dashboard)/
│   │   ├── page.tsx          # / Today's Etsy Trends
│   │   ├── products/         # Product Explorer + [etsyListingId]
│   │   ├── ideas/            # Idea Vault
│   │   ├── trends/ competitors/ keywords/ opportunities/
│   │   ├── my-shop/          # listings, orders
│   │   ├── profit/ automation/ reports/ settings/
│   ├── api/                  # route handlers internal
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   └── ...                   # feature components
├── lib/
│   ├── etsy/                 # ADAPTER server-only (isolasi API)
│   ├── db/                   # supabase client (server/client split)
│   ├── domain/               # types, normalisasi, scoring
│   ├── config/               # config terpusat + Zod env schema
│   └── utils/
├── migrations/               # SQL berversi (PRD §10)
├── tests/                    # unit + integration
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
| B1 | **Etsy API key belum ada** (`ETSY_API_KEY` kosong) | Tidak bisa panggil data live; Phase 2 hanya bisa diuji dengan mock | Mitigasi: adapter + mock tests dulu (PRD §18: "jangan andalkan live credentials di CI") |
| B2 | **Supabase project belum ada** | Tidak bisa jalankan migrasi nyata | Mitigasi: tulis migrasi SQL berversi; jalankan saat kredensial tersedia |
| B3 | **Docker tidak terpasang** | n8n self-host lokal belum bisa | Mitigasi: dokumentasi setup n8n + manual trigger (Phase 6) |
| B4 | **OAuth redirect butuh HTTPS publik** | My Shop OAuth tak bisa dites lokal murni | Mitigasi: dev tunnel (mis. cloudflared) didokumentasikan di Phase 5 |
| B5 | Belum tahu **access level** app Etsy yang disetujui | Bisa membatasi endpoint | Mitigasi: verifikasi di Phase 2/5 sebelum mengklaim fitur |

---

## 6. Rencana Per Fase (PRD §17)

| Fase | Fokus | Keluaran utama | Blocker terkait |
|:-----|:------|:---------------|:----------------|
| **0** | Inspection & plan | File ini + asumsi/blocker | — |
| **1** | Foundation | Next.js+TS+Tailwind, sidebar, Zod config, `.env.example`, migrasi awal | B2 |
| **2** | Etsy client & Explorer | Adapter server-only, `/products`, detail, `search_runs`, dedup | B1 |
| **3** | Discovery & snapshots | Seeds, job, snapshots, `/` Trends, states | B1, B4 |
| **4** | Scoring & Idea Vault | Delta 7/30/90, klasifikasi, score, `/ideas`, unit test | — |
| **5** | Competitor & My Shop | Tracking, OAuth (PKCE), `/my-shop` read-only | B4, B5 |
| **6** | n8n & reports | Workflow A/B/C docs, `/automation`, `/reports`, alerts | B3 |
| **7** | Hardening | lint/typecheck/test/build, a11y, RLS, README, DoD | — |

### Urutan eksekusi ketat
Satu fase pada satu waktu, berurutan. Setelah tiap fase: jalankan lint/typecheck/test relevan, update `TASKBOARD.md`, tulis Session Log. **Jangan tandai `[x]` bila hanya UI tanpa integrasi nyata** (PRD §21).

---

## 7. Checklist Acceptance Criteria (ringkas, PRD §16 & §22)

Detail penuh di `TASKBOARD.md` §8. Ringkas:

- [ ] `/` baca daily trend results tersimpan (tanpa pencarian manual)
- [ ] Tanpa histori → `Newly discovered`/`Insufficient history`, bukan `Trending up`
- [ ] Refresh gagal → hasil lama tetap + warning stale
- [ ] Snapshot append-only; delta hanya dgn baseline valid; tanpa ÷0
- [ ] Data hilang ≠ nol
- [ ] OAuth validasi state; token tak pernah ke client
- [ ] Job status sukses/parsial/gagal; retry terbatas; alert dedupe
- [ ] Tidak ada secret di repo/bundle; endpoint mutasi butuh auth
- [ ] Aplikasi jalan lokal via README
- [ ] `IMPLEMENTATION_PLAN.md` + checklist diperbarui

---

## 8. Ringkasan Phase 0

**Selesai:**
- Inspeksi repo (kosong selain 2 dokumen) → tidak ada risiko overwrite.
- Verifikasi tooling: Node 24 / npm 11 / git 2.55 (Docker tidak ada).
- Daftar 11 env variable (semua kosong, tanpa cetak nilai).
- Verifikasi Etsy Open API v3 dari spec OAS resmi (endpoint, param, field, rate limit, OAuth PKCE).
- 8 keputusan (D1–D8), 8 asumsi (A1–A8), 5 blocker (B1–B5).
- File ini dibuat.

**Perintah dijalankan:** `git init`, inspeksi file/env, unduh & parsing OAS Etsy (via node).
**Hasil:** Plan siap. Tidak ada kode aplikasi dihasilkan (sesuai lingkup Phase 0).

**Fase berikutnya:** Phase 1 — Foundation (scaffold Next.js + TS + Tailwind + sidebar + Zod config + `.env.example` + migrasi awal).

**Keterbatasan yang tersisa:** B1 (Etsy key), B2 (Supabase), B3 (Docker/n8n), B4 (HTTPS OAuth), B5 (access level app) — semuanya tidak memblokir Phase 1.
