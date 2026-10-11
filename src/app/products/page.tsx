import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ChevronLeft, ChevronRight, Sparkles, Inbox } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { ProductSearchForm } from "@/components/products/product-search-form";
import { ProductCard } from "@/components/products/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EtsyClient } from "@/lib/etsy/client";
import { recordSearchRun, upsertListings } from "@/lib/db/listings-repo";
import type { NormalizedListing } from "@/lib/etsy/types";

type SearchParams = Promise<{
  q?: string;
  page?: string;
  min_price?: string;
  max_price?: string;
  listing_type?: "download" | "physical" | "";
  sort_on?: "created" | "price" | "updated" | "score";
  sort_order?: "asc" | "desc";
}>;

const PAGE_SIZE = 24;

function ProductGridSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-3">
            <Skeleton className="aspect-4/3 w-full rounded" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

async function ProductResults({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const currentPage = Math.max(Number(params.page) || 1, 1);
  const minPrice = params.min_price ? Number(params.min_price) : undefined;
  const maxPrice = params.max_price ? Number(params.max_price) : undefined;
  const listingType = params.listing_type || undefined;
  const sortOn = params.sort_on ?? "created";
  const sortOrder = params.sort_order ?? "desc";

  let listings: NormalizedListing[] = [];
  let totalCount = 0;
  let errorMsg: string | null = null;
  let quotaRemaining: number | null = null;

  if (q) {
    try {
      const client = new EtsyClient();
      const offset = (currentPage - 1) * PAGE_SIZE;

      const data = await client.searchActiveListings({
        keywords: q,
        limit: PAGE_SIZE,
        offset,
        minPrice,
        maxPrice,
        sortOn,
        sortOrder,
      });

      // Filter berdasarkan tipe listing jika dipilih
      listings = listingType
        ? data.results.filter((l) => l.listingType === listingType)
        : data.results;
      totalCount = listingType ? listings.length : data.count;
      quotaRemaining = data.rateLimit.remainingToday;

      try {
        await recordSearchRun({
          keyword: q,
          filters: { minPrice, maxPrice, listingType, sortOn, sortOrder, page: currentPage },
          itemsSeen: listings.length,
          status: "success",
          source: "explorer",
        });
        await upsertListings(data.results);
      } catch (dbErr) {
        console.warn("[ProductsPage] Gagal menyimpan ke DB:", dbErr);
      }
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : "Gagal mengambil data dari Etsy API";
      try {
        await recordSearchRun({
          keyword: q,
          filters: { minPrice, maxPrice, listingType, sortOn, sortOrder, page: currentPage },
          itemsSeen: 0,
          status: "failed",
          errorSummary: errorMsg,
          source: "explorer",
        });
      } catch {}
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  function makePageUrl(newPage: number) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    p.set("page", String(newPage));
    if (params.min_price) p.set("min_price", params.min_price);
    if (params.max_price) p.set("max_price", params.max_price);
    if (params.listing_type) p.set("listing_type", params.listing_type);
    if (params.sort_on) p.set("sort_on", params.sort_on);
    if (params.sort_order) p.set("sort_order", params.sort_order);
    return `/products?${p.toString()}`;
  }

  if (errorMsg) {
    return (
      <ErrorState
        title="Gagal memuat hasil pencarian"
        description={errorMsg}
      />
    );
  }

  if (!q) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Mulai Eksplorasi Produk"
        description="Masukkan kata kunci pada kolom pencarian di atas untuk menemukan listing aktif dari Etsy. Hasil pencarian akan otomatis disimpan ke database untuk historis tracking."
      />
    );
  }

  if (listings.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Tidak ada listing yang cocok"
        description={`Pencarian untuk "${q}" tidak menghasilkan data. Coba gunakan kata kunci yang lebih umum atau sesuaikan filter harga.`}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Menampilkan {((currentPage - 1) * PAGE_SIZE) + 1}–
          {Math.min(currentPage * PAGE_SIZE, totalCount)} dari{" "}
          <span className="font-semibold">{totalCount}</span> hasil
          {quotaRemaining !== null && (
            <> · sisa kuota harian: <span className="font-mono">{quotaRemaining}</span></>
          )}
        </span>
        <span className="text-muted-foreground">
          Halaman {currentPage} dari {Math.max(totalPages, 1)}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {listings.map((listing) => (
          <ProductCard key={listing.etsyListingId} listing={listing} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            render={
              currentPage > 1 ? (
                <Link href={makePageUrl(currentPage - 1)} />
              ) : undefined
            }
          >
            <ChevronLeft className="size-4" />
            Sebelumnya
          </Button>

          <span className="text-muted-foreground px-4 text-xs font-medium">
            {currentPage} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            render={
              currentPage < totalPages ? (
                <Link href={makePageUrl(currentPage + 1)} />
              ) : undefined
            }
          >
            Berikutnya
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage(props: { searchParams: SearchParams }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Explorer"
        description="Pencarian katalog listing Etsy secara langsung melalui Etsy Open API v3."
      />

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <ProductSearchForm />
      </Suspense>

      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductResults searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
