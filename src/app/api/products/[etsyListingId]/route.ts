import { NextResponse } from "next/server";
import { EtsyClient } from "@/lib/etsy/client";
import { getStoredListing, upsertListings } from "@/lib/db/listings-repo";

export async function GET(
  _request: Request,
  context: { params: Promise<{ etsyListingId: string }> },
) {
  try {
    const { etsyListingId } = await context.params;
    const listingId = Number(etsyListingId);

    if (isNaN(listingId) || listingId <= 0) {
      return NextResponse.json({ error: "ID listing tidak valid" }, { status: 400 });
    }

    const client = new EtsyClient();
    const { listing, images, rateLimit } = await client.getListing(listingId);

    // Ambil histori snapshot dari database lokal
    let stored = null;
    try {
      await upsertListings([listing]);
      stored = await getStoredListing(listingId);
    } catch (dbErr) {
      console.warn("[api/products/[id]] Gagal simpan/baca DB:", dbErr);
    }

    return NextResponse.json({
      listing,
      images,
      snapshots: stored?.listing_snapshots || [],
      storedAt: stored?.first_seen_at || null,
      lastSeenAt: stored?.last_seen_at || null,
      rateLimit,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal";
    console.error("[api/products/[id]] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
