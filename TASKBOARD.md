# TASKBOARD — Etsy Intelligence

> **Tujuan file ini:** mengunci kemajuan antar sesi coding agent yang berbeda.
> Setiap sesi **WAJIB** membaca file ini lebih dulu, mengklaim task sebelum
> mengerjakan, dan memperbarui status di akhir sesi. Jangan hapus riwayat.

- **Sumber spesifikasi:** `etsy_intelligence_prd.md` (Versi 1.0)
- **Versi taskboard:** 1.1
- **Terakhir diperbarui:** `2026-10-11` oleh `ses-2026-10-11-d` (UX polish Product Explorer)
- **Zona waktu kerja:** Asia/Jakarta (WIB)

---

## 0. CARA PAKAI (Session Protocol) — BACA INI DULU

Urutan wajib untuk setiap sesi baru:

1. **Baca** `etsy_intelligence_prd.md` dan file ini sepenuhnya.
2. **Cek Lock** (bagian 2). Jika ada task `[~] IN PROGRESS` milik sesi lain
   yang belum kedaluwarsa, jangan sentuh task itu.
3. **Pilih fase aktif** (bagian 4). Kerjakan **satu fase pada satu waktu**,
   berurutan (Phase 0 → 7) kecuali fase sebelumnya sudah `[x]`.
4. **Klaim task:** ubah `[ ]` → `[~]` **dan** isi kolom `Owner` + `Locked at`.
5. **Kerjakan.** Setelah tiap perubahan besar, jalankan lint/typecheck/test
   yang relevan.
6. **Tutup task:** ubah `[~]` → `[x]` (atau `[!] BLOCKED` bila macet),
   kosongkan lock, catat bukti (commit/PR/file/test).
7. **Tulis entri di Session Log** (bagian 7) dan perbarui **Progress Counter**
   (bagian 6) serta header "Terakhir diperbarui".
8. **Jangan** menandai task `[x]` bila hanya UI tanpa integrasi nyata
   (lihat PRD §21).

### Aturan keras (dari PRD §21)

- Jangan mengarang endpoint/field API/OAuth scope — verifikasi ke dokumentasi Etsy Open API v3.
- Jangan menaruh secret di frontend/log/dokumentasi/commit.
- Jangan overwrite/hapus file atau data pengguna yang sudah ada tanpa alasan.
- Jangan memasukkan demo data ke production path.
- Pilih opsi paling aman bila ambigu, **dokumentasikan asumsi** di bagian 5.
- Jangan menyatakan fitur selesai jika hanya UI tanpa integrasi nyata.

---

## 1. LEGENDA STATUS

| Simbol | Status | Arti |
|:------:|:-------|:-----|
| `[ ]` | TODO | Belum dikerjakan |
| `[~]` | IN PROGRESS | Sedang dikerjakan (wajib ada Owner + Lock) |
| `[x]` | DONE | Selesai + bukti terverifikasi |
| `[!]` | BLOCKED | Terhambat; wajib ada alasan di kolom Bukti/Catatan |
| `[-]` | SKIPPED | Sengaja dilewati; wajib ada alasan |

Prioritas mengikuti PRD: **P0** (wajib MVP) → **P1** → **P2**.

---

## 2. LOCK (Kunci Anti-Konflik)

Isi baris lock saat mengerjakan agar sesi lain tidak tabrakan. Satu baris per
task aktif. **Kedaluwarsa default: 24 jam** — setelah itu boleh diambil alih
(catat alasan takeover).

| Task ID | Owner (session-id) | Locked at | Expires | Catatan |
|:--------|:-------------------|:----------|:--------|:--------|
| _(contoh)_ P0-01 | ses-2026-01-01-a | 2026-01-01 09:00 | 2026-01-02 09:00 | inspeksi repo |

> Saat menutup sesi: **hapus baris lock milik Anda** agar sesi berikutnya bebas.

---

## 3. RINGKASAN FASE

