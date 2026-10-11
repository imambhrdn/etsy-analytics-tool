"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ExternalLink, Lightbulb, Check } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-md">
      <div className="bg-muted relative aspect-4/3 w-full overflow-hidden">
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
        <div className="absolute top-2 right-2 flex gap-1">
          {listing.numFavorers !== null && (
            <Badge variant="secondary" className="gap-1 bg-white/90 text-xs shadow-xs backdrop-blur-xs dark:bg-black/80">
              <Heart className="size-3 fill-rose-500 text-rose-500" />
              <span>{listing.numFavorers}</span>
            </Badge>
          )}
        </div>
      </div>

      <CardHeader className="p-4 pb-2">
        <Link
          href={`/products/${listing.etsyListingId}`}
          className="line-clamp-2 text-sm font-semibold hover:underline"
          title={listing.title}
        >
          {listing.title}
        </Link>
        {listing.shopName && (
          <p className="text-muted-foreground text-xs">{listing.shopName}</p>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-4 pt-0">
        <div className="my-2 flex items-baseline gap-1">
          <span className="text-lg font-bold">
            {listing.currencyCode} {listing.price.toFixed(2)}
          </span>
          {listing.quantity !== null && (
            <span className="text-muted-foreground text-xs">
              · stok: {listing.quantity}
            </span>
          )}
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
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t p-3 text-xs">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={handleSaveIdea}
            disabled={saving || saved}
          >
            {saved ? (
              <>
                <Check className="size-3 text-emerald-600" />
                Tersimpan
              </>
            ) : (
              <>
                <Lightbulb className="size-3" />
                Simpan Ide
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            render={
              <Link
                href={listing.url}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <ExternalLink className="size-3" />
            Etsy
          </Button>
        </div>

        <Button
          size="sm"
          className="h-8 text-xs"
          render={<Link href={`/products/${listing.etsyListingId}`} />}
        >
          Detail
        </Button>
      </CardFooter>
    </Card>
  );
}
