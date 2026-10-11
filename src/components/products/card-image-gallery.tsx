"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Galeri gambar ringkas untuk kartu produk.
 * Menampilkan semua gambar (auto-slide saat hover) + tombol navigasi kiri/kanan.
 */
export function CardImageGallery({
  urls,
  title,
  className,
}: {
  urls: string[];
  title: string;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const list = urls.length > 0 ? urls : [];

  const start = () => {
    if (list.length <= 1 || timer.current) return;
    timer.current = setInterval(() => {
      setIndex((i) => (i + 1) % list.length);
    }, 1200);
  };

  const stop = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  if (list.length === 0) {
    return (
      <div className={`text-muted-foreground flex size-full items-center justify-center text-xs ${className || ""}`}>
        Tidak ada foto
      </div>
    );
  }

  const go = (dir: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + dir + list.length) % list.length);
  };

  return (
    <div
      className={`group/gallery relative size-full ${className || ""}`}
      onMouseEnter={start}
      onMouseLeave={stop}
    >
      {list.map((url, i) => (
        <Image
          key={url + i}
          src={url}
          alt={`${title} - ${i + 1}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className={`object-cover transition-opacity duration-500 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          priority={i === 0}
        />
      ))}

      {list.length > 1 && (
        <>
          {/* Tombol navigasi kiri/kanan */}
          <button
            type="button"
            onClick={go(-1)}
            aria-label="Foto sebelumnya"
            className="absolute top-1/2 left-1 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover/gallery:opacity-100"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={go(1)}
            aria-label="Foto berikutnya"
            className="absolute top-1/2 right-1 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover/gallery:opacity-100"
          >
            <ChevronRight className="size-3.5" />
          </button>

          {/* Indikator titik */}
          <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
            {list.map((_, i) => (
              <span
                key={i}
                className={`size-1.5 rounded-full transition-colors ${
                  i === index ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
