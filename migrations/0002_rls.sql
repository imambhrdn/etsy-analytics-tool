-- Migration 0002: Row Level Security (PRD §10, §12)
--
-- Prinsip:
--   * Tabel yang TIDAK boleh diekspos ke client → RLS aktif tanpa policy publik.
--   * Service-role key (server-only) melewati RLS; jangan pernah dipakai di browser.
--   * shop_connections & own_shop_orders memuat data privat → hanya server.
--
-- MVP single-user (PRD §3.2): belum ada policy berbasis auth user. Semua akses
-- data dilakukan server-side dengan service role. Bila kelak memakai Supabase Auth,
-- tambahkan policy per-user di sini.

alter table shops enable row level security;
alter table listings enable row level security;
alter table listing_snapshots enable row level security;
alter table tracked_shops enable row level security;
alter table search_runs enable row level security;
alter table discovery_seeds enable row level security;
alter table daily_trend_results enable row level security;
alter table product_ideas enable row level security;
alter table alerts enable row level security;
alter table job_runs enable row level security;
alter table shop_connections enable row level security;
alter table own_shop_orders enable row level security;

-- Tanpa policy = tidak ada akses via anon/auth key.
-- Server (service role) tetap bisa mengakses untuk job & server actions.
-- Catatan: bila ingin mengizinkan baca publik untuk data riset non-privat,
-- tambahkan policy `select using (true)` pada tabel terkait di migrasi berikutnya.
