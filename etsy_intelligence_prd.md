# PRD --- Etsy Intelligence

**Versi:** 1.0\
**Status:** Siap digunakan sebagai spesifikasi awal coding agent\
**Target:** Personal tool untuk riset produk Etsy dan mengelola toko
sendiri\
**Zona waktu produk:** Asia/Jakarta (WIB), dapat dikonfigurasi\
**Bahasa UI awal:** Inggris untuk istilah pasar/produk, dengan dukungan
struktur i18n agar dapat dilokalkan

------------------------------------------------------------------------

## 1. Ringkasan Produk

Etsy Intelligence adalah aplikasi web pribadi yang menggabungkan: 1.
**Today's Etsy Trends** --- landing page yang otomatis menyajikan
kandidat produk/niche yang layak diteliti tanpa pengguna harus melakukan
pencarian manual. 2. **Product Explorer** --- pencarian dan filter
listing Etsy sesuai kemampuan endpoint/API access yang dimiliki. 3.
**Competitor Tracker** --- pemantauan toko/listing pilihan dan perubahan
metrik dari snapshot historis. 4. **Idea Vault** --- penyimpanan
kandidat produk, catatan, status validasi, dan sumber referensi. 5. **My
Shop** --- tampilan baca-awal untuk listing dan data toko sendiri yang
dapat diakses melalui OAuth/scope yang sah. 6. **Scheduled Research**
--- pekerjaan terjadwal melalui n8n untuk mengumpulkan data, menyimpan
snapshot, menghitung metrik, serta membuat ringkasan. 7. **Research
Brief** --- ringkasan berbantuan AI yang hanya menggunakan data yang
benar-benar tersimpan dan menyatakan ketidakpastian.

Tujuan MVP bukan mengklaim mengetahui penjualan kompetitor atau tren
seluruh Etsy secara pasti. Sistem menghasilkan **discovery candidates**
dari pencarian API, menyimpan observasi historis, lalu memberi ranking
yang transparan berdasarkan data yang tersedia.

## 2. Latar Belakang dan Masalah

Seller membutuhkan cara untuk: - menemukan kandidat produk tanpa selalu
memulai pencarian manual; - mengetahui perubahan metrik dari waktu ke
waktu; - mengamati katalog kompetitor yang dipilih; - mengorganisasi ide
produk dan langkah validasinya; - memisahkan data listing publik dari
data privat toko sendiri; - menerima ringkasan riset berkala.

Pencarian listing saat ini tidak dengan sendirinya membuktikan suatu
produk sedang tren. Sistem perlu membuat kumpulan pencarian terjadwal,
menyimpan snapshot, membandingkan observasi, dan menunjukkan waktu serta
kecukupan data.

## 3. Sasaran dan Non-Sasaran

### 3.1 Sasaran MVP

-   Menyajikan halaman Today's Etsy Trends sebagai halaman awal.
-   Mengumpulkan kandidat dari seed keyword dan kategori yang
    dikonfigurasi.
-   Memperbarui data terpilih setiap hari sesuai rate limit dan API
    access.
-   Menyimpan listing dan snapshot historis tanpa duplikasi.
-   Menampilkan perubahan metrik dengan rentang 7/30/90 hari jika data
    cukup.
-   Menyediakan Product Explorer, Competitor Tracker, Idea Vault, dan My
    Shop read-only.
-   Menyediakan ranking awal yang dapat dijelaskan, bukan skor kotak
    hitam.
-   Menyediakan workflow n8n yang dapat diulang dengan aman dan
    dipantau.
-   Memberi status waktu sinkronisasi, kesegaran data, serta error yang
    dapat ditindaklanjuti.

### 3.2 Non-Sasaran MVP

-   Menjamin daftar "produk paling trending di seluruh Etsy".
-   Mengklaim data penjualan, omzet, konversi, atau pencarian kompetitor
    jika API tidak menyediakannya.
-   Scraping yang melanggar ketentuan Etsy.
-   Auto-publish atau mengubah listing toko tanpa konfirmasi eksplisit.
-   Sistem SaaS multi-tenant, billing, paket berbayar, atau kolaborasi
    tim.
-   AI agent yang melakukan tindakan eksternal tanpa persetujuan
    pengguna.
-   Prediksi penjualan/viralitas sebagai fakta.
-   Pemindaian menyeluruh semua listing Etsy. Discovery dilakukan
    melalui kumpulan seed keyword dan endpoint yang diizinkan.

## 4. Pengguna dan Skenario Utama

### Persona utama

Satu pemilik/pengelola toko Etsy yang ingin menemukan produk untuk
diteliti, memantau kompetitor, dan mengelola data tokonya sendiri.

### User stories

1.  Sebagai pengguna, saat membuka aplikasi saya ingin langsung melihat
    kandidat tren terbaru tanpa memasukkan keyword.
2.  Saya ingin mengetahui mengapa kandidat ditampilkan, metrik mana yang
    berubah, dan kapan data diambil.
3.  Saya ingin filter kategori, jendela tren, dan urutan ranking.
4.  Saya ingin menyimpan kandidat ke Idea Vault dan mencatat keputusan
    validasi.