| Fase | Nama | Fokus | Status | Bukti utama |
|:-----|:-----|:------|:------:|:------------|
| 0 | Repository inspection & plan | `IMPLEMENTATION_PLAN.md`, asumsi, blocker | `[x]` | `file:IMPLEMENTATION_PLAN.md` |
| 1 | Foundation | Next.js/TS/Tailwind, layout sidebar, schema, `.env.example`, migrasi awal | `[x]` | `file:src/`, `migrations/`, `.env.example` |
| 2 | Etsy API client & Product Explorer | adapter server-only, search, dedup/upsert, listing detail | `[x]` | `file:src/lib/etsy/`, `/products`, tests pass |
| 2b | UX polish Product Explorer | galeri gambar+video, kurs IDR, filter, sticky bar, fix hydration | `[x]` | `commit:51282a6`, `32e02cb`, `b86e5fa` |
| 3 | Daily discovery & snapshots | seeds, scheduled job, snapshot, Today's Etsy Trends | `[ ]` | |
| 4 | Trend scoring & Idea Vault | delta 7/30/90, classification, score, Idea Vault, unit test | `[ ]` | |
| 5 | Competitor Tracker & My Shop | tracking toko/listing, OAuth read-only | `[ ]` | |
| 6 | n8n & reports | workflow A/B/C, job status, alerts dedup, report | `[ ]` | |
| 7 | Hardening | lint/typecheck/test/build, a11y, RLS, docs, DoD | `[ ]` | |

**Fase aktif saat ini:** `Phase 3` ← perbarui tiap sesi.

---

## 4. DETAIL TASK PER FASE

Format kolom Bukti: `commit:<sha>` / `file:<path>` / `test:<nama>` / `note:<teks>`.

### Phase 0 — Repository Inspection & Plan  `[x]`

| ID | Task | Prio | Status | Owner | Bukti / Catatan |
|:---|:-----|:----:|:------:|:------|:----------------|
| P0-01 | Inspeksi struktur repo & package manager | P0 | `[x]` | ses-2026-10-11-a | note: repo kosong (2 dok), npm dipilih (Node 24/npm 11/git 2.55) |
| P0-02 | Identifikasi file yang sudah ada (jangan overwrite) | P0 | `[x]` | ses-2026-10-11-a | note: hanya PRD + TASKBOARD; tanpa risiko overwrite |
| P0-03 | Daftar env variables dibutuhkan (tanpa cetak nilai) | P0 | `[x]` | ses-2026-10-11-a | file:IMPLEMENTATION_PLAN.md §1.3 (11 var, semua kosong) |
| P0-04 | Buat `IMPLEMENTATION_PLAN.md` | P0 | `[x]` | ses-2026-10-11-a | file:IMPLEMENTATION_PLAN.md |
| P0-05 | Laporkan asumsi & blocker sebelum perubahan besar | P0 | `[x]` | ses-2026-10-11-a | file:IMPLEMENTATION_PLAN.md §4-5 (A1-A8, B1-B5) |

### Phase 1 — Foundation  `[x]`

| ID | Task | Prio | Status | Owner | Bukti / Catatan |
|:---|:-----|:----:|:------:|:------|:----------------|
| P1-01 | Setup/validasi Next.js App Router + TypeScript | P0 | `[x]` | ses-2026-10-11-b | Next.js 16.4.0 + React 19.3 + TS; `npm run build` OK |
| P1-02 | Setup Tailwind CSS + UI primitives (shadcn/ui) | P0 | `[x]` | ses-2026-10-11-b | Tailwind v4 + shadcn (14 komponen ui) |
| P1-03 | Layout sidebar + routing (PRD §6) | P0 | `[x]` | ses-2026-10-11-b | `file:src/components/app-sidebar.tsx`; 12 route render 200 |
| P1-04 | Loading/error/empty state primitives | P0 | `[x]` | ses-2026-10-11-b | `loading.tsx`, `error.tsx`, `not-found.tsx`, `states.tsx` |
| P1-05 | Schema validation (Zod) & config terpusat | P0 | `[x]` | ses-2026-10-11-b | `file:src/lib/config/env.ts` + `app.ts` (Zod v4) |
| P1-06 | `.env.example` tanpa secret (PRD §19) | P0 | `[x]` | ses-2026-10-11-b | `file:.env.example` (11 var, tanpa nilai) |
| P1-07 | Migrasi database awal (PRD §10) | P0 | `[x]` | ses-2026-10-11-b | `migrations/0001_initial_schema.sql`, `0002_rls.sql` (12 tabel) |
| P1-08 | Struktur folder terdokumentasi | P1 | `[x]` | ses-2026-10-11-b | `file:README.md` |

### Phase 2 — Etsy API Client & Product Explorer  `[x]`

