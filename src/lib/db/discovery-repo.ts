import "server-only";
import { createServerDb } from "./supabase-server";

export type DiscoverySeed = {
  id: string;
  keyword: string;
  category: string | null;
  enabled: boolean;
  priority: number;
  max_pages: number;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
};

export type JobRun = {
  id: string;
  job_type: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "success" | "partial" | "failed";
  items_processed: number;
  items_failed: number;
  error_summary: string | null;
  metadata: Record<string, unknown> | null;
};

export type DailyTrendResult = {
  id: string;
  run_date: string;
  listing_id: string;
  niche_key: string;
  classification: "emerging" | "accelerating" | "established";
  score: number;
  confidence: "Low" | "Medium" | "High";
  score_breakdown: Record<string, unknown> | null;
  evidence: Record<string, unknown> | null;
  created_at: string;
};

/** 12 Seed awal default lintas kategori sesuai PRD §8.1 */
export const DEFAULT_DISCOVERY_SEEDS = [
  { keyword: "personalized gift", category: "Handmade & Personalized", priority: 10 },
  { keyword: "wedding template", category: "Digital Downloads", priority: 9 },
  { keyword: "printable wall art", category: "Digital Downloads", priority: 8 },
  { keyword: "digital planner", category: "Digital Downloads", priority: 8 },
  { keyword: "custom pet portrait", category: "Handmade & Personalized", priority: 7 },
  { keyword: "handmade jewelry", category: "Jewelry", priority: 7 },
  { keyword: "crochet pattern", category: "Digital Downloads", priority: 6 },
  { keyword: "home decor", category: "Home Decor", priority: 6 },
  { keyword: "personalized mug", category: "Handmade & Personalized", priority: 5 },
  { keyword: "nursery decor", category: "Home Decor", priority: 5 },
  { keyword: "wedding favor", category: "Handmade & Personalized", priority: 4 },
  { keyword: "seasonal gift", category: "Other", priority: 4 },
];

/**
 * Pastikan seed default ada di database jika tabel discovery_seeds masih kosong.
 */
export async function ensureDefaultSeeds(): Promise<DiscoverySeed[]> {
  const db = createServerDb();
  const { data: existing, error } = await db
    .from("discovery_seeds")
    .select("*")
    .order("priority", { ascending: false });

  if (error) {
    console.error("[discovery-repo] Gagal membaca seeds:", error.message);
    throw error;
  }

  if (existing && existing.length > 0) {
    return existing as DiscoverySeed[];
  }

  // Populate default seeds
  const { data: inserted, error: insertErr } = await db
    .from("discovery_seeds")
    .insert(
      DEFAULT_DISCOVERY_SEEDS.map((s) => ({
        keyword: s.keyword,
        category: s.category,
        priority: s.priority,
        enabled: true,
        max_pages: 1,
      })),
    )
    .select("*")
    .order("priority", { ascending: false });

  if (insertErr) {
    console.error("[discovery-repo] Gagal inisialisasi default seeds:", insertErr.message);
    throw insertErr;
  }

  return (inserted || []) as DiscoverySeed[];
}

/**
 * Ambil daftar discovery seeds (bisa difilter yang enabled saja).
 */
export async function getDiscoverySeeds(onlyEnabled = false): Promise<DiscoverySeed[]> {
  const db = createServerDb();
  let query = db
    .from("discovery_seeds")
    .select("*")
    .order("priority", { ascending: false })
    .order("keyword", { ascending: true });

  if (onlyEnabled) {
    query = query.eq("enabled", true);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[discovery-repo] Gagal mengambil seeds:", error.message);
    return [];
  }

  // Jika kosong, inisialisasi default
  if (!data || data.length === 0) {
    return ensureDefaultSeeds();
  }

  return data as DiscoverySeed[];
}

/**
 * Tambah seed keyword baru (PRD §8.1).
 */
