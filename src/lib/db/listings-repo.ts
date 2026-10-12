import "server-only";
import { createServerDb } from "./supabase-server";
import type { NormalizedListing } from "@/lib/etsy/types";

export type SearchRunRecord = {
  id: string;
  keyword: string;
  category?: string | null;
  filters?: Record<string, unknown>;
  startedAt: string;
  completedAt?: string | null;
  status: "success" | "partial" | "failed";
  itemsSeen: number;
  errorSummary?: string | null;
  source: string;
};

/**
 * Catat run pencarian ke tabel search_runs (PRD §7.2, §10).
 */
export async function recordSearchRun(params: {
  keyword: string;
  category?: string;
  filters?: Record<string, unknown>;
  itemsSeen: number;
  status: "success" | "failed";
  errorSummary?: string;
  source?: string;
}) {
  const db = createServerDb();
  const { data, error } = await db
    .from("search_runs")
    .insert({
      keyword: params.keyword,
      category: params.category ?? null,
      filters: params.filters ?? {},
      items_seen: params.itemsSeen,
      status: params.status,
      error_summary: params.errorSummary ?? null,
      source: params.source ?? "explorer",
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("[listings-repo] Gagal mencatat search_run:", error.message);
    return null;
  }
  return data?.id as string;
}

/**
 * Upsert listings ke database dengan dedup berdasarkan etsy_listing_id (PRD §7.2, §10).
 * Juga mencatat snapshot harian ke listing_snapshots (append-only, idempotence by capture_window).
 */
export async function upsertListings(listings: NormalizedListing[], source = "explorer") {
  if (listings.length === 0) return [];
  const db = createServerDb();
  const now = new Date().toISOString();
  const captureWindow = now.slice(0, 10); // 'YYYY-MM-DD'

  const rows = listings.map((l) => ({
    etsy_listing_id: l.etsyListingId,
    title: l.title,
    description: l.description,
    url: l.url,
    currency_code: l.currencyCode,
    price: l.price,
    quantity: l.quantity,
    num_favorers: l.numFavorers,
    state: l.state,
    listing_type: l.listingType,
    created_at_etsy: l.createdAtEtsy,
    updated_at_etsy: l.updatedAtEtsy,
    last_seen_at: now,
    raw_data: l.rawData,
    updated_at: now,
  }));

  // Upsert listings berdasarkan etsy_listing_id
  const { data: upserted, error } = await db
    .from("listings")
    .upsert(rows, { onConflict: "etsy_listing_id" })
    .select("id, etsy_listing_id");

  if (error) {
    console.error("[listings-repo] Gagal upsert listings:", error.message);
    throw error;
  }

  // Simpan snapshot harian append-only untuk tiap listing yang tersimpan
  if (upserted && upserted.length > 0) {
    const listingIdMap = new Map(upserted.map((u) => [Number(u.etsy_listing_id), u.id]));
    const snapshots = listings
      .filter((l) => listingIdMap.has(l.etsyListingId))
      .map((l) => ({
        listing_id: listingIdMap.get(l.etsyListingId),
        price: l.price,
        currency_code: l.currencyCode,
        num_favorers: l.numFavorers,
        quantity: l.quantity,
        state: l.state,
        source,
        capture_window: captureWindow,
        captured_at: now,
      }));

    if (snapshots.length > 0) {
      const { error: snapErr } = await db
        .from("listing_snapshots")
        .upsert(snapshots, {
          onConflict: "listing_id,capture_window",
          ignoreDuplicates: true, // Jangan timpa jika sudah ada snapshot di jendela yang sama
        });
      if (snapErr) {
        console.warn("[listings-repo] Gagal mencatat snapshots:", snapErr.message);
      }
    }
  }

  return upserted || [];
}

/**
 * Ambil listing tersimpan beserta riwayat snapshot dari database (PRD §7.3).
 */
export async function getStoredListing(etsyListingId: number) {
  const db = createServerDb();
  const { data: listing, error } = await db
    .from("listings")
    .select("*, listing_snapshots(*)")
    .eq("etsy_listing_id", etsyListingId)
    .single();

  if (error || !listing) return null;
  return listing;
}

/**
 * Simpan ide produk ke Idea Vault (PRD §7.5).
 */
export async function saveProductIdea(params: {
  listingId?: string;
  title: string;
  category?: string;
  notes?: string;
  targetPrice?: number;
  sourceUrl?: string;
}) {
  const db = createServerDb();
  const { data, error } = await db
    .from("product_ideas")
    .insert({
      listing_id: params.listingId ?? null,
      title: params.title,
      category: params.category ?? null,
      notes: params.notes ?? null,
      target_price: params.targetPrice ?? null,
      source_url: params.sourceUrl ?? null,
      status: "Discovered",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[listings-repo] Gagal menyimpan ide:", error.message);
    throw error;
  }
  return data?.id as string;
}