| ID | Task | Prio | Status | Owner | Bukti / Catatan |
|:---|:-----|:----:|:------:|:------|:----------------|
| P2-01 | Etsy adapter **server-only** (isolasi respons API) | P0 | `[x]` | ses-2026-10-11-c | `file:src/lib/etsy/client.ts` (`server-only`, safe headers/errors) |
| P2-02 | Endpoint pencarian sesuai API access aktual | P0 | `[x]` | ses-2026-10-11-c | `findAllListingsActive` (publik) di `client.ts` & `/api/products` |
| P2-03 | Normalisasi payload → model internal | P0 | `[x]` | ses-2026-10-11-c | `file:src/lib/etsy/normalizer.ts` (amount/divisor, ISO time, tags) |
| P2-04 | Pagination + batas jumlah + error handling | P0 | `[x]` | ses-2026-10-11-c | Pagination 24/page, 429 backoff retry, limits 1-100 |
| P2-05 | Logging aman (tanpa secret/token) | P0 | `[x]` | ses-2026-10-11-c | `client.ts` log endpoint/status/duration tanpa rahasia |
| P2-06 | Product Explorer `/products` (PRD §7.2) | P0 | `[x]` | ses-2026-10-11-c | `file:src/app/products/page.tsx`, search form, cards, pagination |
| P2-07 | Listing Detail `/products/[etsyListingId]` (PRD §7.3) | P0 | `[x]` | ses-2026-10-11-c | `file:src/app/products/[etsyListingId]/page.tsx`, gallery, snapshots |
| P2-08 | Catat `search_runs` (query/filter/time) | P0 | `[x]` | ses-2026-10-11-c | `file:src/lib/db/listings-repo.ts` (terekam di DB tabel `search_runs`) |
| P2-09 | Uji dedup/upsert berdasarkan Etsy listing ID | P0 | `[x]` | ses-2026-10-11-c | `test:normalizer-and-dedup.test.mjs` (merge-duplicate lolos) |

#### Phase 2 — UX Polish lanjutan (sesi d/e/f)  `[x]`

| ID | Task | Prio | Status | Owner | Bukti / Catatan |
|:---|:-----|:----:|:------:|:------|:----------------|
| P2-10 | Galeri semua gambar di **kartu** (auto-slide + tombol kiri/kanan) | P1 | `[x]` | ses-2026-10-11-d | `file:src/components/products/card-image-gallery.tsx`; `commit:51282a6` |
| P2-11 | Tampilkan **video** listing di halaman detail | P1 | `[x]` | ses-2026-10-11-d | `getListingVideos` (publik); `commit:32e02cb` |
| P2-12 | Konversi **semua harga → IDR** via API kurs harian | P1 | `[x]` | ses-2026-10-11-d | `file:src/lib/currency.ts` (open.er-api.com, cache 24 jam); `commit:51282a6` |
| P2-13 | Format harga: tanpa desimal + pemisah ribuan titik | P1 | `[x]` | ses-2026-10-11-d | `formatIDR()` di `src/lib/utils.ts` |
| P2-14 | Link nama toko → halaman toko Etsy + badge negara (teks) | P1 | `[x]` | ses-2026-10-11-d | `commit:b2f4b23`, `eaa62e8` |
| P2-15 | Tombol salin (ikon) untuk deskripsi & tags | P2 | `[x]` | ses-2026-10-11-d | `file:src/components/ui/copy-button.tsx` |
| P2-16 | Filter Digital vs Fisik + urutan A–Z/Z–A | P1 | `[x]` | ses-2026-10-11-d | `product-search-form.tsx`; `commit:a74a11e` |
| P2-17 | Bar filter + ringkasan hasil **sticky** (tidak ikut scroll) | P1 | `[x]` | ses-2026-10-11-d | `products/page.tsx`; `commit:eaa62e8` |
| P2-18 | Persistensi query pencarian antar-navigasi | P1 | `[x]` | ses-2026-10-11-d | `file:src/lib/search-store.ts`; `commit:a999f5b` |
| P2-19 | **Fix hydration mismatch** (format tanggal/angka/negara deterministik) | P0 | `[x]` | ses-2026-10-11-d | `src/lib/utils.ts` (peta statis, bukan `Intl`); `commit:b86e5fa` |
| P2-20 | Satukan style judul semua segmen (`PAGE_TITLE_CLASS`) | P2 | `[x]` | ses-2026-10-11-d | `file:src/components/page-header.tsx`; `commit:2262e0f` |

### Phase 3 — Daily Discovery & Snapshots  `[ ]`

| ID | Task | Prio | Status | Owner | Bukti / Catatan |
|:---|:-----|:----:|:------:|:------|:----------------|
| P3-01 | `discovery_seeds` configurable (dari Settings) | P0 | `[ ]` | | |
| P3-02 | Scheduled job + manual trigger (job idempotent) | P0 | `[ ]` | | |
| P3-03 | Simpan `listing_snapshots` (tanpa overwrite) | P0 | `[ ]` | | |
| P3-04 | Simpan `job_runs` (status sukses/parsial/gagal) | P0 | `[ ]` | | |
| P3-05 | Today's Etsy Trends `/` (PRD §7.1) | P0 | `[ ]` | | |
| P3-06 | Empty / stale / error / rate-limit states | P0 | `[ ]` | | |
| P3-07 | Tampilkan timestamp + data coverage/sufficiency | P0 | `[ ]` | | |
| P3-08 | Partial success: 1 keyword gagal ≠ hapus hasil lain | P0 | `[ ]` | | |

