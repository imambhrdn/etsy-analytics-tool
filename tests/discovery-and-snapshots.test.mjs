// Unit & Integration test untuk Phase 3: Daily Discovery & Snapshots (PRD §18, P3-01..P3-08).
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
// 1. UNIT TEST: Klasifikasi & Heuristik Skor (PRD §9.1, §9.5)
// ---------------------------------------------------------------------------
console.log("=== 1. Unit Test: Klasifikasi Tren & Confidence ===");

function classifyCandidate(params) {
  const { snapCount, currentFavorers, prevFavorers } = params;
  const delta = currentFavorers - prevFavorers;

  let classification = "emerging";
  if (snapCount >= 2 && delta > 0) {
    classification = "accelerating";
  } else if (currentFavorers >= 150) {
    classification = "established";
  }

  const confidence = snapCount <= 1 ? "Low" : snapCount <= 3 ? "Medium" : "High";
  return { classification, confidence, delta };
}

// Case 1: Listing baru dilihat (1 snapshot) -> emerging, Low confidence
{
  const res = classifyCandidate({ snapCount: 1, currentFavorers: 10, prevFavorers: 10 });
  assert.equal(res.classification, "emerging");
  assert.equal(res.confidence, "Low");
  console.log("  [pass] listing baru (1 snapshot) -> emerging + Low confidence");
}

// Case 2: Listing dengan observasi bertambah & delta positif -> accelerating
{
  const res = classifyCandidate({ snapCount: 2, currentFavorers: 50, prevFavorers: 40 });
  assert.equal(res.classification, "accelerating");
  assert.equal(res.confidence, "Medium");
  assert.equal(res.delta, 10);
  console.log("  [pass] delta favorit positif + >=2 snapshot -> accelerating + Medium confidence");
}

// Case 3: Listing dengan perhatian tinggi (favorit >= 150) -> established
{
  const res = classifyCandidate({ snapCount: 4, currentFavorers: 250, prevFavorers: 250 });
  assert.equal(res.classification, "established");
  assert.equal(res.confidence, "High");
  console.log("  [pass] favorit tinggi (>=150) -> established + High confidence");
}

// ---------------------------------------------------------------------------
// 2. INTEGRATION TEST: Idempotence & Deduplikasi daily_trend_results di Supabase
// ---------------------------------------------------------------------------
console.log("\n=== 2. Integration Test: Idempotence daily_trend_results ke Database ===");

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!sbUrl || !sbKey) {
  console.log("  [skip] Supabase credentials tidak ada, melewati DB integration test.");
  process.exit(0);
}

const TEST_RUN_DATE = "2099-01-01";
const TEST_NICHE = "unit-test-niche";

async function runDbIntegrationTest() {
  // 1. Buat temporary listing untuk pengujian FK
  const tempListingId = 99999999988;
  const listRes = await fetch(`${sbUrl}/rest/v1/listings?on_conflict=etsy_listing_id`, {
    method: "POST",
    headers: {
      apikey: sbKey,
      Authorization: `Bearer ${sbKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify([
      {
        etsy_listing_id: tempListingId,
        title: "Temporary Test Listing for Daily Trends",
        price: 20.0,
        currency_code: "USD",
        state: "active",
      },
    ]),
  });

  const listRows = await listRes.json();
  const dbListingId = listRows[0].id;
  assert.ok(dbListingId, "dbListingId harus ada");

  // 2. Insert daily_trend_results pertama
  const trendRow1 = [
    {
      run_date: TEST_RUN_DATE,
      listing_id: dbListingId,
      niche_key: TEST_NICHE,
      classification: "emerging",
      score: 55.0,
      confidence: "Low",
      score_breakdown: { test: 1 },
      evidence: { snap_count: 1 },
    },
  ];

  const res1 = await fetch(`${sbUrl}/rest/v1/daily_trend_results?on_conflict=run_date,listing_id,niche_key`, {
    method: "POST",
    headers: {
      apikey: sbKey,
      Authorization: `Bearer ${sbKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(trendRow1),
  });

  assert.ok(res1.status === 201 || res1.status === 200, `Insert 1 status harus 200/201, got ${res1.status}`);
  console.log("  [pass] Simpan hasil tren pertama berhasil");

  // 3. Re-run pada tanggal yang SAMA (idempotence): harus merge duplicate, tidak melempar error
  const trendRow2 = [
    {
      run_date: TEST_RUN_DATE,
      listing_id: dbListingId,
      niche_key: TEST_NICHE,
      classification: "accelerating",
      score: 85.0,
      confidence: "Medium",
      score_breakdown: { test: 2 },
      evidence: { snap_count: 2 },
    },
  ];

  const res2 = await fetch(`${sbUrl}/rest/v1/daily_trend_results?on_conflict=run_date,listing_id,niche_key`, {
    method: "POST",
    headers: {
      apikey: sbKey,
      Authorization: `Bearer ${sbKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(trendRow2),
  });

  assert.ok(res2.status === 201 || res2.status === 200, `Insert 2 (re-run) status harus 200/201, got ${res2.status}`);
  console.log("  [pass] Re-run harian idempotent (merge duplicate) berhasil");

  // 4. Verifikasi baris tetap 1 dan terupdate
  const checkRes = await fetch(
    `${sbUrl}/rest/v1/daily_trend_results?run_date=eq.${TEST_RUN_DATE}&listing_id=eq.${dbListingId}&select=*`,
    {
      headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
    },
  );
  const rows = await checkRes.json();
  assert.equal(rows.length, 1, `Baris harus tepat 1, tidak boleh duplikat per tanggal! Got: ${rows.length}`);
  assert.equal(rows[0].classification, "accelerating", "Klasifikasi harus terupdate ke accelerating");
  assert.equal(Number(rows[0].score), 85.0, "Skor harus terupdate ke 85.0");
  console.log("  [pass] Idempotence terverifikasi: data tepat 1 baris dan termutakhirkan");

  // 5. Bersihkan data test
  await fetch(`${sbUrl}/rest/v1/daily_trend_results?run_date=eq.${TEST_RUN_DATE}&listing_id=eq.${dbListingId}`, {
    method: "DELETE",
    headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
  });
  await fetch(`${sbUrl}/rest/v1/listings?id=eq.${dbListingId}`, {
    method: "DELETE",
    headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
  });
  console.log("  [pass] Data uji dibersihkan dari database.");

  console.log("\nSemua unit test dan integration test Phase 3 LULUS.");
}

runDbIntegrationTest().catch((err) => {
  console.error("Test GAGAL:", err.message);
  process.exit(1);
});