5.  Saya ingin menambahkan toko/listing ke Competitor Tracker dan
    melihat perubahan historis.
6.  Saya ingin menghubungkan toko saya melalui OAuth dan melihat data
    yang diizinkan.
7.  Saya ingin menerima laporan harian/mingguan, tetapi tetap bisa
    mematikan notifikasi.
8.  Saya ingin tahu jika sinkronisasi gagal atau data terlalu lama untuk
    dipercaya.

## 5. Informasi Arsitektur dan Stack

Stack default yang disarankan: - **Frontend:** Next.js App Router +
TypeScript. - **UI:** Tailwind CSS + shadcn/ui. - **Database:** Supabase
PostgreSQL. - **Auth aplikasi:** Supabase Auth jika login diperlukan;
MVP boleh dibatasi untuk satu pengguna tetapi tetap jangan mengekspos
endpoint admin. - **Backend:** Next.js server routes/server actions atau
service layer server-only. - **Integrasi Etsy:** Etsy Open API v3
melalui Etsy client terisolasi. - **Workflow:** n8n untuk jadwal
sinkronisasi, perubahan metrik, dan laporan. - **Charts:** Recharts. -
**Validation:** Zod. - **AI:** provider yang dapat dikonfigurasi; AI
opsional untuk MVP inti. - **Deployment:** hosting yang mendukung
server-side code dan HTTPS; n8n terpisah. - **Logging:** log terstruktur
untuk request, status, waktu, error, dan pemakaian kuota; jangan log
secret/token.

### Prinsip arsitektur

1.  Browser tidak memanggil Etsy dengan API secret/token privat.
2.  Semua rahasia disimpan di environment/backend secret store.
3.  Data API dinormalisasi sebelum digunakan pada domain model.
4.  PostgreSQL adalah sumber data utama; n8n adalah orkestrator, bukan
    database.
5.  Job harus idempotent: menjalankan ulang job tidak menggandakan
    listing atau alert.
6.  Pisahkan data riset publik dari koneksi dan data privat toko
    sendiri.
7.  Setiap klaim tren memiliki sumber, timestamp, periode pembanding,
    dan data sufficiency.
8.  Adapter Etsy mengisolasi bentuk respons API agar perubahan endpoint
    tidak menyebar ke UI.

## 6. Struktur Navigasi

Sidebar: - **Overview** - Today's Etsy Trends (default route `/`) -
Product Explorer (`/products`) - Idea Vault (`/ideas`) - **Market
Research** - Trend Radar (`/trends`) - Competitor Tracker
(`/competitors`) - Keyword Lab (`/keywords`, tahap lanjutan/placeholder
bila belum didukung data) - Opportunity Finder (`/opportunities`) - **My
Shop** - My Listings (`/my-shop/listings`) - Orders & Sales
(`/my-shop/orders`, hanya jika scope/endpoint mengizinkan) - Profit
Calculator (`/profit`) - **Automation** - Research Workflows
(`/automation`) - Alerts & Reports (`/reports`) - **Settings** - Etsy
API/OAuth connection - Seed keywords/categories - Refresh schedule -
Notification settings - Data status and diagnostics

Jangan menampilkan menu yang belum berfungsi seolah-olah sudah aktif.
Menu tahap lanjut dapat disembunyikan atau diberi label "Coming later".

## 7. Spesifikasi Halaman

### 7.1 Today's Etsy Trends --- P0

**Route:** `/`\
**Tujuan:** menampilkan kandidat discovery otomatis, bukan meminta
pengguna melakukan pencarian terlebih dahulu.

Bagian halaman: - Header "Today's Etsy Trends". - Status sinkronisasi:
`Last updated`, `Next refresh`, `Data status`. - KPI: tracked listings,
newly discovered candidates, emerging candidates. Jika belum ada data,
tampilkan empty state, bukan angka rekaan. - Filter: - Category: All,
Digital Downloads, Print-on-Demand, Handmade & Personalized, Home Decor,
Jewelry, Apparel, Other. Kategori dapat disesuaikan. - Trend window: 7d
/ 30d / 90d. - Sort: Fastest Growth, Most Attention, Best Opportunity
Score, Recently Discovered. - Optional: confidence/data sufficiency. -
Grup kandidat: - **Emerging:** baru ditemukan; jangan sebut "rising"
tanpa histori. - **Accelerating:** perubahan metrik positif dibanding
periode sebelumnya dengan observasi yang cukup. - **Established:**
mendapat perhatian relatif tinggi namun tidak harus tumbuh cepat. -
Product cards: - gambar jika tersedia dan diizinkan; - judul listing
dan/atau nama niche; - harga dan mata uang; - kategori/keyword asal; -
favorit/field relevan jika tersedia; - delta 7d/30d bila dapat
dihitung; - skor dan alasan komponen; - confidence/data sufficiency; -
waktu observasi terakhir; - actions: View details, Save idea, Track
listing, Open Etsy listing. - Empty state: jelaskan belum ada hasil dan
tautkan ke Settings untuk seed keywords / API setup. - Error state:
pertahankan hasil tersimpan terakhir, tampilkan warning data stale dan
waktu kegagalan. - Jangan tampilkan data demo sebagai data live. Jika
seed/demo mode dipakai dalam development, beri label jelas.

