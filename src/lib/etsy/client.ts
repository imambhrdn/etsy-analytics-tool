import "server-only";
import { getServerEnv } from "@/lib/config/env";
import { normalizeListing } from "./normalizer";
import type {
  EtsyActiveListingsResponse,
  EtsyImagesResponse,
  EtsyListingImage,
  EtsyRawListing,
  EtsyRawShop,
  NormalizedListing,
  SearchListingsParams,
} from "./types";

const BASE_URL = "https://openapi.etsy.com/v3/application";

export type EtsyRateLimit = {
  limitPerDay: number | null;
  remainingToday: number | null;
  limitPerSecond: number | null;
  remainingThisSecond: number | null;
};

export class EtsyApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = "EtsyApiError";
  }
}

/**
 * Parsing header rate-limit dari respons Etsy secara aman.
 */
function parseRateLimit(headers: Headers): EtsyRateLimit {
  const num = (h: string) => {
    const v = headers.get(h);
    return v !== null && !isNaN(Number(v)) ? Number(v) : null;
  };
  return {
    limitPerDay: num("x-limit-per-day"),
    remainingToday: num("x-remaining-today"),
    limitPerSecond: num("x-limit-per-second"),
    remainingThisSecond: num("x-remaining-this-secon"),
  };
}

/**
 * Etsy API Client terisolasi (server-only).
 * Mematuhi rate-limit, exponential backoff, dan logging aman (tanpa secret).
 */
export class EtsyClient {
  private apiKey: string;

  constructor() {
    const env = getServerEnv();
    if (!env.ETSY_API_KEY || !env.ETSY_SHARED_SECRET) {
      throw new Error("ETSY_API_KEY atau ETSY_SHARED_SECRET belum dikonfigurasi.");
    }
    this.apiKey = `${env.ETSY_API_KEY}:${env.ETSY_SHARED_SECRET}`;
  }

  /**
   * Request helper dengan penanganan error, 429 retry-after, dan safe logging.
   */
  private async request<T>(
    endpoint: string,
    params?: Record<string, string | number | undefined>,
    retries = 2,
  ): Promise<{ data: T; rateLimit: EtsyRateLimit }> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== "") {
          url.searchParams.set(k, String(v));
        }
      }
    }

    const t0 = performance.now();

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url.toString(), {
          headers: {
            "x-api-key": this.apiKey,
            Accept: "application/json",
          },
          // Cache default 60 detik untuk pencarian berulang (PRD §8.3)
          next: { revalidate: 60 },
        });

        const rateLimit = parseRateLimit(res.headers);
        const duration = Math.round(performance.now() - t0);

        // Logging terstruktur dan AMAN (tanpa rahasia/token - PRD §5, §12)
        console.log(
          `[EtsyClient] GET ${endpoint} -> HTTP ${res.status} (${duration}ms) [rem: ${rateLimit.remainingToday}/${rateLimit.limitPerDay}]`,
        );

        if (res.status === 429) {
          const retryAfterSec = Number(res.headers.get("retry-after")) || (attempt + 1) * 2;
          if (attempt < retries) {
            console.warn(`[EtsyClient] Rate limit 429. Menunggu ${retryAfterSec}s sebelum retry...`);
            await new Promise((r) => setTimeout(r, retryAfterSec * 1000));
            continue;
          }
          throw new EtsyApiError("Etsy rate limit terlampaui (429)", 429, retryAfterSec);
        }

        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          throw new EtsyApiError(
            `Etsy API error HTTP ${res.status}: ${errBody.slice(0, 200)}`,
            res.status,
          );
        }

        const data = (await res.json()) as T;
        return { data, rateLimit };
      } catch (err: unknown) {
        if (err instanceof EtsyApiError) throw err;
        if (attempt >= retries) {
          throw new EtsyApiError(
            `Network error saat menghubungi Etsy: ${(err as Error).message}`,
            500,
          );
        }
        await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
      }
    }

    throw new EtsyApiError("Gagal setelah retry", 500);
  }

  /**
   * Cari listing aktif publik (findAllListingsActive - PRD §7.2).
   */
  async searchActiveListings(
    params: SearchListingsParams,
  ): Promise<{
    count: number;
    results: NormalizedListing[];
    rateLimit: EtsyRateLimit;
  }> {
    const { data, rateLimit } = await this.request<EtsyActiveListingsResponse>(
      "/listings/active",
      {
        keywords: params.keywords,
        limit: Math.min(Math.max(params.limit ?? 25, 1), 100),
        offset: Math.max(params.offset ?? 0, 0),
        min_price: params.minPrice,
        max_price: params.maxPrice,
        sort_on: params.sortOn,
        sort_order: params.sortOrder,
        taxonomy_id: params.taxonomyId,
      },
    );

    const results = (data.results || []).map(normalizeListing);
    return {
      count: data.count || 0,
      results,
      rateLimit,
    };
  }

  /**
   * Ambil detail listing tunggal beserta asosiasi Images & Shop (PRD §7.3).
   */
  async getListing(listingId: number): Promise<{
    listing: NormalizedListing;
    images: EtsyListingImage[];
    rateLimit: EtsyRateLimit;
  }> {
    const { data, rateLimit } = await this.request<EtsyRawListing>(
      `/listings/${listingId}`,
      { includes: "Images,Shop" },
    );

    const images = Array.isArray(data.images) ? data.images : [];
    const listing = normalizeListing(data);

    // Ambil gambar utama jika listing belum punya
    if (!listing.imageUrl && images[0]?.url_570xN) {
      listing.imageUrl = images[0].url_570xN;
    }

    return { listing, images, rateLimit };
  }

  /**
   * Ambil daftar gambar listing.
   */
  async getListingImages(listingId: number): Promise<EtsyListingImage[]> {
    const { data } = await this.request<EtsyImagesResponse>(
      `/listings/${listingId}/images`,
    );
    return data.results || [];
  }

  /**
   * Ambil info shop publik (PRD §7.4).
   */
  async getShop(shopId: number): Promise<EtsyRawShop | null> {
    try {
      const { data } = await this.request<EtsyRawShop>(`/shops/${shopId}`);
      return data;
    } catch {
      return null;
    }
  }
}
