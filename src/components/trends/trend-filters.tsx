"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function TrendFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentClassification = searchParams.get("class") || "all";
  const currentSort = searchParams.get("sort") || "highest_score";
  const currentWindow = searchParams.get("window") || "7d";

  const updateParam = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val && val !== "all") {
      params.set(key, val);
    } else {
      params.delete(key);
    }
    router.push(`/?${params.toString()}`);
  };

  const classifications = [
    { id: "all", label: "Semua Tren" },
    { id: "emerging", label: "Emerging (Baru Ditemukan)" },
    { id: "accelerating", label: "Accelerating (Bertumbuh)" },
    { id: "established", label: "Established (Perhatian Tinggi)" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
      {/* Pills Klasifikasi */}
      <div className="flex flex-wrap items-center gap-1.5">
        {classifications.map((c) => {
          const isActive = currentClassification === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => updateParam("class", c.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground border-transparent"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Kontrol Window & Sort */}
      <div className="flex items-center gap-2">
        {/* Trend Window 7d / 30d / 90d */}
        <select
          value={currentWindow}
          onChange={(e) => updateParam("window", e.target.value)}
          className="h-7 rounded border border-input bg-background px-2 text-[11px]"
          title="Rentang observasi tren"
        >
          <option value="7d">Rentang 7 Hari</option>
          <option value="30d">Rentang 30 Hari</option>
          <option value="90d">Rentang 90 Hari</option>
        </select>

        {/* Sort Options */}
        <select
          value={currentSort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="h-7 rounded border border-input bg-background px-2 text-[11px]"
          title="Urutkan kandidat tren"
        >
          <option value="highest_score">Skor Peluang Tertinggi</option>
          <option value="fastest_growth">Pertumbuhan Tercepat</option>
          <option value="most_attention">Perhatian Terbanyak</option>
          <option value="recent">Baru Ditemukan</option>
        </select>
      </div>
    </div>
  );
}
