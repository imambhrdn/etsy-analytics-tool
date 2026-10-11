import { NextResponse } from "next/server";
import { z } from "zod";
import { EtsyClient } from "@/lib/etsy/client";
import { recordSearchRun, upsertListings } from "@/lib/db/listings-repo";

const querySchema = z.object({
  q: z.string().trim().min(1, "Kata kunci tidak boleh kosong").max(100),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(24),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  sort_on: z.enum(["created", "price", "updated", "score"]).default("created"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      q: searchParams.get("q") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      min_price: searchParams.get("min_price") ?? undefined,
      max_price: searchParams.get("max_price") ?? undefined,
      sort_on: searchParams.get("sort_on") ?? undefined,
      sort_order: searchParams.get("sort_order") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Parameter tidak valid", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { q, page, limit, min_price, max_price, sort_on, sort_order } = parsed.data;
    const offset = (page - 1) * limit;

    const client = new EtsyClient();
    const data = await client.searchActiveListings({
      keywords: q,
      limit,
      offset,
      minPrice: min_price,
      maxPrice: max_price,
      sortOn: sort_on,
      sortOrder: sort_order,
    });

    // Catat search_run & simpan listings ke DB (PRD §7.2, P2-08, P2-09)
    try {
      await recordSearchRun({
        keyword: q,
        filters: { min_price, max_price, sort_on, sort_order, page, limit },
        itemsSeen: data.results.length,
        status: "success",
        source: "api_products",
      });
      await upsertListings(data.results);
    } catch (dbErr) {
      console.warn("[api/products] Gagal sinkronisasi DB (tetap return hasil API):", dbErr);
    }

    return NextResponse.json({
      query: q,
      page,
      limit,
      totalCount: data.count,
      results: data.results,
      rateLimit: data.rateLimit,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal";
    console.error("[api/products] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