**Aturan data:** - Kandidat hanya berasal dari listing yang berhasil
dikembalikan oleh endpoint yang diizinkan. - Sistem tidak mengklaim
coverage seluruh Etsy. - Filter/urutan harus dilakukan berdasarkan data
yang ada dan memberi tahu jika metrik tidak tersedia. - Ranking tidak
boleh menganggap field kosong sama dengan nilai nol tanpa alasan
eksplisit.

### 7.2 Product Explorer --- P0

**Route:** `/products` - Search keyword. - Filter kategori/jenis
listing, rentang harga, mata uang, favorit atau field lain hanya jika
tersedia. - Sort berdasarkan field yang benar-benar tersedia. -
Pagination API yang benar; hindari memuat seluruh katalog sekaligus. -
Simpan hasil ke database dengan dedup berdasarkan Etsy listing ID. -
Listing detail menampilkan metadata, tags, tanggal listing/update jika
tersedia, snapshot historis, dan sumber data. - Actions: Save to Idea
Vault, Track, Open on Etsy. - Catat query/filter/time pada
`search_runs`.

### 7.3 Listing Detail --- P0

**Route:** `/products/[etsyListingId]` - Informasi listing dan sumber
data. - Riwayat snapshot berupa tabel/grafik. - Harga/favorit dan metrik
lain yang tersedia. - Penjelasan delta, periode pembanding, dan
timestamp. - Status data historis: Insufficient history / Enough
observations. - Save idea / add or remove tracking.

### 7.4 Competitor Tracker --- P1

**Route:** `/competitors` - Tambah toko/listing untuk dipantau melalui
URL atau ID yang dapat diverifikasi. - Tampilkan jumlah listing yang
berhasil ditemukan/diambil, bukan mengasumsikan semua katalog telah
terkumpul. - Daftar listing yang diamati, perubahan
metadata/harga/favorit, first seen, last seen. - Riwayat snapshot dan
perbandingan waktu. - Jangan menampilkan angka penjualan kompetitor
kecuali terdapat sumber yang sah dan valid. - Jika toko tidak dapat
ditemukan melalui API, tampilkan alasan yang jelas.

### 7.5 Idea Vault --- P0

**Route:** `/ideas` - Simpan listing/niche, judul ide internal, catatan,
sumber, keyword, target buyer, biaya, estimasi harga, dan status. -
Status: `Discovered`, `Researching`, `Validated`, `Creating`,
`Published`, `Rejected`. - Catatan keputusan dan timestamp perubahan. -
Filter berdasarkan status, kategori, dan tanggal. - Ide tetap tersimpan
walau listing sumber berubah/hilang; referensi sumber ditandai sesuai
kondisi.

### 7.6 My Shop --- P0 (read-only awal)

**Routes:** `/my-shop/listings`, `/my-shop/orders` - Hubungkan toko
melalui OAuth sesuai dokumentasi Etsy. - Tampilkan status koneksi, nama
toko/ID, scope yang diberikan, dan waktu sinkronisasi. - Tampilkan
listing milik sendiri yang dapat diakses. - Orders/sales hanya muncul
jika endpoint dan scope memang memberikan data tersebut. - Tahap awal
read-only. Mutasi listing/order tidak termasuk MVP. - OAuth
state/PKCE/redirect sesuai mekanisme yang diwajibkan dokumentasi resmi
saat implementasi; token refresh dan revoke ditangani aman. - Jika belum
terhubung, tampilkan CTA Connect Etsy, jangan tampilkan data palsu.

### 7.7 Reports & Automation --- P1

**Routes:** `/reports`, `/automation` - Status job terakhir,
mulai/selesai, jumlah item sukses/gagal, dan ringkasan error. - Riwayat
laporan harian/mingguan. - Pengaturan jadwal dan notifikasi. - Retry
manual hanya untuk job yang aman diulang. - Jangan mengekspos credential
n8n atau webhook rahasia di browser.

### 7.8 Settings --- P0

**Route:** `/settings` - Status koneksi API dan toko. - Seed keywords
dan kategori yang digunakan discovery. - Frekuensi sinkronisasi dan
batas item per job. - Timezone (default `Asia/Jakarta`). - Pengaturan
alert. - Data retention / hapus data yang tersimpan jika sesuai
kebijakan. - Health status dan diagnostik API. - Rahasia tidak boleh
ditampilkan ulang; hanya status terhubung/ada.

## 8. Mesin Automatic Discovery

### 8.1 Seed discovery

Buat tabel konfigurasi seed keyword. Seed awal harus dapat diedit dari
Settings, tidak hard-coded secara permanen. Contoh awal lintas
kategori: - personalized gift - wedding template - printable wall art -
digital planner - custom pet portrait - handmade jewelry - crochet
pattern - home decor - personalized mug - nursery decor - wedding
favor - seasonal gift

