"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EtsyListingImage } from "@/lib/etsy/types";

export function ProductGallery({
  images,
  fallbackUrl,
  title,
}: {
  images: EtsyListingImage[];
  fallbackUrl: string | null;
  title: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Kumpulkan semua url gambar yang valid
  const allUrls = images
    .map((img) => img.url_570xN || img.url_fullxfull || img.url_170x135)
    .filter((url): url is string => Boolean(url));

  if (allUrls.length === 0 && fallbackUrl) {
    allUrls.push(fallbackUrl);
  }

  const currentUrl = allUrls[selectedIndex] || fallbackUrl;

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allUrls.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < allUrls.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-3">
      {/* Gambar Utama (Besar) */}
      <div className="bg-muted relative aspect-16/10 w-full overflow-hidden rounded-xl border">
        {currentUrl ? (
          <Image
            src={currentUrl}
            alt={`${title} - Foto ${selectedIndex + 1}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover transition-all duration-200"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center gap-2 text-sm">
            <ImageIcon className="size-5" />
            Tidak ada foto
          </div>
        )}

        {allUrls.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={handlePrev}
              className="absolute top-1/2 left-3 -translate-y-1/2 bg-white/80 shadow-md backdrop-blur-xs hover:bg-white dark:bg-black/70 dark:hover:bg-black"
              title="Foto sebelumnya"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={handleNext}
              className="absolute top-1/2 right-3 -translate-y-1/2 bg-white/80 shadow-md backdrop-blur-xs hover:bg-white dark:bg-black/70 dark:hover:bg-black"
              title="Foto berikutnya"
            >
              <ChevronRight className="size-4" />
            </Button>
            <div className="absolute right-3 bottom-3 rounded-full bg-black/70 px-2.5 py-1 text-xs text-white backdrop-blur-xs">
              {selectedIndex + 1} / {allUrls.length}
            </div>
          </>
        )}
      </div>

      {/* Seluruh Gambar Listing (Thumbnail Bar) */}
      {allUrls.length > 1 && (
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Seluruh Foto Listing ({allUrls.length} foto)</span>
            <span>Klik untuk memperbesar</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
            {allUrls.map((url, idx) => {
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
                  title={`Foto ${idx + 1}`}
                >
                  <Image
                    src={url}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