### Phase 4 — Trend Scoring & Idea Vault  `[ ]`

| ID | Task | Prio | Status | Owner | Bukti / Catatan |
|:---|:-----|:----:|:------:|:------|:----------------|
| P4-01 | Delta 7/30/90 hari (baseline valid, tanpa ÷0) | P0 | `[ ]` | | |
| P4-02 | Classification: emerging/accelerating/established | P0 | `[ ]` | | |
| P4-03 | Score + `score_breakdown` + coverage komponen | P0 | `[ ]` | | |
| P4-04 | Confidence/data sufficiency (Low/Medium/High) | P0 | `[ ]` | | |
| P4-05 | Simpan `daily_trend_results` (reproducible) | P0 | `[ ]` | | |
| P4-06 | Idea Vault `/ideas` + save/update status (PRD §7.5) | P0 | `[ ]` | | |
| P4-07 | Unit test: score w/ komponen hilang, delta nol/null, klasifikasi | P0 | `[ ]` | | |
| P4-08 | Unit test: dedup alert, batas timezone/date range | P1 | `[ ]` | | |

### Phase 5 — Competitor Tracker & My Shop  `[ ]`

| ID | Task | Prio | Status | Owner | Bukti / Catatan |
|:---|:-----|:----:|:------:|:------|:----------------|
| P5-01 | Tracked shops/listing (tambah/hapus) | P1 | `[ ]` | | |
| P5-02 | Competitor Tracker `/competitors` (PRD §7.4) | P1 | `[ ]` | | |
| P5-03 | Tampilkan jumlah listing terjaring (bukan asumsi penuh) | P1 | `[ ]` | | |
| P5-04 | OAuth Etsy (state/PKCE/redirect sesuai docs) | P0 | `[ ]` | | |
| P5-05 | Token refresh + revoke aman (terenkripsi, server-only) | P0 | `[ ]` | | |
| P5-06 | My Shop read-only `/my-shop/listings` (+orders jika scope ada) | P0 | `[ ]` | | |
| P5-07 | Pisahkan data publik vs data privat toko | P0 | `[ ]` | | |
| P5-08 | State OAuth disconnected/expired + CTA Connect | P0 | `[ ]` | | |

### Phase 6 — n8n & Reports  `[ ]`

| ID | Task | Prio | Status | Owner | Bukti / Catatan |
|:---|:-----|:----:|:------:|:------|:----------------|
| P6-01 | Workflow A `daily-discovery-sync` (export/docs) | P1 | `[ ]` | | |
| P6-02 | Workflow B `calculate-trends-and-alerts` | P1 | `[ ]` | | |
| P6-03 | Workflow C `weekly-research-brief` (+ AI opsional) | P1 | `[ ]` | | |
| P6-04 | Research Workflows `/automation` (status job) | P1 | `[ ]` | | |
| P6-05 | Alerts & Reports `/reports` (riwayat laporan) | P1 | `[ ]` | | |
| P6-06 | Alert dedupe key + notifikasi toggle | P1 | `[ ]` | | |
| P6-07 | Retry manual terbatas (hanya job idempotent) | P1 | `[ ]` | | |
| P6-08 | AI Research Brief sesuai output schema (PRD §14) | P2 | `[ ]` | | |

### Phase 7 — Hardening  `[ ]`

| ID | Task | Prio | Status | Owner | Bukti / Catatan |
|:---|:-----|:----:|:------:|:------|:----------------|
| P7-01 | Jalankan lint, typecheck, unit test, build | P0 | `[ ]` | | |
| P7-02 | Cek aksesibilitas & responsivitas | P1 | `[ ]` | | |
| P7-03 | Cek RLS, logging, secrets, rate limit | P0 | `[ ]` | | |
| P7-04 | Dokumentasi deployment, env, OAuth callback, setup n8n | P0 | `[ ]` | | |
| P7-05 | Verifikasi seluruh acceptance criteria (bagian 8) | P0 | `[ ]` | | |
| P7-06 | README final (setup, migration, OAuth, n8n, test, deploy) | P0 | `[ ]` | | |

---

## 5. ASUMSI, KEPUTUSAN & BLOCKER

> Tambahkan entri baru; jangan hapus. Format: tanggal — sesi — isi.

