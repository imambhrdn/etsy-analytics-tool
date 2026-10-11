import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  Heart,
  ExternalLink,
  Calendar,
  Tag,
  ShieldCheck,
  Clock,
  ShoppingBag,
  Star,
  Store,
} from "lucide-react";
import { formatNumber, formatDateIndo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EtsyClient } from "@/lib/etsy/client";
import { getStoredListing, upsertListings } from "@/lib/db/listings-repo";
import { ProductGallery } from "@/components/products/product-gallery";
import { BackButton } from "@/components/ui/back-button";

type DetailParams = Promise<{ etsyListingId: string }>;

function ProductDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="aspect-16/10 w-full rounded-xl" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="size-16 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

async function ProductDetailContent({ params }: { params: DetailParams }) {
  await connection();
  const { etsyListingId } = await params;
  const listingId = Number(etsyListingId);

  if (isNaN(listingId) || listingId <= 0) {
    notFound();
  }

  let listing = null;
  let images: Array<{
    listing_image_id: number;
    url_570xN?: string;
    url_fullxfull?: string;
    url_170x135?: string;
    alt_text?: string | null;
  }> = [];
  let snapshots: Array<{
    id: number;
    captured_at: string;
    price: number | null;
    currency_code: string | null;
    num_favorers: number | null;
    quantity: number | null;
    source: string | null;
  }> = [];
  let errorMsg: string | null = null;

  try {
    const client = new EtsyClient();
    const data = await client.getListing(listingId);
    listing = data.listing;
    images = data.images;

    try {
      await upsertListings([listing]);
      const stored = await getStoredListing(listingId);
      snapshots = stored?.listing_snapshots || [];
    } catch (dbErr) {
      console.warn("[ProductDetailContent] DB sync error:", dbErr);
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "Gagal memuat detail listing dari Etsy";
  }

  if (errorMsg || !listing) {
    return (
      <div className="space-y-4">
        <BackButton />
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>Gagal memuat detail listing</CardTitle>
            <CardDescription>{errorMsg || "Listing tidak ditemukan"}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const hasEnoughHistory = snapshots.length >= 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton />

        <Button
          size="sm"
          render={
            <Link href={listing.url} target="_blank" rel="noopener noreferrer" />
          }
          className="gap-2"
        >
          <ExternalLink className="size-4" />
          Buka di Etsy
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{listing.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            ID: {listing.etsyListingId}
          </Badge>
          {listing.shopName && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Store className="size-3" />
              Toko: {listing.shopName}
            </Badge>
          )}
          {listing.listingType === "download" ? (
            <Badge className="bg-sky-600/90 text-white text-xs">
              ⚡ Digital Download
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              📦 Produk Fisik
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kolom Kiri: Galeri Foto Lengkap & Deskripsi */}
        <div className="space-y-6 lg:col-span-2">
          {/* Galeri Seluruh Foto Listing (Interactive Thumbnail Switching) */}
          <ProductGallery
            images={images}
            fallbackUrl={listing.imageUrl}
            title={listing.title}
          />

          {/* Deskripsi */}
          {listing.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deskripsi Produk</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
                  {listing.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Riwayat Snapshot Historis (PRD §7.3) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Riwayat Snapshot Observasi</CardTitle>
                <CardDescription>
                  Snapshot harga dan metrik yang terekam setiap kali listing diamati.
                </CardDescription>
              </div>
              <Badge variant={hasEnoughHistory ? "default" : "outline"} className="gap-1 text-xs">
                {hasEnoughHistory ? (
                  <>
                    <ShieldCheck className="size-3 text-emerald-500" />
                    Cukup observasi
                  </>
                ) : (
                  <>
                    <Clock className="size-3" />
                    Histori terbatas ({snapshots.length} snapshot)
                  </>
                )}
              </Badge>
            </CardHeader>
            <CardContent>
              {snapshots.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-xs">
                  Belum ada snapshot historis tersimpan untuk listing ini.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu Observasi</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Favorit</TableHead>
                      <TableHead>Stok</TableHead>
                      <TableHead>Sumber</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshots.map((snap) => (
                      <TableRow key={snap.id}>
                        <TableCell className="text-xs">
                          {formatDateIndo(snap.captured_at)}
                        </TableCell>
                        <TableCell className="font-medium text-xs">
                          {snap.currency_code} {snap.price?.toFixed(2) ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatNumber(snap.num_favorers)}
                        </TableCell>
                        <TableCell className="text-xs">{formatNumber(snap.quantity)}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {snap.source || "explorer"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Metrik, Tanggal, dan Info Toko */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi Listing & Toko</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Harga Saat Ini</span>
                <p className="text-2xl font-bold">
                  {listing.currencyCode} {listing.price.toFixed(2)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t pt-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Peminat (Favorit)</span>
                  <p className="flex items-center gap-1 font-semibold">
                    <Heart className="size-3 fill-rose-500 text-rose-500" />
                    {listing.numFavorers ?? "—"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Stok Tersisa</span>
                  <p className="font-semibold">{listing.quantity ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipe Listing</span>
                  <p className="font-semibold">{listing.listingType || "Physical"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className="mt-0.5 text-[10px]">
                    {listing.state}
                  </Badge>
                </div>
              </div>

              {/* Data Penjualan Toko & Tanggal Dibuat */}
              <div className="space-y-2 border-t pt-3 text-xs">
                {listing.shopSoldCount !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <ShoppingBag className="size-3.5 text-emerald-600" />
                      Total Penjualan Toko:
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {formatNumber(listing.shopSoldCount)} terjual
                    </span>
                  </div>
                )}

                {listing.shopReviewCount !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Star className="size-3.5 text-amber-500" />
                      Review Toko:
                    </span>
                    <span className="font-medium">
                      {formatNumber(listing.shopReviewCount)} review
                    </span>
                  </div>
                )}

                {listing.createdAtEtsy && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      Dibuat di Etsy:
                    </span>
                    <span className="font-medium">
                      {formatDateIndo(listing.createdAtEtsy)}
                    </span>
                  </div>
                )}

                {listing.updatedAtEtsy && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      Update Terakhir:
                    </span>
                    <span className="font-medium">
                      {formatDateIndo(listing.updatedAtEtsy)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {listing.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tag className="size-4" />
                  Tags ({listing.tags.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {listing.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage(props: { params: DetailParams }) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailContent params={props.params} />
    </Suspense>
  );
}