Seed tersebut adalah kata kunci awal untuk menjelajah, bukan klaim tren.
Perluas dari istilah listing yang dikembalikan API dengan aturan
terkontrol, validasi, dedup, dan batas jumlah keyword per hari.

### 8.2 Daily job

Urutan: 1. Mulai job dengan `job_run_id`. 2. Ambil seed
keywords/categories yang aktif. 3. Periksa last run, cache, dan batas
request. 4. Ambil listing per keyword dengan pagination dan batas jumlah
yang dikonfigurasi. 5. Normalisasi respons ke model internal. 6. Upsert
listing berdasarkan Etsy listing ID. 7. Simpan snapshot untuk listing
yang dipantau/terpilih. 8. Hitung delta jika data pembanding cukup. 9.
Kelompokkan kandidat ke emerging/accelerating/established. 10. Hitung
score dan confidence. 11. Simpan daily result/ranking untuk
reproducibility. 12. Buat alert hanya jika aturan baru terpenuhi. 13.
Tandai job sukses/parsial/gagal dan simpan metrik operasional.

Job harus mendukung partial success. Kegagalan satu keyword tidak boleh
menghapus hasil sukses dari keyword lain.

### 8.3 Frekuensi dan kuota

-   Default refresh: satu kali sehari, target pukul 02.00 WIB.
-   Jadwal harus configurable.
-   Terapkan throttling dan concurrency limit.
-   Hormati rate limit dan header respons relevan, termasuk
    `Retry-After` jika tersedia.
-   Gunakan exponential backoff untuk error sementara.
-   Jangan retry tanpa batas.
-   Cache respons pencarian dengan TTL yang dapat dikonfigurasi.
-   Jangan menjalankan refresh paralel yang tidak terkendali.
-   Simpan status kuota/rate-limit bila tersedia dari API.
-   Daily refresh berarti **data terakhir berhasil diproses harian**,
    bukan jaminan semua Etsy telah diperiksa.

## 9. Trend Classification dan Scoring

### 9.1 Definisi

-   **Newly discovered:** listing pertama kali terlihat oleh aplikasi.
    Ini tidak sama dengan listing baru dibuat di Etsy.
-   **Emerging:** listing/niche baru ditemukan atau data historis masih
    terbatas; label harus menjelaskan status histori.
-   **Accelerating:** memiliki perubahan positif pada metrik terukur
    selama periode yang dipilih dan memenuhi minimum observations.
-   **Established:** indikator perhatian relatif tinggi dibanding
    kandidat lain, tanpa klaim pertumbuhan jika histori tidak cukup.
-   **Opportunity:** ranking internal berdasarkan sinyal
    demand/attention, kompetisi, margin input, dan diferensiasi; bukan
    prediksi penjualan.

### 9.2 Skor awal (konfigurasikan dan dokumentasikan)

Bobot baseline: - Momentum historis: 30% - Attention signals: 25% -
Competition gap: 20% - Commercial potential: 15% - Differentiation
potential: 10%

Setiap subscore dinormalisasi 0--100. Bobot awal adalah heuristik produk
dan harus dapat ditinjau; bukan formula tervalidasi secara industri.

Contoh formula:
`score = sum(weight_i * normalized_subscore_i) / sum(weights_for_available_components)`

Namun UI harus menampilkan coverage komponen. Jangan menaikkan
confidence hanya karena komponen yang tidak tersedia diabaikan. Jika
komponen penting hilang, tandai `Provisional` dan tampilkan data
coverage.

### 9.3 Momentum

-   Hitung perubahan absolut dan persentase hanya jika baseline valid
    dan \> 0.
-   Gunakan interval 7/30/90 hari berdasarkan snapshot yang sesuai.
-   Jika tidak ada snapshot tepat pada batas periode, definisikan
    toleransi interval dan tampilkan tanggal observasi aktual yang
    digunakan.
-   Jangan menyamakan favorit dengan penjualan atau volume pencarian.
-   Jangan menampilkan persentase jika denominator nol/tidak ada;
    tampilkan "New baseline" atau "Insufficient history".
-   Hindari membandingkan kategori/umur listing yang tidak sebanding
    tanpa normalisasi.
-   Outlier handling dan minimum observations harus terdokumentasikan.

### 9.4 Competition gap

Gunakan proksi yang benar-benar bisa dihitung dari data yang
dikumpulkan, misalnya jumlah listing yang cocok dengan query dan
distribusi metrik kandidat dalam kumpulan hasil. Labeli sebagai
"observed competition" atau "competition proxy", bukan total kompetisi
Etsy atau keyword difficulty resmi.

### 9.5 Confidence/data sufficiency

Tampilkan kategori: - `Low`: data baru, snapshot sedikit, atau field
utama tidak tersedia. - `Medium`: beberapa snapshot dan field inti
tersedia. - `High`: observasi memadai, rentang waktu sesuai, dan data
relatif lengkap.

Tetapkan ambang secara eksplisit di kode/config dan dokumentasikan.
Confidence menggambarkan kecukupan data, bukan probabilitas produk akan
sukses.

## 10. Database Model

Gunakan migrasi SQL yang berversi. Model minimum:

### `shops`