### Asumsi
| # | Tanggal | Sesi | Asumsi | Alasan |
|:--|:--------|:-----|:-------|:-------|
| A1 | 2026-10-11 | ses-2026-10-11-a | Pengguna punya/akan punya akun Etsy Developer + app key | Tanpa itu tak ada data live; discovery kosong (empty state jelas) |
| A2 | 2026-10-11 | ses-2026-10-11-a | Pengguna menyediakan project Supabase (URL + keys) | PRD §5; tak ada DB lokal di mesin |
| A3 | 2026-10-11 | ses-2026-10-11-a | MVP single-user, tanpa multi-tenant/billing | PRD §3.2 |
| A4 | 2026-10-11 | ses-2026-10-11-a | n8n belum ada; Phase 2-4 pakai manual trigger/server action | PRD §13 |
| A5 | 2026-10-11 | ses-2026-10-11-a | Docker tidak ada → n8n self-host ditunda | Docker tidak terpasang |
| A6 | 2026-10-11 | ses-2026-10-11-a | Deploy target: hosting Node server-side + Supabase cloud | PRD §5 |
| A7 | 2026-10-11 | ses-2026-10-11-a | AI provider opsional, tidak memblokir MVP | PRD §3.2, §14 |
| A8 | 2026-10-11 | ses-2026-10-11-a | Data demo (jika dipakai) dilabeli jelas, tidak masuk prod path | PRD §7.1, §21 |

### Keputusan
| # | Tanggal | Sesi | Keputusan | Alternatif ditolak |
|:--|:--------|:-----|:----------|:-------------------|
| D1 | 2026-10-11 | ses-2026-10-11-a | Pakai spec OAS resmi Etsy sebagai acuan adapter | Asumsi/karangan endpoint (dilarang PRD §21) |
| D2 | 2026-10-11 | ses-2026-10-11-a | npm sebagai package manager | bun (kurang kompatibel dgn tooling Next.js/shadcn) |
| D3 | 2026-10-11 | ses-2026-10-11-a | Discovery & Explorer pakai endpoint publik (x-api-key) dulu; OAuth ditunda ke Phase 5 | OAuth lebih awal (tak perlu untuk endpoint publik) |
| D4 | 2026-10-11 | ses-2026-10-11-a | OAuth pakai PKCE S256 + validasi state | Tanpa PKCE (diwajibkan Etsy) |
| D5 | 2026-10-11 | ses-2026-10-11-a | Migrasi SQL berversi (bukan auto-sync) | Auto-sync schema |
| D6 | 2026-10-11 | ses-2026-10-11-a | Money: numeric(12,2) + currency_code per baris | Floating point (PRD §10) |
| D7 | 2026-10-11 | ses-2026-10-11-a | Snapshot append-only + dedup key | Update in-place (kehilangan histori) |
| D8 | 2026-10-11 | ses-2026-10-11-a | AI Research Brief ditunda (P2, Phase 6) | AI di MVP inti (opsional per PRD §3.2) |
| D9 | 2026-10-11 | ses-2026-10-11-b | Pertahankan `cacheComponents: true` bawaan scaffold Next 16 | Mematikannya (harus diuji ulang; dashboard dinamis tetap perlu `<Suspense>` untuk data runtime) |
| D10 | 2026-10-11 | ses-2026-10-11-d | Format tanggal/angka/nama-negara **deterministik statis** (bukan `Intl`) | `Intl.*` (menyebabkan hydration mismatch server vs client) |
| D11 | 2026-10-11 | ses-2026-10-11-d | Kurs IDR dari `open.er-api.com` (base USD), cache 24 jam | frankfurter.app (mata uang terbatas); tanpa konversi (pengguna minta IDR) |
| D12 | 2026-10-11 | ses-2026-10-11-d | Harga tampil IDR (tanpa desimal); mata uang asli sbg referensi kecil | Tampil multi-mata uang campur (sulit dibandingkan) |

### Blocker
| # | Tanggal | Sesi | Blocker | Dampak | Status |
|:--|:--------|:-----|:--------|:-------|:-------|
| B1 | 2026-10-11 | ses-2026-10-11-a | `ETSY_API_KEY` belum ada | Tak bisa data live; Phase 2 uji dgn mock | **RESOLVED** (key diisi 2026-10-11; data live terbukti) |
| B2 | 2026-10-11 | ses-2026-10-11-a | Project Supabase belum ada | Migrasi belum bisa dijalankan nyata | **RESOLVED** (project + 12 tabel ter-migrasi via pooler) |
| B3 | 2026-10-11 | ses-2026-10-11-a | Docker tidak terpasang | n8n self-host lokal tertunda | Open (Phase 6) |
| B4 | 2026-10-11 | ses-2026-10-11-a | OAuth redirect butuh HTTPS publik | My Shop OAuth tak bisa dites lokal murni | Open (Phase 5; pakai dev tunnel) |
| B5 | 2026-10-11 | ses-2026-10-11-a | Access level app Etsy belum diketahui | Bisa batasi endpoint | Open — endpoint publik (listings/active, batch, videos) **terbukti jalan**; scope OAuth diverifikasi Phase 5 |
| B6 | 2026-10-11 | ses-2026-10-11-d | Kurs IDR bergantung API pihak ketiga (`open.er-api.com`) | Bila API down, harga tampil mata uang asli | Open (fallback aman sudah diterapkan) |

