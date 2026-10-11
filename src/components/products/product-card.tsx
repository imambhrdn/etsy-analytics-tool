"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ExternalLink, Lightbulb, Check, Calendar, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateIndo, getCountryName } from "@/lib/utils";
import type { NormalizedListing } from "@/lib/etsy/types";

export function ProductCard({ listing }: { listing: NormalizedListing }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveIdea = async () => {
    if (saved || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: listing.title,
          category: listing.tags[0] ?? null,
          targetPrice: listing.price,
          sourceUrl: listing.url,
          notes: `Disimpan dari Product Explorer. Etsy Listing ID: ${listing.etsyListingId}`,
        }),
      });
      if (res.ok) {
        setSaved(true);
      }
    } catch {
      // Abaikan kegagalan sementara
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden rounded-md border transition-all hover:shadow-md">
      {/* Gambar full ke atas dengan ujung melengkung halus mengikuti card */}
      <div className="bg-muted relative aspect-4/3 w-full overflow-hidden rounded-t-md">
        {listing.imageUrl ? (
          <Image
            src={listing.imageUrl}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center text-xs">
            Tidak ada foto
          </div>
        )}

        {/* Pojok kiri atas: Tipe Produk & Nama Negara di bawahnya */}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {listing.listingType === "download" ? (
            <Badge className="bg-sky-600/95 text-white text-[10px] shadow-xs backdrop-blur-xs font-medium">
              Digital
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-white/95 text-[10px] shadow-xs backdrop-blur-xs font-medium dark:bg-black/85">
              Fisik
            </Badge>
          )}

          {listing.shopCountryCode && (
            <Badge
              variant="outline"
              className="bg-black/60 text-white border-0 text-[10px] px-1.5 py-0 backdrop-blur-xs font-normal"
            >
              {getCountryName(listing.shopCountryCode)}
            </Badge>
          )}
        </div>

        {/* Pojok kanan atas: Favorit & Penjualan Toko */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          {listing.numFavorers !== null && (
            <Badge variant="secondary" className="gap-1 bg-white/90 text-xs shadow-xs backdrop-blur-xs dark:bg-black/80">
              <Heart className="size-3 fill-rose-500 text-rose-500" />
              <span>{listing.numFavorers}</span>
            </Badge>
          )}
          {listing.shopSoldCount !== null && (
            <Badge variant="secondary" className="gap-1 bg-white/90 text-[10px] shadow-xs backdrop-blur-xs dark:bg-black/80" title="Total penjualan toko ini">
              <ShoppingBag className="size-3 text-emerald-600" />
              <span>{listing.shopSoldCount} terjual</span>
            </Badge>
          )}
        </div>
      </div>

      <CardHeader className="p-3.5 pb-1.5">
        <Link
          href={`/products/${listing.etsyListingId}`}
          className="line-clamp-2 text-sm font-semibold hover:underline leading-snug"
          title={listing.title}
        >
          {listing.title}
        </Link>
        {listing.shopName && (
          <a
            href={listing.shopUrl || `https://www.etsy.com/shop/${listing.shopName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:underline hover:text-foreground font-medium truncate pt-0.5"
            title={`Buka toko ${listing.shopName} di Etsy`}
          >
            {listing.shopName}
          </a>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-3.5 pt-0">
        <div className="my-1.5">
          <span className="text-lg font-bold">
            {listing.currencyCode} {listing.price.toFixed(2)}
          </span>
        </div>

        {listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {listing.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px]">
                {tag}
              </Badge>
            ))}
            {listing.tags.length > 3 && (
              <span className="text-muted-foreground text-[10px]">
                +{listing.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Tanggal upload di kiri dan Stok di kanan */}
        <div className="mt-3 flex items-center justify-between border-t pt-2 text-[11px] text-muted-foreground">
          {listing.createdAtEtsy ? (
            <span className="flex items-center gap-1" title="Tanggal dibuat di Etsy">
              <Calendar className="size-3 shrink-0" />
              <span>{formatDateIndo(listing.createdAtEtsy)}</span>
            </span>
          ) : (
            <span>—</span>
          )}

          <span className="font-medium">
            {listing.quantity !== null ? `Stok: ${listing.quantity}` : "Stok: —"}
          </span>
        </div>
      </CardContent>

      <CardFooter className="border-t p-2">
        <div className="grid grid-cols-3 gap-1.5 w-full">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-1 gap-1"
            onClick={handleSaveIdea}
            disabled={saving || saved}
            title={saved ? "Ide telah tersimpan" : "Simpan ke Idea Vault"}
          >
            {saved ? (
              <>
                <Check className="size-3 text-emerald-600" />
                <span className="truncate">Saved</span>
              </>
            ) : (
              <>
                <Lightbulb className="size-3" />
                <span className="truncate">Ide</span>
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-1 gap-1"
            title="Buka listing di Etsy.com"
            render={
              <Link
                href={listing.url}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <ExternalLink className="size-3" />
            <span className="truncate">Etsy</span>
          </Button>

          <Button
            size="sm"
            className="h-7 text-xs px-1 font-medium"
            render={<Link href={`/products/${listing.etsyListingId}`} />}
          >
            Detail
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