-   `id uuid PK`
-   `etsy_shop_id bigint unique`
-   `name text`
-   `url text`
-   `is_own_shop boolean default false`
-   `tracking_enabled boolean default false`
-   `first_seen_at timestamptz`
-   `last_seen_at timestamptz`
-   `raw_data jsonb`

### `listings`

-   `id uuid PK`
-   `etsy_listing_id bigint unique not null`
-   `shop_id uuid FK nullable`
-   `title text`
-   `description text nullable` (hanya jika endpoint/izin dan kebutuhan
    memungkinkan)
-   `url text`
-   `currency_code text`
-   `price numeric(12,2)`
-   `quantity integer nullable`
-   `num_favorers integer nullable`
-   `state text`
-   `listing_type text nullable`
-   `created_at_etsy timestamptz nullable`
-   `updated_at_etsy timestamptz nullable`
-   `first_seen_at timestamptz`
-   `last_seen_at timestamptz`
-   `raw_data jsonb`
-   `inserted_at timestamptz`

### `listing_snapshots`

-   `id bigint generated identity PK`
-   `listing_id uuid FK`
-   `captured_at timestamptz`
-   `price numeric(12,2) nullable`
-   `num_favorers integer nullable`
-   `quantity integer nullable`
-   `state text nullable`
-   `source text`
-   Unique/dedup key sesuai strategi capture, misalnya listing + capture
    window.

### `tracked_shops`

-   `id uuid PK`
-   `shop_id uuid FK`
-   `enabled boolean`
-   `refresh_interval_hours integer`
-   `notes text`
-   `created_at timestamptz`

### `search_runs`

-   `id uuid PK`
-   `keyword text`
-   `category text nullable`
-   `filters jsonb`
-   `started_at timestamptz`
-   `completed_at timestamptz nullable`
-   `status text`
-   `items_seen integer`
-   `error_summary text nullable`
-   `source text`

### `discovery_seeds`

-   `id uuid PK`
-   `keyword text`
-   `category text nullable`
-   `enabled boolean`
-   `priority integer`
-   `max_pages integer`
-   `last_run_at timestamptz nullable`
-   timestamps

### `daily_trend_results`

-   `id uuid PK`
-   `run_date date`
-   `listing_id uuid FK nullable`
-   `niche_key text nullable`
-   `classification text`
-   `score numeric(5,2) nullable`
-   `confidence text`
-   `score_breakdown jsonb`
-   `evidence jsonb`
-   `created_at timestamptz`
-   Unique constraint yang sesuai untuk tanggal + kandidat.

### `product_ideas`

-   `id uuid PK`
-   `listing_id uuid FK nullable`
-   `title text`
-   `category text nullable`
-   `notes text nullable`
-   `target_buyer text nullable`
-   `estimated_cost numeric(12,2) nullable`
-   `target_price numeric(12,2) nullable`
-   `status text`
-   `source_url text nullable`
-   `created_at timestamptz`
-   `updated_at timestamptz`

### `alerts`

-   `id uuid PK`
-   `listing_id uuid FK nullable`
-   `alert_type text`
-   `dedupe_key text unique`
-   `payload jsonb`
-   `status text`
-   `created_at timestamptz`
-   `sent_at timestamptz nullable`

### `job_runs`

-   `id uuid PK`
-   `job_type text`
-   `started_at timestamptz`
-   `finished_at timestamptz nullable`
-   `status text`
-   `items_processed integer`
-   `items_failed integer`
-   `error_summary text nullable`
-   `metadata jsonb`

### `shop_connections`

-   `id uuid PK`
-   `provider text`
-   `etsy_shop_id bigint nullable`
-   `scopes text[]`
-   `connected_at timestamptz`
-   `expires_at timestamptz nullable`
-   token disimpan terenkripsi di storage/server yang sesuai; jangan
    expose di query client atau log.

### `own_shop_orders` (opsional setelah endpoint dan scope diverifikasi)

Simpan hanya data yang benar-benar diizinkan dan diperlukan; batasi
akses, retensi, dan paparan field personal.

### Database requirements

-   Tambahkan index untuk `etsy_listing_id`, `shop_id`, `captured_at`,
    `run_date`, dan kolom filter yang sering digunakan.
-   Gunakan `numeric` untuk uang, jangan floating point.
-   Simpan mata uang pada setiap harga.
-   Gunakan UTC untuk timestamps di database; konversi ke timezone
    pengguna pada UI.
-   Tambahkan `created_at`/`updated_at` konsisten.
-   Jika memakai Supabase, aktifkan RLS pada tabel yang terekspos ke
    client. Jangan pernah menggunakan service-role key di browser.
-   Semua perubahan skema melalui migration files.

## 11. API Routes Internal

Contoh endpoint internal; agent dapat menyesuaikan dengan konvensi
framework: - `GET /api/trends?window=7d&category=all&sort=momentum` -
`GET /api/trends/[id]` -
`GET /api/products?q=...&page=...&filters=...` -
`GET /api/products/[etsyListingId]` - `POST /api/ideas` -
`PATCH /api/ideas/[id]` - `POST /api/tracked-shops` -
`DELETE /api/tracked-shops/[id]` - `GET /api/jobs` -
`POST /api/jobs/[id]/retry` (hanya job idempotent dan authorized) -
`GET /api/etsy/connect` - `GET /api/etsy/callback` -
`GET /api/my-shop/listings` - `GET /api/my-shop/orders` (hanya jika
scope tersedia)