---

## 6. PROGRESS COUNTER

> Perbarui tiap akhir sesi. `Done / Total`.

| Fase | Done / Total | % |
|:-----|:-------------|:--|
| 0 | 5 / 5 | 100% |
| 1 | 8 / 8 | 100% |
| 2 | 9 / 9 | 100% |
| 2b | 11 / 11 (UX polish) | 100% |
| 3 | 0 / 8 | 0% |
| 4 | 0 / 8 | 0% |
| 5 | 0 / 8 | 0% |
| 6 | 0 / 8 | 0% |
| 7 | 0 / 6 | 0% |
| **Total** | **33 / 71** | **46%** |

> Catatan: Phase 2b adalah rangkaian polish UX atas permintaan pengguna di atas fondasi Phase 2
> (galeri gambar/video, kurs IDR, filter, sticky bar, fix hydration). Tidak mengubah lingkup PRD.

---

## 7. SESSION LOG (Riwayat Sesi)

> Satu entri per sesi. **Append-only** — jangan edit entri lama.

### Template entri

```
### [YYYY-MM-DD] session:<session-id>
- Fase: <Phase N>
- Task diklaim: <P?-??, ...>
- Task selesai: <P?-??, ...>  → bukti: commit/file/test
- Task diblokir: <P?-??>  → alasan: ...
- Perintah dijalankan: <lint/typecheck/test/build + hasil>
- Fase berikutnya: <Phase N+1>
- Catatan/asumsi baru: <...>
```

### Log

<!-- Tambahkan entri baru di bawah baris ini -->

### [2026-10-11] session:ses-2026-10-11-d
- Fase: Phase 2 (UX polish lanjutan — P2-10..P2-20)
- Task diklaim: P2-10, P2-11, P2-12, P2-13, P2-14, P2-15, P2-16, P2-17, P2-18, P2-19, P2-20
- Task selesai: P2-10..P2-20 → bukti: `commit:32e02cb`, `51282a6`, `b86e5fa`, `eaa62e8`, `b2f4b23`, `a74a11e`, `2262e0f`; `file:src/lib/currency.ts`, `card-image-gallery.tsx`, `search-store.ts`, `copy-button.tsx`
- Task diblokir: —
- Perintah dijalankan: `npx next typegen` + `npx tsc --noEmit` (OK), `npm run lint` (OK), `npm run build` (exit 0), `npm test` (3 unit test normalizer + integration dedup/upsert lolos), `npm run dev` + uji HTTP live (kartu multi-gambar, video di detail, harga IDR `Rp 49.963`, tombol nav galeri, tanpa badge foto).
- Fase berikutnya: **Phase 3 (Daily Discovery & Snapshots)** — mulai besok.
- Catatan/asumsi baru:
  - **Endpoint Etsy terverifikasi publik** (tanpa OAuth): `findAllListingsActive`, `getListingsByListingIds` (batch, `includes=Images,Videos,Shop`), `getListingVideos`. → lihat bagian 5 (D1).
  - Video listing tersedia & terbukti (11/20 listing). Field: `video_id, video_url, thumbnail_url, video_state`.
  - **Hydration mismatch diperbaiki**: semua formatting (tanggal/angka/nama negara) kini deterministik statis, bukan `Intl.*`.
  - Kurs IDR dari `open.er-api.com` (cache 24 jam) — Blocker B6 (ketergantungan pihak ketiga, fallback aman).
  - `npm test` menambah kasus uji: multi-image & video (video `deleted` difilter).

---

## 7b. RENCANA SESI BERIKUTNYA (untuk sesi besok)

> Ringkasan agar sesi berikutnya langsung paham konteks tanpa membaca seluruh log.

**Status:** Phase 0, 1, 2 (+ polish UX) **SELESAI**. Product Explorer **sudah baik & stabil** menurut pengguna.

**Fokus berikutnya — Phase 3: Daily Discovery & Snapshots (`P3-01..P3-08`)**

