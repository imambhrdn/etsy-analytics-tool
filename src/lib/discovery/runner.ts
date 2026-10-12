import "server-only";
import { EtsyClient } from "@/lib/etsy/client";
import { upsertListings } from "@/lib/db/listings-repo";
import {
  getDiscoverySeeds,
  startJobRun,
  finishJobRun,
  saveDailyTrendResults,
  updateDiscoverySeed,
} from "@/lib/db/discovery-repo";
import { createServerDb } from "@/lib/db/supabase-server";

export type DiscoveryJobSummary = {
  jobRunId: string;
  status: "success" | "partial" | "failed";
  seedsProcessed: number;
  seedsFailed: number;
  listingsFound: number;
  trendResultsSaved: number;
  errors: string[];
  runDate: string;
};

/**
 * Heuristik skor awal (PRD §9.2):
 * Menghitung skor 0–100 berdasarkan perhatian (favorit) dan kestabilan data.
 */
function calculatePreliminaryScore(params: {
  favorers: number;
  snapshotCount: number;
  favorersDelta: number;
  hasPrice: boolean;
}): number {
  // 1. Attention score: min(favorers / 500, 1) * 40
  const attention = Math.min((params.favorers || 0) / 300, 1) * 40;

  // 2. Momentum score: jika delta positif, beri bobot hingga 35
  const momentum = params.favorersDelta > 0 ? Math.min(params.favorersDelta * 5, 35) : 10;

  // 3. Data sufficiency score: 1 snapshot = 5, 2 = 15, 3+ = 25
  const sufficiency = Math.min(params.snapshotCount * 8, 25);

  const total = attention + momentum + sufficiency;
  return Number(Math.min(Math.max(total, 5), 100).toFixed(1));
}

/**
 * Runner Daily Discovery Job (PRD §8.2).
 * Idempotent, mendukung partial success, append snapshot, dan klasifikasi awal.
 */
export async function runDiscoveryJob(options?: {
  maxListingsPerSeed?: number;
  specificSeedId?: string;
}): Promise<DiscoveryJobSummary> {
  const jobRunId = await startJobRun("daily_discovery");
  const now = new Date();
  const runDate = now.toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const limitPerSeed = options?.maxListingsPerSeed ?? 24;

  const db = createServerDb();
  const client = new EtsyClient();

  const allSeeds = await getDiscoverySeeds(true);
  const activeSeeds = options?.specificSeedId
    ? allSeeds.filter((s) => s.id === options.specificSeedId)
    : allSeeds;

  let totalListingsSeen = 0;
  let totalTrendResults = 0;
  let seedsFailed = 0;
  const errors: string[] = [];

  for (const seed of activeSeeds) {
    try {
      console.log(`[DiscoveryJob] Memproses seed: "${seed.keyword}" (${seed.category || "General"})`);

      // 1. Fetch listing dari Etsy API
      const searchData = await client.searchActiveListings({
        keywords: seed.keyword,
        limit: limitPerSeed,
      });

      const rawListings = searchData.results;
      totalListingsSeen += rawListings.length;

      if (rawListings.length === 0) {
        await updateDiscoverySeed(seed.id, { last_run_at: now.toISOString() });
        continue;
      }

      // 2. Upsert ke database (listings & listing_snapshots)
      const upsertedRows = await upsertListings(rawListings, "daily_discovery");
      const listingIdMap = new Map(upsertedRows.map((r) => [Number(r.etsy_listing_id), r.id]));

      // 3. Ambil snapshots historis untuk kandidat ini untuk menghitung klasifikasi
      const dbListingIds = Array.from(listingIdMap.values());
      const { data: dbSnapshots } = await db
        .from("listing_snapshots")
        .select("listing_id, num_favorers, captured_at")
        .in("listing_id", dbListingIds)
        .order("captured_at", { ascending: false });

      // Kelompokkan snapshot per listing_id
      const snapshotsPerListing = new Map<string, Array<{ num_favorers: number | null }>>();
      for (const snap of dbSnapshots || []) {
        const list = snapshotsPerListing.get(snap.listing_id) || [];
        list.push(snap);
        snapshotsPerListing.set(snap.listing_id, list);
      }

      // 4. Hitung klasifikasi, confidence, dan skor untuk daily_trend_results
      const trendRows = rawListings
        .filter((l) => listingIdMap.has(l.etsyListingId))
        .map((l) => {
          const dbId = listingIdMap.get(l.etsyListingId)!;
          const snaps = snapshotsPerListing.get(dbId) || [];
          const snapCount = snaps.length;

          const currentFavorers = l.numFavorers || 0;
          const prevFavorers = snaps[1]?.num_favorers ?? currentFavorers;
          const favorersDelta = currentFavorers - prevFavorers;

          // Klasifikasi heuristik (PRD §9.1):
          // Emerging: baru ditemukan / data historis <= 1 snapshot
          // Accelerating: observasi cukup (>=2) dan delta positif
          // Established: perhatian tinggi (favorit >= 150)
          let classification: "emerging" | "accelerating" | "established" = "emerging";
          if (snapCount >= 2 && favorersDelta > 0) {
            classification = "accelerating";
          } else if (currentFavorers >= 150) {
            classification = "established";
          }

          // Confidence (PRD §9.5):
          const confidence: "Low" | "Medium" | "High" =
            snapCount <= 1 ? "Low" : snapCount <= 3 ? "Medium" : "High";

          const score = calculatePreliminaryScore({
            favorers: currentFavorers,
            snapshotCount: snapCount,
            favorersDelta,
            hasPrice: l.price > 0,
          });

          return {
            run_date: runDate,
            listing_id: dbId,
            niche_key: seed.keyword,
            classification,
            score,
            confidence,
            score_breakdown: {
              attention_favorers: currentFavorers,
              favorers_delta: favorersDelta,
              observation_count: snapCount,
              seed_priority: seed.priority,
            },
            evidence: {
              seed_keyword: seed.keyword,
              category: seed.category,
              favorers_delta: favorersDelta,
              snap_count: snapCount,
              observed_at: now.toISOString(),
            },
          };
        });

      // 5. Simpan ke daily_trend_results
      if (trendRows.length > 0) {
        await saveDailyTrendResults(trendRows);
        totalTrendResults += trendRows.length;
      }

      // 6. Update seed last_run_at
      await updateDiscoverySeed(seed.id, { last_run_at: now.toISOString() });
    } catch (seedErr: unknown) {
      seedsFailed++;
      const msg = `Seed "${seed.keyword}" gagal: ${(seedErr as Error).message}`;
      console.warn(`[DiscoveryJob] ${msg}`);
      errors.push(msg);
      // Partial success (P3-08): lanjut ke seed berikutnya, jangan hentikan job!
    }
  }

  const finalStatus: "success" | "partial" | "failed" =
    seedsFailed === 0
      ? "success"
      : seedsFailed < activeSeeds.length
        ? "partial"
        : "failed";

  await finishJobRun(jobRunId, {
    status: finalStatus,
    itemsProcessed: totalListingsSeen,
    itemsFailed: seedsFailed,
    errorSummary: errors.length > 0 ? errors.join("; ") : undefined,
    metadata: {
      runDate,
      seedsTotal: activeSeeds.length,
      seedsFailed,
      trendResultsSaved: totalTrendResults,
    },
  });

  return {
    jobRunId,
    status: finalStatus,
    seedsProcessed: activeSeeds.length - seedsFailed,
    seedsFailed,
    listingsFound: totalListingsSeen,
    trendResultsSaved: totalTrendResults,
    errors,
    runDate,
  };
}