Validasi semua input dengan schema. Tambahkan pagination, batas jumlah
hasil, dan error response konsisten. Jangan menerima URL sembarang untuk
fetch server-side tanpa validasi karena berisiko SSRF.

## 12. Keamanan dan Kepatuhan

-   Ikuti Etsy Open API Terms, access level, endpoint permissions, dan
    aturan penyimpanan/penggunaan data yang berlaku.
-   Jangan scraping sebagai fallback otomatis.
-   Jangan mengakali rate limits.
-   Jangan menampilkan angka penjualan kompetitor yang tidak tersedia.
-   Simpan API key, client secret, access token, refresh token, Supabase
    service-role key, dan n8n webhook credentials di environment/secret
    manager.
-   Jangan commit `.env`.
-   OAuth harus memakai state validation dan alur yang disyaratkan
    dokumentasi Etsy terkini.
-   Hindari log token, data pribadi order, atau secret.
-   Gunakan least privilege; minta scope yang diperlukan saja.
-   Pisahkan data publik dengan data privat toko.
-   Validasi semua request dan lindungi endpoint mutasi dengan
    autentikasi.
-   Jangan mengeksekusi prompt atau instruksi dari listing/ulasan
    sebagai instruksi sistem AI; perlakukan konten sumber sebagai data
    tidak tepercaya.
-   Data yang tidak tersedia diberi label "Not available", bukan
    direkayasa.

## 13. n8n Workflow Specifications

### Workflow A: `daily-discovery-sync`

Trigger harian (default 02.00 Asia/Jakarta) → ambil seed aktif → periksa
job overlap → ambil listing dengan rate limit → normalize → upsert →
snapshot kandidat terpilih → simpan job status.

### Workflow B: `calculate-trends-and-alerts`

Ambil snapshot baru → bandingkan dengan baseline → hitung delta →
klasifikasikan kandidat → simpan daily trend result → buat alert dengan
dedupe key → kirim notifikasi bila aktif.

### Workflow C: `weekly-research-brief`

Ambil hasil mingguan → pilih kandidat dengan data memadai → kirim JSON
terstruktur ke model AI → validasi output → simpan laporan → kirim
ringkasan.

Requirements: - Gunakan credential store n8n, bukan menulis secret di
node. - Workflow menerima `job_run_id` dan mencatat status. - Semua
proses upsert idempotent. - Tangani timeout, retry terbatas, `429`, dan
partial failures. - Jangan memicu workflow bersarang tanpa batas. - Jika
workflow belum disiapkan, aplikasi tetap bisa dijalankan dengan
tombol/manual trigger atau data kosong yang jelas.

## 14. AI Research Brief

AI adalah lapisan penjelasan, bukan sumber angka. Input AI harus berupa
data terstruktur dari database: - nama/ID kandidat; - snapshot dan
rentang tanggal; - delta metrik; - score breakdown; - competition
proxy; - data coverage/confidence; - sumber dan timestamp.

Output schema: - `summary` - `notable_changes[]` -
`candidate_opportunities[]` - `why_it_appears[]` -
`risks_and_unknowns[]` - `validation_steps[]` - `generated_at`

Instruksi model harus melarang: - mengarang data pencarian/penjualan; -
mengklaim bahwa Etsy menyatakan item trending; - menyebut korelasi
sebagai sebab-akibat; - menyalin karya atau listing kompetitor; -
mengabaikan field yang hilang.

Jika tidak ada data memadai, AI harus mengatakan bahwa bukti belum cukup
dan merekomendasikan cara validasi.

## 15. UX, Visual Design, dan States

Gaya: dashboard modern, bersih, utilitarian, fokus data; sidebar desktop
dan navigasi responsif di mobile. Prioritaskan keterbacaan tabel dan
status data daripada dekorasi.

States wajib: - Loading/skeleton. - Empty state dengan instruksi. -
Partial data state. - Stale data warning. - API rate limit state. -
OAuth disconnected/expired state. - Error state dengan retry yang
aman. - Success toast untuk save/update. - Disabled state untuk fitur
yang memerlukan scope/API belum tersedia.

Setiap angka metrik harus memiliki label, unit, periode, dan
tooltip/penjelasan jika rawan disalahartikan. Jangan menggunakan angka
dummy pada production.

## 16. Acceptance Criteria

### Today's Etsy Trends

-   Saat membuka `/`, aplikasi mengambil daily trend results tersimpan
    tanpa mengharuskan pencarian manual.
-   Filter kategori/periode/sort memperbarui hasil sesuai query.
-   Setiap kartu menunjukkan waktu update dan asal data.
-   Jika belum ada histori, sistem menunjukkan `Newly discovered` atau
    `Insufficient history`, bukan klaim `Trending up`.
-   Jika refresh terakhir gagal, hasil terakhir tetap terlihat dengan
    warning stale.