| Langkah | Yang harus dibuat |
|:--------|:------------------|
| 1 | `discovery_seeds` — seed keyword configurable dari Settings (tabel sudah ada) |
| 2 | Job discovery: ambil listing per keyword, simpan snapshot (idempotent), catat `job_runs` |
| 3 | Manual trigger (server action / API route) — n8n belum ada (B3) |
| 4 | Today's Etsy Trends `/` — baca `daily_trend_results`, empty/stale/error state |
| 5 | Partial success: 1 keyword gagal ≠ hapus hasil keyword lain |
| 6 | Tampilkan timestamp sinkronisasi + data coverage/sufficiency |

**Prasyarat yang sudah siap:**
- `ETSY_API_KEY` + `ETSY_SHARED_SECRET` ✅ (live terbukti)
- Supabase + 12 tabel ter-migrasi ✅ (`npm run db:migrate`)
- Adapter Etsy server-only + normalizer ✅ (`src/lib/etsy/`)
- Repo helper DB ✅ (`src/lib/db/listings-repo.ts` — `upsertListings`, `recordSearchRun`)
- Pola aman: `connection()` + `<Suspense>` (Next 16), format deterministik, sticky bar.

**Yang perlu disiapkan/diputuskan sesi besok:**
- Seed keyword awal (PRD §8.1 punya 12 contoh: personalized gift, wedding template, dst.).
- Batas item per keyword & frekuensi (default: harian 02.00 WIB).
- Konfirmasi format klasifikasi (`emerging`/`accelerating`/`established`) akan diisi Phase 4.

**Blocker aktif:** B3 (Docker/n8n — ditunda ke Phase 6), B4 (HTTPS OAuth — Phase 5), B5 (scope OAuth — Phase 5), B6 (API kurs pihak ketiga — ada fallback).

**Catatan teknis penting (jangan diulang salah):**
- Format tanggal/angka **harus** pakai helper statis di `src/lib/utils.ts` (jangan `Intl.*` → hydration mismatch).
- Halaman dinamis: `await connection()` + bungkus `<Suspense>`.
- shadcn v4 = base-ui: pakai prop `render`, bukan `asChild`.
- Harga tampil IDR via `formatIDR()`; mata uang asli sbg referensi.

### [2026-10-11] session:ses-2026-10-11-c
- Fase: Phase 2
- Task diklaim: P2-01..P2-09
- Task selesai: P2-01..P2-09 → bukti: `file:src/lib/etsy/client.ts`, `normalizer.ts`, `listings-repo.ts`, `src/app/products/page.tsx`, `src/app/products/[etsyListingId]/page.tsx`, `src/app/api/products/`; unit test & integration test pass.
- Task diblokir: —
- Perintah dijalankan: `npm run db:migrate` (12/12 tabel migrasi sukses via connection pooler), `npm test` (unit test normalizer + integration test dedup/upsert lolos), `npx next typegen`, `npx tsc --noEmit`, `npm run lint`, `npm run build` (sukses, exit code 0), `npm run dev` + query live Etsy API (`crochet pattern` -> 1.03jt listing, detail + 6 gambar, snapshot terekam di DB, search_runs terekam).
- Fase berikutnya: Phase 3 (Daily discovery & snapshots)
- Catatan/asumsi baru: Empty string di `.env.local` ditangani via Zod `emptyToUndefined` di `src/lib/config/env.ts` agar tidak memicu error validasi `min(1)`; Client component URL hooks di `layout.tsx` dibungkus `<Suspense>` untuk kepatuhan Next.js 16 prerender; `next.config.ts` ditambahkan domain `i.etsystatic.com` untuk gambar Etsy.

### [2026-10-11] session:ses-2026-10-11-b
- Fase: Phase 1
- Task diklaim: P1-01..P1-08
- Task selesai: P1-01..P1-08 → bukti: `file:src/`, `migrations/`, `.env.example`, `README.md`; build/lint/typecheck OK
- Task diblokir: —
- Perintah dijalankan: `npx create-next-app` (Next 16.4/React 19.3/TS/Tailwind v4), `shadcn init` + 14 komponen ui, `npm i zod @supabase/supabase-js @supabase/ssr server-only`, `npm run lint` (OK), `npx next typegen` + `npx tsc --noEmit` (OK), `npm run build` (OK, 12 route ter-prerender), `npm run dev` + uji HTTP (/, /settings, /products, /reports, 404 → semua sesuai).
- Fase berikutnya: Phase 2 (Etsy API client & Product Explorer)
- Catatan/asumsi baru: scaffold mengaktifkan `cacheComponents: true` (Next 16) — dicatat sbg keputusan D9; `LayoutProps` butuh `next typegen`; shadcn v4 pakai base-ui (prop `render`, bukan `asChild`); `use-mobile.ts` diperbaiki pakai `useSyncExternalStore` agar lolos lint.

