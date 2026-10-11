"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EtsyListingImage, EtsyListingVideo } from "@/lib/etsy/types";

type MediaItem =
  | { kind: "image"; url: string; thumb: string }
  | { kind: "video"; url: string; thumb: string | null; videoId: number };

export function ProductGallery({
  images,
  videos,
  fallbackUrl,
  title,
}: {
  images: EtsyListingImage[];
  videos?: EtsyListingVideo[];
  fallbackUrl: string | null;
  title: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items: MediaItem[] = [];

  // Video lebih dulu (jika ada), lalu gambar
  for (const v of videos || []) {
    if (v.video_url) {
      items.push({
        kind: "video",
        url: v.video_url,
        thumb: v.thumbnail_url || null,
        videoId: v.video_id,
      });
    }
  }

  for (const img of images) {
    const url = img.url_570xN || img.url_fullxfull || img.url_170x135;
    if (url) {
      items.push({ kind: "image", url, thumb: img.url_170x135 || url });
    }
  }

  // Fallback bila tidak ada gambar/video
  if (items.length === 0 && fallbackUrl) {
    items.push({ kind: "image", url: fallbackUrl, thumb: fallbackUrl });
  }

  const current = items[selectedIndex];

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  };
  const handleNext = () => {
    setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  };

  const totalImages = items.filter((i) => i.kind === "image").length;
  const totalVideos = items.filter((i) => i.kind === "video").length;

  return (
    <div className="space-y-3">
      {/* Media utama */}
      <div className="bg-muted relative aspect-16/10 w-full overflow-hidden rounded-xl border">
        {!current ? (
          <div className="text-muted-foreground flex size-full items-center justify-center gap-2 text-sm">
            <ImageIcon className="size-5" />
            Tidak ada media
          </div>
        ) : current.kind === "video" ? (
          <video
            key={current.url}
            src={current.url}
            poster={current.thumb || undefined}
            controls
            playsInline
            className="size-full object-contain"
          />
        ) : (
          <Image
            src={current.url}
            alt={`${title} - Foto ${selectedIndex + 1}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover"
          />
        )}

        {items.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={handlePrev}
              className="absolute top-1/2 left-3 -translate-y-1/2 bg-white/80 shadow-md backdrop-blur-xs hover:bg-white dark:bg-black/70 dark:hover:bg-black"
              title="Sebelumnya"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={handleNext}
              className="absolute top-1/2 right-3 -translate-y-1/2 bg-white/80 shadow-md backdrop-blur-xs hover:bg-white dark:bg-black/70 dark:hover:bg-black"
              title="Berikutnya"
            >
              <ChevronRight className="size-4" />
            </Button>
            <div className="absolute right-3 bottom-3 rounded-full bg-black/70 px-2.5 py-1 text-xs text-white backdrop-blur-xs">
              {selectedIndex + 1} / {items.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail semua media */}
      {items.length > 1 && (
        <div>
          <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
            <span>
              {totalImages} foto{totalVideos > 0 ? ` · ${totalVideos} video` : ""}
            </span>
            <span>Klik untuk melihat</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pt-1 pb-2">
            {items.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`bg-muted relative size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/30 scale-105"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  title={item.kind === "video" ? "Video" : `Foto ${idx + 1}`}
                >
                  {item.thumb ? (
                    <Image
                      src={item.thumb}
                      alt={item.kind === "video" ? "Thumbnail video" : `Thumbnail ${idx + 1}`}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-muted-foreground flex size-full items-center justify-center">
                      <Play className="size-4" />
                    </span>
                  )}
                  {item.kind === "video" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="size-4 fill-white text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
