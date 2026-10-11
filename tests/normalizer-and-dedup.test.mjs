// Test suite untuk normalisasi listing dan verifikasi dedup/upsert (PRD §18, P2-09).
// Berjalan mandiri via Node.js tanpa framework test tambahan (Ponytail rule).

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return env;
}

const env = loadEnv(path.join(__dirname, "..", ".env.local"));
for (const [k, v] of Object.entries(env)) {
  if (!process.env[k]) process.env[k] = v;
}

// ---------------------------------------------------------------------------
// 1. UNIT TEST: Normalizer
// ---------------------------------------------------------------------------
console.log("=== 1. Menjalankan Unit Test Normalizer ===");

// Implementasi mirror untuk pure test
function normalizeListing(raw) {
  const divisor = raw.price?.divisor && raw.price.divisor > 0 ? raw.price.divisor : 100;
  const rawAmount = typeof raw.price?.amount === "number" ? raw.price.amount : 0;
  const price = Number((rawAmount / divisor).toFixed(2));
  const currencyCode = raw.price?.currency_code || "USD";

  const rawCreated =
    typeof raw.original_creation_timestamp === "number" && raw.original_creation_timestamp > 0
      ? raw.original_creation_timestamp
      : typeof raw.creation_timestamp === "number" && raw.creation_timestamp > 0
        ? raw.creation_timestamp
        : typeof raw.created_timestamp === "number" && raw.created_timestamp > 0
          ? raw.created_timestamp
          : null;

  const createdAtEtsy = rawCreated ? new Date(rawCreated * 1000).toISOString() : null;

  const updatedAtEtsy =
    typeof raw.updated_timestamp === "number" && raw.updated_timestamp > 0
      ? new Date(raw.updated_timestamp * 1000).toISOString()
      : null;

  const firstImg = raw.images?.[0];
  const imageUrl =
    firstImg?.url_570xN ||
    firstImg?.url_fullxfull ||
    firstImg?.url_170x135 ||
    null;

  const imageUrls = Array.isArray(raw.images)
    ? raw.images
        .map((img) => img.url_570xN || img.url_fullxfull || img.url_170x135)
        .filter((u) => Boolean(u))
    : [];

  const videos = Array.isArray(raw.videos)
    ? raw.videos.filter((v) => v.video_url && v.video_state !== "deleted")
    : [];

  return {
    etsyListingId: raw.listing_id,
    title: raw.title || "Untitled Listing",
    description: raw.description ?? null,
    url: raw.url || `https://www.etsy.com/listing/${raw.listing_id}`,
    price,
    currencyCode,
    quantity: typeof raw.quantity === "number" ? raw.quantity : null,
    numFavorers: typeof raw.num_favorers === "number" ? raw.num_favorers : null,
    state: raw.state || "active",
    listingType: raw.listing_type ?? null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    shopId: typeof raw.shop_id === "number" ? raw.shop_id : null,
    shopName: raw.shop?.shop_name ?? null,
    imageUrl,
    imageUrls,
    videos,
    createdAtEtsy,
    updatedAtEtsy,
  };
}

// Test case 1: normal input
{
  const raw = {
    listing_id: 12345,
    title: "Handmade Mug",
    price: { amount: 2999, divisor: 100, currency_code: "USD" },
    quantity: 10,
    num_favorers: 42,
    created_timestamp: 1700000000,
    tags: ["ceramic", "gift"],
    images: [{ listing_image_id: 1, url_570xN: "https://example.com/img.jpg" }],
  };
  const res = normalizeListing(raw);
  assert.equal(res.etsyListingId, 12345);
  assert.equal(res.price, 29.99);
  assert.equal(res.currencyCode, "USD");
  assert.equal(res.numFavorers, 42);
  assert.equal(res.imageUrl, "https://example.com/img.jpg");
  assert.equal(res.tags.length, 2);
  assert.equal(res.imageUrls.length, 1);
  assert.deepEqual(res.videos, []);
  console.log("  [pass] normal input listing");
}

// Test case 2: divisor nol / tidak biasa & field kosong
{
  const raw = {
    listing_id: 99999,
    price: { amount: 500, divisor: 0, currency_code: "EUR" },
  };
  const res = normalizeListing(raw);
  assert.equal(res.price, 5.0);
  assert.equal(res.currencyCode, "EUR");
  assert.equal(res.quantity, null);
  assert.equal(res.numFavorers, null);
  assert.equal(res.imageUrl, null);
  assert.deepEqual(res.tags, []);
  assert.deepEqual(res.imageUrls, []);
  assert.deepEqual(res.videos, []);
  console.log("  [pass] edge case divisor nol & missing fields");
}