### [2026-10-11] session:ses-2026-10-11-a
- Fase: Phase 0
- Task diklaim: P0-01, P0-02, P0-03, P0-04, P0-05
- Task selesai: P0-01, P0-02, P0-03, P0-04, P0-05 → bukti: `file:IMPLEMENTATION_PLAN.md`
- Task diblokir: —
- Perintah dijalankan: `git init`; inspeksi file/env (PowerShell); unduh + parsing OAS resmi Etsy via node (verifikasi endpoint/field/rate-limit/OAuth). Hasil: semua OK.
- Fase berikutnya: Phase 1 (Foundation)
- Catatan/asumsi baru: Node 24 + npm 11 + git 2.55 dipasang sesi ini (Docker tidak ada). Endpoint discovery/explorer publik (x-api-key) — OAuth ditunda Phase 5. Blocker B1-B5 dicatat (tidak memblokir Phase 1).

### [YYYY-MM-DD] session:<session-id>
- Fase: Phase 0
- Task diklaim: —
- Task selesai: —
- Task diblokir: —
- Perintah dijalankan: —
- Fase berikutnya: Phase 0
- Catatan/asumsi baru: Taskboard dibuat dari `etsy_intelligence_prd.md`.

---

## 8. ACCEPTANCE CRITERIA (DoD MVP — PRD §16 & §22)

Tandai `[x]` hanya setelah terbukti. Ini adalah syarat "MVP selesai".

### Today's Etsy Trends
- [ ] `/` membaca daily trend results tersimpan tanpa pencarian manual
- [ ] Filter kategori/periode/sort memperbarui hasil
- [ ] Setiap kartu menampilkan waktu update + asal data
- [ ] Tanpa histori → `Newly discovered` / `Insufficient history`, bukan `Trending up`
- [ ] Refresh gagal → hasil terakhir tetap tampil + warning stale
- [ ] Data demo tidak tercampur data live

### Product Explorer & Historical Tracking
- [x] Pencarian validasi input, pagination, tanpa duplikat
- [x] Save idea membuat record persisten
- [x] Detail produk menampilkan snapshot jika ada
- [x] Snapshot baru tidak menimpa snapshot lama
- [ ] Delta hanya dihitung dengan baseline valid; tanpa ÷0
- [ ] Data hilang tidak dianggap nol tanpa aturan

### Competitor Tracker & My Shop
- [ ] User dapat tambah/hapus toko dipantau
- [ ] Toko tak dapat diakses → error/status jelas
- [ ] UI tidak mengklaim data penjualan kompetitor
- [ ] OAuth callback memvalidasi state
- [ ] Token tidak pernah dikirim ke client
- [ ] Data diambil hanya sesuai scope; koneksi kedaluwarsa ditandai

### Automation & Security
- [ ] Job run menyimpan status sukses/parsial/gagal
- [ ] Retry terbatas & tidak menghasilkan duplikasi
- [ ] Rate limit ditangani; alert pakai dedupe key
- [ ] Timestamp ditampilkan sesuai timezone
- [ ] Tidak ada secret di repository/bundle client
- [ ] Input API tervalidasi; endpoint mutasi butuh autentikasi
- [ ] Akses database sesuai auth/RLS

### Deliverables (PRD §20)
- [ ] Aplikasi berjalan lokal
- [ ] Struktur folder terdokumentasi
- [ ] Database migration files
- [ ] `.env.example`
- [ ] Etsy API adapter server-only
- [ ] Today's Etsy Trends + Product Explorer
- [ ] Snapshot/trend scoring services + tests
- [ ] Idea Vault
- [ ] OAuth toko sendiri (atau dokumentasi blocker)
- [ ] Workflow n8n atau dokumentasi konfigurasi
- [ ] README lengkap
- [ ] `IMPLEMENTATION_PLAN.md` + checklist AC diperbarui
- [ ] Ringkasan file berubah, perintah, hasil test, keterbatasan

---

## 9. CHANGELOG TASKBOARD

| Versi | Tanggal | Perubahan |
|:------|:--------|:----------|
| 1.0 | — | Taskboard awal dibuat dari PRD v1.0 (8 fase, 60 task, AC, session log). |
| 1.1 | 2026-10-11 | Phase 0/1/2 selesai + 11 task UX polish (P2-10..P2-20); B1/B2 resolved; D10–D12; bagian 7b "Rencana Sesi Berikutnya"; progress 33/71. |
