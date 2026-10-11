import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, ExternalLink, Calendar, Tag, ShieldCheck, Clock, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EtsyClient } from "@/lib/etsy/client";
import { getStoredListing, upsertListings } from "@/lib/db/listings-repo";

export default async function ProductDetailPage(props: {
  params: Promise<{ etsyListingId: string }>;
}) {
  const { etsyListingId } = await props.params;
  const listingId = Number(etsyListingId);

  if (isNaN(listingId) || listingId <= 0) {
    notFound();
  }

  let listing = null;
  let images: Array<{ listing_image_id: number; url_570xN?: string; url_fullxfull?: string; alt_text?: string | null }> = [];
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

    // Simpan snapshot & ambil riwayat dari database
    try {
      await upsertListings([listing]);
      const stored = await getStoredListing(listingId);
      snapshots = stored?.listing_snapshots || [];
    } catch (dbErr) {
      console.warn("[ProductDetail] DB sync error:", dbErr);
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "Gagal memuat detail listing dari Etsy";
  }

  if (errorMsg || !listing) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" render={<Link href="/products" />} className="gap-2">
          <ArrowLeft className="size-4" /> Kembali ke Explorer
        </Button>
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
        <Button variant="ghost" size="sm" render={<Link href="/products" />} className="gap-2">
          <ArrowLeft className="size-4" /> Kembali ke Product Explorer
        </Button>

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

      <PageHeader
        title={listing.title}
        description={`Etsy Listing ID: ${listing.etsyListingId}${listing.shopName ? ` · Toko: ${listing.shopName}` : ""}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kolom Kiri: Foto / Galeri */}
        <div className="space-y-4 lg:col-span-2">
          <div className="bg-muted relative aspect-16/10 w-full overflow-hidden rounded-lg border">
            {images[0]?.url_570xN || listing.imageUrl ? (
              <Image
                src={images[0]?.url_570xN || listing.imageUrl!}
                alt={listing.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
              />
            ) : (
              <div className="text-muted-foreground flex size-full items-center justify-center">
                Tidak ada foto
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {images.slice(1, 7).map((img) => (
                <div
                  key={img.listing_image_id}
                  className="bg-muted relative aspect-square overflow-hidden rounded-md border"
                >
                  <Image
                    src={img.url_570xN || img.url_fullxfull!}
                    alt={img.alt_text || "Foto listing"}
                    fill
                    sizes="100px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

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
                        <TableCell className="font-mono text-xs">
                          {new Date(snap.captured_at).toLocaleString("id-ID", {
                            timeZone: "Asia/Jakarta",
                          })}
                        </TableCell>
                        <TableCell className="font-medium text-xs">
                          {snap.currency_code} {snap.price?.toFixed(2) ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {snap.num_favorers?.toLocaleString() ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs">{snap.quantity ?? "—"}</TableCell>
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

        {/* Kolom Kanan: Info & Metadata */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi Listing</CardTitle>
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
                    {listing.numFavorers?.toLocaleString() ?? "—"}
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

              {(listing.createdAtEtsy || listing.updatedAtEtsy) && (
                <div className="space-y-1 border-t pt-3 text-xs">
                  {listing.createdAtEtsy && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="size-3" /> Dibuat di Etsy:
                      </span>
                      <span className="font-mono">
                        {new Date(listing.createdAtEtsy).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  )}
                  {listing.updatedAtEtsy && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="size-3" /> Update Terakhir:
                      </span>
                      <span className="font-mono">
                        {new Date(listing.updatedAtEtsy).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  )}
                </div>
              )}
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
