export type EtsyMoney = {
  amount: number;
  divisor: number;
  currency_code: string;
};

export type EtsyListingImage = {
  listing_image_id: number;
  url_75x75?: string;
  url_170x135?: string;
  url_570xN?: string;
  url_fullxfull?: string;
  alt_text?: string | null;
};

export type EtsyListingVideo = {
  video_id: number;
  height?: number;
  width?: number;
  thumbnail_url?: string;
  video_url?: string;
  video_state?: string;
};

export type EtsyRawShop = {
  shop_id: number;
  shop_name: string;
  title?: string | null;
  url?: string;
  num_favorers?: number;
  listing_active_count?: number;
  transaction_sold_count?: number;
  review_count?: number;
  shop_location_country_iso?: string | null;
  shipping_from_country_iso?: string | null;
};

export type EtsyRawListing = {
  listing_id: number;
  user_id?: number;
  shop_id?: number;
  title: string;
  description?: string;
  state: string;
  quantity?: number;
  url: string;
  num_favorers?: number;
  listing_type?: string;
  tags?: string[];
  materials?: string[];
  created_timestamp?: number;
  updated_timestamp?: number;
  price: EtsyMoney;
  images?: EtsyListingImage[];
  videos?: EtsyListingVideo[];
  shop?: EtsyRawShop;
  [key: string]: unknown;
};

export type EtsyActiveListingsResponse = {
  count: number;
  results: EtsyRawListing[];
};

export type EtsyImagesResponse = {
  count: number;
  results: EtsyListingImage[];
};

export type EtsyVideosResponse = {
  count: number;
  results: EtsyListingVideo[];
};

export type NormalizedListing = {
  etsyListingId: number;
  title: string;
  description: string | null;
  url: string;
  price: number;
  currencyCode: string;
  quantity: number | null;
  numFavorers: number | null;
  state: string;
  listingType: string | null;
  tags: string[];
  shopId: number | null;
  shopName: string | null;
  shopUrl: string | null;
  shopCountryCode: string | null;
  shopSoldCount: number | null;
  shopReviewCount: number | null;
  imageUrl: string | null;
  imageUrls: string[];
  videos: EtsyListingVideo[];
  createdAtEtsy: string | null;
  updatedAtEtsy: string | null;
  rawData: Record<string, unknown>;
};

export type SearchListingsParams = {
  keywords?: string;
  limit?: number; // max 100 per Etsy spec, default 25
  offset?: number;
  minPrice?: number;
  maxPrice?: number;
  sortOn?: "created" | "price" | "updated" | "score";
  sortOrder?: "asc" | "desc";
  taxonomyId?: number;
};