-   Data demo tidak tercampur dengan data live.

### Product Explorer

-   Pencarian memvalidasi input, melakukan pagination, dan tidak
    menampilkan duplikat.
-   Save idea membuat record persisten.
-   Detail produk menampilkan snapshot jika tersedia.

### Historical Tracking

-   Snapshot baru tidak menimpa snapshot lama.
-   Delta dihitung hanya dengan baseline valid.
-   Tidak ada pembagian dengan nol.
-   Data yang hilang tidak dianggap sebagai angka nol tanpa aturan.

### Competitor Tracker

-   User dapat menambah/menghapus toko yang dipantau.
-   Toko yang tidak dapat diakses menampilkan error/status yang jelas.
-   UI tidak mengklaim data penjualan kompetitor.

### My Shop

-   OAuth callback memvalidasi state.
-   Token tidak pernah dikirim ke client.
-   Data hanya diambil sesuai scope.
-   Koneksi yang kedaluwarsa ditandai dan dapat disambungkan ulang.

### Automation

-   Job run menyimpan status sukses/parsial/gagal.
-   Retry terbatas dan tidak menghasilkan duplikasi.
-   Rate limit ditangani.
-   Alert menggunakan dedupe key.
-   Timestamp ditampilkan sesuai timezone.

### Security

-   Tidak ada secret di repository atau bundle client.
-   Input API tervalidasi.
-   Akses database sesuai auth/RLS.
-   Endpoint mutasi memerlukan autentikasi.

## 17. Tahapan Implementasi untuk Coding Agent

Implementasikan secara berurutan dan jangan membangun semua fitur
sekaligus.

### Phase 0 --- Repository inspection and plan

1.  Periksa struktur repo dan package manager.
2.  Periksa file yang sudah ada; jangan overwrite tanpa alasan.
3.  Identifikasi env variables yang dibutuhkan tanpa mencetak nilainya.
4.  Buat `IMPLEMENTATION_PLAN.md`.
5.  Laporkan asumsi dan blocker sebelum perubahan besar.

### Phase 1 --- Foundation

-   Setup/validasi Next.js, TypeScript, Tailwind, UI primitives.
-   Buat layout sidebar, routing, loading/error states.
-   Buat schema validation dan config.
-   Tambahkan `.env.example` tanpa secret.
-   Buat migration database awal.

### Phase 2 --- Etsy API client and Product Explorer

-   Buat server-only Etsy adapter.
-   Implementasikan endpoint pencarian yang cocok dengan API access
    aktual.
-   Tambahkan normalization, pagination, error handling, logging aman.
-   Buat Product Explorer dan listing detail.
-   Uji dedup/upsert.

### Phase 3 --- Daily discovery and snapshots

-   Buat discovery seeds configurable.
-   Implementasikan scheduled job/manual trigger.
-   Simpan snapshot dan job_runs.
-   Buat Today's Etsy Trends dengan empty/stale states.
-   Tampilkan timestamp dan data coverage.

### Phase 4 --- Trend scoring and Idea Vault

-   Implementasikan delta 7/30/90 hari.
-   Tambahkan classification dan score breakdown.
-   Buat Idea Vault dan save/update status.
-   Tambahkan unit tests untuk skor dan edge cases.

### Phase 5 --- Competitor Tracker and My Shop

-   Implementasikan tracking toko/listing.
-   Implementasikan OAuth sesuai dokumentasi terkini dan scope yang
    tersedia.
-   Mulai dengan tampilan read-only.
-   Pisahkan data privat toko dari data publik.

### Phase 6 --- n8n and reports

-   Buat workflow export/documentation atau instruksi setup.
-   Implementasikan status job dan dedup alerts.
-   Tambahkan report mingguan dan AI opsional.

### Phase 7 --- Hardening

-   Jalankan lint, typecheck, unit tests, dan build.
-   Periksa aksesibilitas, responsivitas, RLS, log, secrets, rate limit.
-   Dokumentasikan deployment, env, OAuth callback, dan setup n8n.
-   Pastikan semua acceptance criteria utama lulus.

## 18. Testing Requirements

Unit tests: - normalize listing payload; - score calculation with
missing components; - delta calculation with zero/null baseline; -
classification with insufficient snapshots; - alert deduplication; -
timezone/date range boundaries.

Integration tests: - Etsy adapter handles successful response, empty
result, 401/403, 429, timeout, and malformed response. - Database upsert
idempotency. - Snapshot append behavior. - OAuth state mismatch
rejection. - User cannot read private data without authorization.

UI tests: - Today's Etsy Trends empty/loading/stale/loaded states. -
Filter and sort behavior. - Save to Idea Vault. - Competitor
add/remove. - Disconnected/expired OAuth states.

Jangan mengandalkan test yang memerlukan live Etsy credentials pada CI.
Mock adapter untuk unit/integration tests, dan sediakan smoke test
manual yang hanya dijalankan ketika credentials tersedia.

## 19. Environment Variables