export async function addDiscoverySeed(seed: {
  keyword: string;
  category?: string;
  priority?: number;
  maxPages?: number;
}) {
  const db = createServerDb();
  const { data, error } = await db
    .from("discovery_seeds")
    .insert({
      keyword: seed.keyword.trim().toLowerCase(),
      category: seed.category || "Other",
      priority: seed.priority ?? 5,
      max_pages: seed.maxPages ?? 1,
      enabled: true,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[discovery-repo] Gagal menambah seed:", error.message);
    throw error;
  }
  return data as DiscoverySeed;
}

/**
 * Toggle atau update discovery seed.
 */
export async function updateDiscoverySeed(
  id: string,
  updates: Partial<{
    enabled: boolean;
    priority: number;
    category: string;
    last_run_at: string;
  }>,
) {
  const db = createServerDb();
  const { data, error } = await db
    .from("discovery_seeds")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("[discovery-repo] Gagal update seed:", error.message);
    throw error;
  }
  return data as DiscoverySeed;
}

/**
 * Hapus discovery seed.
 */
export async function deleteDiscoverySeed(id: string) {
  const db = createServerDb();
  const { error } = await db.from("discovery_seeds").delete().eq("id", id);
  if (error) {
    console.error("[discovery-repo] Gagal hapus seed:", error.message);
    throw error;
  }
  return true;
}

/**
 * Catat awal job discovery (idempotent guard untuk overlap PRD §8.3).
 */
