"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ExternalLink, Lightbulb, Check, Calendar, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
    <Card className="flex flex-col gap-0 overflow-hidden rounded-lg border py-0 ring-0">
      {/* Gambar menempel penuh ke tepi atas card */}
      <div className="bg-muted relative aspect-4/3 w-full shrink-0 overflow-hidden">
        {listing.imageUrl ? (
          <Image
            src={listing.imageUrl}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center text-xs">
            Tidak ada foto
          </div>
        )}

        {/* Kiri atas: Tipe + Nama Negara (teks putih) */}
        <div className="absolute top-1.5 left-1.5 flex flex-col items-start gap-1">
          {listing.listingType === "download" ? (
            <Badge className="bg-sky-600/95 text-white text-[10px] shadow-xs backdrop-blur-xs font-medium px-1.5 py-0">
              Digital
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-white/95 text-[10px] shadow-xs backdrop-blur-xs font-medium px-1.5 py-0 dark:bg-black/85">
              Fisik
            </Badge>
          )}

          {listing.shopCountryCode && (
            <span className="text-white text-[10px] font-normal leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {getCountryName(listing.shopCountryCode)}
            </span>
          )}
        </div>

        {/* Kanan atas: Favorit & Penjualan */}
        <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1">
          {listing.numFavorers !== null && (
            <Badge variant="secondary" className="gap-1 bg-white/90 text-[10px] shadow-xs backdrop-blur-xs px-1.5 py-0 dark:bg-black/80">
              <Heart className="size-3 fill-rose-500 text-rose-500" />
              <span>{listing.numFavorers}</span>
            </Badge>
          )}
          {listing.shopSoldCount !== null && (
            <Badge variant="secondary" className="gap-1 bg-white/90 text-[10px] shadow-xs backdrop-blur-xs px-1.5 py-0 dark:bg-black/80" title="Total penjualan toko ini">
              <ShoppingBag className="size-3 text-emerald-600" />
              <span>{listing.shopSoldCount}</span>
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-1.5 p-2.5">
        <Link
          href={`/products/${listing.etsyListingId}`}
          className="line-clamp-2 text-[13px] font-semibold hover:underline leading-snug"
          title={listing.title}
        >
          {listing.title}
        </Link>

        {listing.shopName && (
          <a
            href={listing.shopUrl || `https://www.etsy.com/shop/${listing.shopName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-muted-foreground hover:underline hover:text-foreground font-medium truncate"
            title={`Buka toko ${listing.shopName} di Etsy`}
          >
            {listing.shopName}
          </a>
        )}

        <span className="text-base font-bold">
          {listing.currencyCode} {listing.price.toFixed(2)}
        </span>

        {listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {listing.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {listing.tags.length > 3 && (
              <span className="text-muted-foreground text-[10px]">+{listing.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Tanggal (kiri) & Stok (kanan) selalu di paling bawah, tanpa garis */}
        <div className="mt-auto flex items-center justify-between pt-1.5 text-[10px] text-muted-foreground">
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

      <CardFooter className="border-t p-1.5">
        <div className="grid w-full grid-cols-3 gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-6.5 text-[11px] px-1 gap-1"
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
            className="h-6.5 text-[11px] px-1 gap-1"
            title="Buka listing di Etsy.com"
            render={<Link href={listing.url} target="_blank" rel="noopener noreferrer" />}
          >
            <ExternalLink className="size-3" />
            <span className="truncate">Etsy</span>
          </Button>

          <Button
            size="sm"
            className="h-6.5 text-[11px] px-1 font-medium"
            render={<Link href={`/products/${listing.etsyListingId}`} />}
          >
            Detail
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
