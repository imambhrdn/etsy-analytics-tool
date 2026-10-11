# Etsy Intelligence

Aplikasi web pribadi untuk riset produk Etsy dan mengelola toko sendiri:
**Today's Etsy Trends**, **Product Explorer**, **Competitor Tracker**, **Idea Vault**,
**My Shop**, **Scheduled Research** (n8n), dan **Research Brief** berbantuan AI.

> Alat analitik pribadi untuk riset SEO dan listing.
>
> The term 'Etsy' is a trademark of Etsy, Inc. This application uses the Etsy API
> but is not endorsed or certified by Etsy, Inc.

- **Spesifikasi:** [`etsy_intelligence_prd.md`](./etsy_intelligence_prd.md) (v1.0)
- **Papan tugas:** [`TASKBOARD.md`](./TASKBOARD.md)
- **Rencana implementasi:** [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md)
- **Zona waktu:** Asia/Jakarta (WIB)

> Status: **Phase 0, 1, 2 (+ UX polish) selesai.** Product Explorer sudah berfungsi
> (pencarian live Etsy, galeri gambar & video, harga IDR). Fitur riset data lain
> (Trends, Idea Vault, dll.) menyusul — lihat TASKBOARD.

## Stack

| Layer | Pilihan |
|:------|:--------|
| Frontend | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui |
| Database | Supabase PostgreSQL (migrasi SQL berversi) |
| Integrasi Etsy | Etsy Open API v3 (adapter server-only) |
| Workflow | n8n (orkestrator) |
| Validation | Zod |
| Charts | Recharts (fase lanjut) |

## Prasyarat

- **Node.js ≥ 20.9** (di mesin ini: v24) — wajib untuk Next.js 16
- **npm** (atau bun)
- Akun **Etsy Developer** (untuk data live) dan project **Supabase** (untuk DB) — lihat
  [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) §5 (blocker B1/B2)

## Setup lokal

```bash
# 1. Install dependencies
npm install

# 2. Siapkan environment
cp .env.example .env.local     # lalu isi nilainya (JANGAN commit .env.local)

# 3. Jalankan dev server
npm run dev                    # http://localhost:3000
```

Aplikasi berjalan **tanpa** kredensial (mode empty state yang jelas). Isi
`.env.local` untuk mengaktifkan integrasi. Rahasia tidak pernah ditampilkan di UI.

## Skrip

| Perintah | Fungsi |
|:---------|:-------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Jalankan hasil build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Typecheck |
| `npx next typegen` | Generate tipe route (`PageProps`, `LayoutProps`) |

## Migrasi database

Migrasi SQL berversi di [`migrations/`](./migrations). Jalankan lewat Supabase SQL
Editor atau Supabase CLI, **berurutan**:

1. `migrations/0001_initial_schema.sql` — skema awal (PRD §10)
2. `migrations/0002_rls.sql` — Row Level Security

> Semua akses data dilakukan **server-side** dengan service-role key (jangan pernah
> di browser). RLS aktif tanpa policy publik (MVP single-user).

## Struktur folder

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # root layout (sidebar + tooltip provider)
│   ├── page.tsx              # /  Today's Etsy Trends
│   ├── loading.tsx           # loading state global
│   ├── error.tsx             # error boundary global
│   ├── not-found.tsx         # 404
│   ├── products/             # /products (Phase 2)
│   ├── ideas/                # /ideas (Phase 4)
│   ├── trends/ competitors/ keywords/ opportunities/   # (fase lanjut)
│   ├── my-shop/listings|orders/                         # (Phase 5)
│   ├── profit/ automation/ reports/                     # (fase lanjut)
│   └── settings/             # /settings — status integrasi (nyata)
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   ├── app-sidebar.tsx       # sidebar navigasi (PRD §6)
│   ├── states.tsx            # EmptyState / ErrorState
│   ├── page-header.tsx       # header halaman
│   └── coming-later.tsx      # placeholder jujur utk fitur belum aktif
├── lib/
│   ├── config/
│   │   ├── env.ts            # skema Zod env + status integrasi
│   │   └── app.ts            # konstanta app + struktur navigasi
│   └── utils.ts              # cn()
└── hooks/
    └── use-mobile.ts         # hook responsif (useSyncExternalStore)

migrations/                   # SQL berversi (PRD §10)
```

## Keamanan & kepatuhan (PRD §12)

- Rahasia hanya di env/server secret store; **tidak ada** di bundle client atau log.
- Adapter Etsy **server-only**; browser tidak pernah memanggil Etsy dengan token.
- Semua input divalidasi (Zod); endpoint mutasi memerlukan autentikasi.
- Jangan klaim data penjualan kompetitor yang tidak disediakan API.
- Hormati rate limit Etsy (`429` + `retry-after`, exponential backoff).

## Roadmap fase

Lihat [`TASKBOARD.md`](./TASKBOARD.md) §3. Ringkas: 0 Inspection ✓ · 1 Foundation ✓ ·
2 Etsy client & Explorer · 3 Discovery & snapshots · 4 Scoring & Idea Vault ·
5 Competitor & My Shop · 6 n8n & reports · 7 Hardening.