export async function startJobRun(jobType = "daily_discovery"): Promise<string> {
  const db = createServerDb();
  const now = new Date();

  // Guard overlap: cek apakah ada job yang sedang 'running' dalam 15 menit terakhir
  const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const { data: runningJobs } = await db
    .from("job_runs")
    .select("id, started_at")
    .eq("job_type", jobType)
    .eq("status", "running")
    .gt("started_at", fifteenMinsAgo)
    .limit(1);

  if (runningJobs && runningJobs.length > 0) {
    throw new Error(
      `Job '${jobType}' sedang berjalan (dimulai pada ${runningJobs[0].started_at}). Harap tunggu hingga selesai.`,
    );
  }

  const { data, error } = await db
    .from("job_runs")
    .insert({
      job_type: jobType,
      status: "running",
      started_at: now.toISOString(),
      items_processed: 0,
      items_failed: 0,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Gagal membuat job_run: ${error?.message}`);
  }
  return data.id as string;
}

/**
 * Tandai job run selesai (success / partial / failed) beserta metriknya.
 */
export async function finishJobRun(
  jobRunId: string,
  params: {
    status: "success" | "partial" | "failed";
    itemsProcessed: number;
    itemsFailed: number;
    errorSummary?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const db = createServerDb();
  const { error } = await db
    .from("job_runs")
    .update({
      status: params.status,
      items_processed: params.itemsProcessed,
      items_failed: params.itemsFailed,
      error_summary: params.errorSummary || null,
      metadata: params.metadata || {},
      finished_at: new Date().toISOString(),
    })
    .eq("id", jobRunId);

  if (error) {
    console.error("[discovery-repo] Gagal menyelesaikan job_run:", error.message);
  }
}

/**
 * Ambil job run discovery terakhir.
 */
export async function getLastDiscoveryJob(): Promise<JobRun | null> {
  const db = createServerDb();
  const { data, error } = await db
    .from("job_runs")
    .select("*")
    .eq("job_type", "daily_discovery")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[discovery-repo] Gagal mengambil last job:", error.message);
    return null;
  }
  return data as JobRun | null;
}

/**
 * Simpan hasil daily trend results (reproducible, idempotent by run_date, listing_id, niche_key).
 */
export async function saveDailyTrendResults(
  results: Array<{
    run_date: string;
    listing_id: string;
    niche_key: string;
    classification: "emerging" | "accelerating" | "established";
    score: number;
    confidence: "Low" | "Medium" | "High";
    score_breakdown: Record<string, unknown>;
    evidence: Record<string, unknown>;
  }>,
) {
  if (results.length === 0) return [];
  const db = createServerDb();

  const { data, error } = await db
    .from("daily_trend_results")
    .upsert(results, { onConflict: "run_date,listing_id,niche_key" })
    .select("id");

  if (error) {
    console.error("[discovery-repo] Gagal simpan daily_trend_results:", error.message);
    throw error;
  }
  return data || [];
}

/**
 * Ambil data Today's Etsy Trends dari daily_trend_results terakhir bergabung dengan listings.
 */
export async function getTodayTrends(params?: {
  runDate?: string;
  category?: string;
  classification?: string;
  sort?: "fastest_growth" | "most_attention" | "highest_score" | "recent";
}) {
  const db = createServerDb();

  // Cari tanggal run terakhir yang tersedia jika tidak ditentukan
  let targetDate = params?.runDate;
  if (!targetDate) {
    const { data: latestDateRow } = await db
      .from("daily_trend_results")
      .select("run_date")
      .order("run_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    targetDate = latestDateRow?.run_date;
  }

  if (!targetDate) {
    return { runDate: null, results: [], totalCount: 0 };
  }

  let query = db
    .from("daily_trend_results")
    .select(
      `
      id,
      run_date,
      niche_key,
      classification,
      score,
      confidence,
      score_breakdown,
      evidence,
      created_at,
      listings!inner (
        id,
        etsy_listing_id,
        title,
        url,
        price,
        currency_code,
        quantity,
        num_favorers,
        state,
        listing_type,
        first_seen_at,
        last_seen_at,
        raw_data,
        listing_snapshots (
          id,
          price,
          num_favorers,
          captured_at,
          capture_window
        )
      )
    `,
    )
    .eq("run_date", targetDate);

  if (params?.classification && params.classification !== "all") {
    query = query.eq("classification", params.classification);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[discovery-repo] Gagal mengambil trends:", error.message);
    return { runDate: targetDate, results: [], totalCount: 0 };
  }

  // Sorting
  const sorted = [...(data || [])].sort((a, b) => {
    const rawListingA = (a as { listings?: { num_favorers?: number | null; first_seen_at?: string } | { num_favorers?: number | null; first_seen_at?: string }[] }).listings;
    const rawListingB = (b as { listings?: { num_favorers?: number | null; first_seen_at?: string } | { num_favorers?: number | null; first_seen_at?: string }[] }).listings;
    const listA = Array.isArray(rawListingA) ? rawListingA[0] : rawListingA;
    const listB = Array.isArray(rawListingB) ? rawListingB[0] : rawListingB;

    if (params?.sort === "most_attention") {
      const favA = listA?.num_favorers || 0;
      const favB = listB?.num_favorers || 0;
      return favB - favA;
    }
    if (params?.sort === "fastest_growth") {
      const evidenceA = a.evidence as { favorers_delta?: number } | null;
      const evidenceB = b.evidence as { favorers_delta?: number } | null;
      const deltaA = evidenceA?.favorers_delta || 0;
      const deltaB = evidenceB?.favorers_delta || 0;
      return deltaB - deltaA;
    }
    if (params?.sort === "recent") {
      return (
        new Date(listB?.first_seen_at || 0).getTime() -
        new Date(listA?.first_seen_at || 0).getTime()
      );
    }
    // Default: highest score
    return (b.score || 0) - (a.score || 0);
  });

  return {
    runDate: targetDate,
    results: sorted,
    totalCount: sorted.length,
  };
}

/**
 * KPI stats real untuk landing page Today's Etsy Trends (PRD §7.1).
 */
export async function getDiscoveryKpis() {
  const db = createServerDb();

  // 1. Total tracked listings
  const { count: trackedCount } = await db
    .from("listings")
    .select("*", { count: "exact", head: true });

  // 2. Latest run date
  const { data: latestRun } = await db
    .from("daily_trend_results")
    .select("run_date")
    .order("run_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const runDate = latestRun?.run_date || null;

  let emergingCount = 0;
  let acceleratingCount = 0;
  let establishedCount = 0;

  if (runDate) {
    const { count: emg } = await db
      .from("daily_trend_results")
      .select("*", { count: "exact", head: true })
      .eq("run_date", runDate)
      .eq("classification", "emerging");
    emergingCount = emg || 0;

    const { count: acc } = await db
      .from("daily_trend_results")
      .select("*", { count: "exact", head: true })
      .eq("run_date", runDate)
      .eq("classification", "accelerating");
    acceleratingCount = acc || 0;

    const { count: est } = await db
      .from("daily_trend_results")
      .select("*", { count: "exact", head: true })
      .eq("run_date", runDate)
      .eq("classification", "established");
    establishedCount = est || 0;
  }

  // 3. Last Job Run
  const lastJob = await getLastDiscoveryJob();

  return {
    trackedListings: trackedCount || 0,
    runDate,
    emergingCount,
    acceleratingCount,
    establishedCount,
    lastJob,
  };
}
