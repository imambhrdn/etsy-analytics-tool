"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

/**
 * Galeri gambar ringkas untuk kartu produk.
 * Menampilkan semua gambar secara berurutan (auto-slide saat hover),
 * dengan indikator titik. Jika hanya 1 gambar, tampil statis.
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
    setIndex(0);
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

  return (
    <div
      className={`relative size-full ${className || ""}`}
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

      {/* Indikator jumlah gambar */}
      {list.length > 1 && (
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
      )}

      {/* Badge jumlah foto */}
      {list.length > 1 && (
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1 text-[9px] text-white">
          {list.length} foto
        </span>
      )}
    </div>
  );
}
