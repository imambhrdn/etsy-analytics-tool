"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Heart,
  ExternalLink,
  Lightbulb,
  Check,
  TrendingUp,
  Sparkles,
  Award,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardImageGallery } from "@/components/products/card-image-gallery";
import { formatDateIndo, formatIDR, convertToIDR } from "@/lib/utils";

export type TrendCandidateItem = {
  id: string;
  run_date: string;
  niche_key: string;
  classification: "emerging" | "accelerating" | "established";
  score: number;
  confidence: "Low" | "Medium" | "High";
  score_breakdown: Record<string, unknown> | null;
  evidence: Record<string, unknown> | null;
  created_at: string;
  listings: {
    id: string;
    etsy_listing_id: number;
    title: string;
    url: string;
    price: number;
    currency_code: string;
    quantity: number | null;
    num_favorers: number | null;
    state: string;
    listing_type: string | null;
    tags?: string[];
    first_seen_at: string;
    last_seen_at: string;
    raw_data: Record<string, unknown>;
    listing_snapshots?: Array<{
      id: number;
      price: number | null;
      num_favorers: number | null;
      captured_at: string;
    }>;
  };
};

export function TrendCard({
  item,
  rates,
}: {
  item: TrendCandidateItem;
  rates?: Record<string, number> | null;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const listing = item.listings;
  const idr = convertToIDR(listing.price, listing.currency_code, rates);

  // Ambil gambar dari raw_data jika ada
  const rawImages = (listing.raw_data?.images as Array<{ url_570xN?: string; url_fullxfull?: string }>) || [];
  const imageUrls = rawImages
    .map((img) => img.url_570xN || img.url_fullxfull)
    .filter((u): u is string => Boolean(u));

  const favorersDelta = (item.evidence?.favorers_delta as number) || 0;

  const handleSaveIdea = async () => {
    if (saved || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: listing.title,
          category: item.niche_key || (listing.tags && listing.tags[0]) || null,
          targetPrice: listing.price,
          sourceUrl: listing.url,
          notes: `Disimpan dari Today's Etsy Trends. Klasifikasi: ${item.classification}, Skor: ${item.score}, Confidence: ${item.confidence}`,
        }),
      });
      if (res.ok) setSaved(true);
    } catch {
      // Abaikan kegagalan sementara
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="flex flex-col gap-0 overflow-hidden rounded-lg border py-0 ring-0 hover:shadow-md transition-all">
      {/* Gambar Carousel Full Bleed */}
      <div className="bg-muted relative aspect-4/3 w-full shrink-0 overflow-hidden">
        <CardImageGallery urls={imageUrls} title={listing.title} />

        {/* Pojok kiri atas: Klasifikasi & Niche */}
        <div className="absolute top-1.5 left-1.5 flex flex-col items-start gap-1">
          {item.classification === "accelerating" ? (
            <Badge className="bg-emerald-600 text-white text-[10px] shadow-xs backdrop-blur-xs font-medium px-1.5 py-0 gap-1">
              <TrendingUp className="size-3" />
              Accelerating
            </Badge>
          ) : item.classification === "established" ? (
            <Badge className="bg-purple-600 text-white text-[10px] shadow-xs backdrop-blur-xs font-medium px-1.5 py-0 gap-1">
              <Award className="size-3" />
              Established
            </Badge>
          ) : (
            <Badge className="bg-sky-600 text-white text-[10px] shadow-xs backdrop-blur-xs font-medium px-1.5 py-0 gap-1">
              <Sparkles className="size-3" />
              Emerging
            </Badge>
          )}

          {item.niche_key && (
            <span className="text-white text-[10px] font-normal leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] max-w-[130px] truncate">
              {item.niche_key}
            </span>
          )}
        </div>

        {/* Pojok kanan atas: Skor & Favorit */}
        <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1">
          <Badge variant="secondary" className="bg-white/95 text-[10px] font-semibold px-1.5 py-0 shadow-xs dark:bg-black/85">
            Skor: {item.score}
          </Badge>

          {listing.num_favorers !== null && (
            <Badge variant="secondary" className="gap-1 bg-white/90 text-[10px] shadow-xs backdrop-blur-xs px-1.5 py-0 dark:bg-black/80">
              <Heart className="size-3 fill-rose-500 text-rose-500" />
              <span>{listing.num_favorers}</span>
              {favorersDelta > 0 && (
                <span className="text-emerald-600 font-semibold text-[9px]">
                  +{favorersDelta}
                </span>
              )}
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-1.5 p-2.5">
        <Link
          href={`/products/${listing.etsy_listing_id}`}
          className="line-clamp-2 text-[13px] font-semibold hover:underline leading-snug"
          title={listing.title}
        >
          {listing.title}
        </Link>

        {/* Harga IDR */}
        <div className="flex items-baseline justify-between mt-0.5">
          <span className="text-base font-bold">
            {idr !== null
              ? formatIDR(idr)
              : `${listing.currency_code} ${listing.price.toFixed(2)}`}
          </span>

          {/* Confidence Badge (PRD §9.5 Data Sufficiency) */}
          <Badge
            variant="outline"
            className={`text-[9px] px-1 py-0 gap-0.5 font-normal ${
              item.confidence === "High"
                ? "text-emerald-600 border-emerald-500/40"
                : item.confidence === "Medium"
                  ? "text-sky-600 border-sky-500/40"
                  : "text-muted-foreground"
            }`}
            title={`Tingkat kecukupan data observasi: ${item.confidence}`}
          >
            <ShieldCheck className="size-2.5" />
            <span>{item.confidence} Conf.</span>
          </Badge>
        </div>

        {/* Tanggal & Tipe Produk */}
        <div className="mt-auto flex items-center justify-between pt-1.5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1" title="Waktu observasi tren">
            <Calendar className="size-3 shrink-0" />
            <span>{formatDateIndo(item.created_at)}</span>
          </span>

          <span className="font-medium capitalize">
            {listing.listing_type === "download" ? "Digital" : "Fisik"}
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
            render={<Link href={`/products/${listing.etsy_listing_id}`} />}
          >
            Detail
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