// Test case 3: banyak gambar + video (gambar & video ditampilkan semua)
{
  const raw = {
    listing_id: 77777,
    price: { amount: 1000, divisor: 100, currency_code: "USD" },
    images: [
      { listing_image_id: 1, url_570xN: "https://i.etsystatic.com/a.jpg" },
      { listing_image_id: 2, url_570xN: "https://i.etsystatic.com/b.jpg" },
      { listing_image_id: 3, url_570xN: "https://i.etsystatic.com/c.jpg" },
    ],
    videos: [
      { video_id: 1, video_url: "https://v.etsystatic.com/v.mp4", video_state: "active" },
      { video_id: 2, video_url: "https://v.etsystatic.com/deleted.mp4", video_state: "deleted" },
    ],
  };
  const res = normalizeListing(raw);
  assert.equal(res.imageUrls.length, 3, "harus mengambil semua 3 gambar");
  assert.equal(res.videos.length, 1, "video deleted harus difilter");
  assert.equal(res.videos[0].video_url, "https://v.etsystatic.com/v.mp4");
  console.log("  [pass] multi-image & video (deleted difilter)");
}

// ---------------------------------------------------------------------------
// 2. INTEGRATION TEST: Dedup & Upsert ke Supabase
// ---------------------------------------------------------------------------
console.log("\n=== 2. Menjalankan Integration Test Dedup / Upsert ke Database ===");

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!sbUrl || !sbKey) {
  console.log("  [skip] Supabase credentials tidak lengkap, melewati integration test.");
  process.exit(0);
}

const TEST_LISTING_ID = 99999999901;

async function fetchWithRetry(url, options = {}, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

async function runDbTest() {
  // Bersihkan dulu jika ada sisa dari run sebelumnya
  await fetchWithRetry(`${sbUrl}/rest/v1/listings?etsy_listing_id=eq.${TEST_LISTING_ID}`, {
    method: "DELETE",
    headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
  });

  // 1. Upsert pertama
  const body1 = [
    {
      etsy_listing_id: TEST_LISTING_ID,
      title: "Test Listing Dedup V1",
      price: 15.0,
      currency_code: "USD",
      state: "active",
      num_favorers: 10,
      raw_data: { test: true },
    },
  ];

  const res1 = await fetchWithRetry(`${sbUrl}/rest/v1/listings?on_conflict=etsy_listing_id`, {
    method: "POST",
    headers: {
      apikey: sbKey,
      Authorization: `Bearer ${sbKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(body1),
  });

  assert.equal(res1.status, 201, `Upsert 1 harus 201, got ${res1.status}`);
  console.log("  [pass] Upsert pertama berhasil (HTTP 201)");

  // 2. Upsert kedua dengan ID yang SAMA tapi judul & harga berubah
  const body2 = [
    {
      etsy_listing_id: TEST_LISTING_ID,
      title: "Test Listing Dedup V2 (Updated)",
      price: 25.5,
      currency_code: "USD",
      state: "active",
      num_favorers: 15,
      raw_data: { test: true, updated: true },
    },
  ];

  const res2 = await fetchWithRetry(`${sbUrl}/rest/v1/listings?on_conflict=etsy_listing_id`, {
    method: "POST",
    headers: {
      apikey: sbKey,
      Authorization: `Bearer ${sbKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(body2),
  });

  assert.ok(
    res2.status === 200 || res2.status === 201,
    `Upsert 2 harus 200 atau 201, got ${res2.status}`,
  );
  console.log(`  [pass] Upsert kedua (merge duplicate) berhasil (HTTP ${res2.status})`);

  // 3. Verifikasi jumlah baris di DB untuk ID tersebut tetap 1 (dedup terbukti)
  const queryRes = await fetchWithRetry(
    `${sbUrl}/rest/v1/listings?etsy_listing_id=eq.${TEST_LISTING_ID}&select=*`,
    {
      headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
    },
  );
  const rows = await queryRes.json();
  assert.equal(rows.length, 1, `Baris harus tepat 1, tidak boleh duplikat! Got: ${rows.length}`);
  assert.equal(rows[0].title, "Test Listing Dedup V2 (Updated)", "Judul harus terupdate");
  assert.equal(Number(rows[0].price), 25.5, "Harga harus terupdate");
  assert.equal(rows[0].num_favorers, 15, "Favorit harus terupdate");
  console.log("  [pass] Dedup terverifikasi: data baris tepat 1 dan data ter-update!");

  // 4. Bersihkan data test
  await fetchWithRetry(`${sbUrl}/rest/v1/listings?etsy_listing_id=eq.${TEST_LISTING_ID}`, {
    method: "DELETE",
    headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
  });
  console.log("  [pass] Data uji dibersihkan dari database.");

  console.log("\nSemua unit test dan integration test Dedup/Upsert LULUS.");
}

runDbTest().catch((err) => {
  console.error("Test GAGAL:", err.message, err.cause || "");
  process.exit(1);
});
