import type { EtsyRawListing, NormalizedListing } from "./types";

/**
 * Normalisasi payload listing mentah Etsy ke model domain internal.
 * Menangani edge case harga (amount / divisor), timestamp epoch -> ISO,
 * dan field nullable tanpa mengasumsikan field kosong = nol.
 */
export function normalizeListing(raw: EtsyRawListing): NormalizedListing {
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

  // Semua gambar (untuk galeri di kartu & detail)
  const imageUrls = Array.isArray(raw.images)
    ? raw.images
        .map((img) => img.url_570xN || img.url_fullxfull || img.url_170x135)
        .filter((u): u is string => Boolean(u))
    : [];

  // Video listing (hanya yang aktif)
  const videos = Array.isArray(raw.videos)
    ? raw.videos.filter((v) => v.video_url && v.video_state !== "deleted")
    : [];

  const shopCountryCode =
    raw.shop?.shop_location_country_iso ||
    raw.shop?.shipping_from_country_iso ||
    null;

  const shopUrl =
    raw.shop?.url ||
    (raw.shop?.shop_name
      ? `https://www.etsy.com/shop/${raw.shop.shop_name}`
      : null);

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
    shopUrl,
    shopCountryCode,
    shopSoldCount: typeof raw.shop?.transaction_sold_count === "number" ? raw.shop.transaction_sold_count : null,
    shopReviewCount: typeof raw.shop?.review_count === "number" ? raw.shop.review_count : null,
    imageUrl,
    imageUrls,
    videos,
    createdAtEtsy,
    updatedAtEtsy,
    rawData: raw as Record<string, unknown>,
  };
}