Buat `.env.example` dengan nama variabel tanpa nilai rahasia. Sesuaikan
nama akhir saat implementasi: - `NEXT_PUBLIC_SUPABASE_URL` -
`NEXT_PUBLIC_SUPABASE_ANON_KEY` - `SUPABASE_SERVICE_ROLE_KEY`
(server-only) - `ETSY_API_KEY` - `ETSY_SHARED_SECRET` atau client secret
sesuai konfigurasi Etsy yang berlaku - `ETSY_REDIRECT_URI` -
`TOKEN_ENCRYPTION_KEY` (jika token dienkripsi oleh aplikasi) -
`N8N_BASE_URL` (server-only bila diperlukan) - `N8N_WEBHOOK_SECRET` -
`AI_PROVIDER_API_KEY` (opsional) - `APP_TIMEZONE=Asia/Jakarta`

Jangan meminta pengguna menempelkan secret ke chat atau commit secret ke
Git. Pastikan nama dan metode OAuth diverifikasi dengan dokumentasi Etsy
terkini sebelum implementasi.

## 20. Deliverables dari Coding Agent

Agent harus menghasilkan: 1. Aplikasi yang berjalan lokal. 2. Struktur
folder yang terdokumentasi. 3. Database migration files. 4.
`.env.example`. 5. Etsy API adapter server-only. 6. Today's Etsy Trends
page dan Product Explorer. 7. Snapshot/trend scoring services dan tests.
8. Idea Vault. 9. Integrasi OAuth toko sendiri sesuai access/scope yang
tersedia, atau dokumentasi blocker jika belum dapat diaktifkan. 10.
Workflow n8n atau dokumentasi konfigurasi. 11. README dengan setup,
migration, OAuth, n8n, test, dan deployment. 12.
`IMPLEMENTATION_PLAN.md` dan checklist acceptance criteria yang
diperbarui. 13. Ringkasan file yang berubah, perintah yang dijalankan,
hasil test, dan keterbatasan yang tersisa.

## 21. Instruksi Operasional untuk Coding Agent

-   Baca PRD ini sepenuhnya sebelum coding.
-   Inspeksi repo terlebih dahulu dan jangan mengasumsikan repo kosong.
-   Jangan mengganti stack yang sudah ada tanpa alasan yang jelas.
-   Implementasikan satu fase pada satu waktu; setelah setiap fase
    jalankan lint/typecheck/tests yang relevan.
-   Jangan mengarang endpoint, field API, atau OAuth scope. Verifikasi
    terhadap dokumentasi Etsy Open API v3 terkini dan access level yang
    tersedia.
-   Jika fitur tidak didukung API, buat adapter/interface dan tandai
    sebagai blocker/unsupported; jangan membuat data palsu.
-   Jangan menaruh rahasia di frontend, log, screenshot, atau
    dokumentasi.
-   Gunakan komponen reusable, TypeScript types, validasi input, dan
    error handling.
-   Jangan memasukkan demo data ke production path.
-   Jangan menghapus file atau data pengguna yang sudah ada.
-   Jika ada keputusan yang tidak bisa ditentukan dari repo/API, pilih
    opsi paling aman dan dokumentasikan asumsi; tanyakan pengguna hanya
    bila keputusan itu benar-benar memblokir pekerjaan.
-   Pada akhir setiap fase, laporkan apa yang selesai, tes yang
    dijalankan, hasilnya, dan fase berikutnya.
-   Jangan menyatakan fitur selesai jika hanya dibuat UI tanpa integrasi
    nyata.

## 22. Definisi Selesai (MVP)

MVP dianggap selesai ketika: - Aplikasi dapat berjalan lokal dengan
instruksi README. - Today's Etsy Trends tampil sebagai landing page dan
membaca hasil discovery tersimpan. - Daily job dapat mengambil listing
melalui endpoint yang diizinkan, menyimpan snapshot, dan mencatat
status. - UI membedakan kandidat baru dari tren dengan histori
memadai. - Product Explorer dan Idea Vault berfungsi. - Toko sendiri
dapat dihubungkan jika credentials/scope tersedia; jika belum, status
dan blocker dijelaskan. - Snapshot, delta, score, dan confidence dapat
diuji. - Tidak ada klaim penjualan kompetitor yang tidak didukung. -
Rate-limit handling, logging aman, dan empty/error/stale states
berfungsi. - Dokumentasi setup dan hasil pengujian tersedia.

------------------------------------------------------------------------

## Referensi yang wajib diverifikasi sebelum coding

-   Etsy Open API v3 Reference:
    https://developers.etsy.com/documentation/reference/
-   Etsy API tutorials:
    https://developers.etsy.com/documentation/tutorials/
-   Etsy API essentials / rate limits:
    https://developers.etsy.com/documentation/essentials/rate-limits/
-   Supabase documentation: https://supabase.com/docs
-   Next.js documentation: https://nextjs.org/docs
-   n8n documentation: https://docs.n8n.io/

**Catatan:** PRD ini adalah spesifikasi produk dan implementasi awal.
Endpoint Etsy, field respons, scope OAuth, kebijakan penyimpanan, dan
access level wajib diverifikasi lagi berdasarkan aplikasi Etsy yang
benar-benar dimiliki sebelum mengimplementasikan integrasi.
