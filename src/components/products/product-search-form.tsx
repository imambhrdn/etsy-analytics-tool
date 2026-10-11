"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setLastSearch } from "@/lib/search-store";

export function ProductSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") ?? "");
  const [listingType, setListingType] = useState(searchParams.get("listing_type") ?? "");
  const [sortOn, setSortOn] = useState(searchParams.get("sort_on") ?? "created");
  const [sortOrder, setSortOrder] = useState(searchParams.get("sort_order") ?? "desc");
  const [showFilters, setShowFilters] = useState(
    Boolean(
      searchParams.get("min_price") ||
        searchParams.get("max_price") ||
        searchParams.get("listing_type"),
    ),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;

    const params = new URLSearchParams();
    params.set("q", q.trim());
    params.set("page", "1");
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    if (listingType) params.set("listing_type", listingType);
    if (sortOn) params.set("sort_on", sortOn);
    if (sortOrder) params.set("sort_order", sortOrder);

    router.push(`/products?${params.toString()}`);
  };

  const triggerQuickType = (type: string) => {
    setListingType(type);
    if (q.trim()) {
      const params = new URLSearchParams();
      params.set("q", q.trim());
      params.set("page", "1");
      if (minPrice) params.set("min_price", minPrice);
      if (maxPrice) params.set("max_price", maxPrice);
      if (type) params.set("listing_type", type);
      if (sortOn) params.set("sort_on", sortOn);
      if (sortOrder) params.set("sort_order", sortOrder);
      router.push(`/products?${params.toString()}`);
    }
  };

  const handleReset = () => {
    setLastSearch("");
    setQ("");
    setMinPrice("");
    setMaxPrice("");
    setListingType("");
    setSortOn("created");
    setSortOrder("desc");
    router.push("/products");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari listing Etsy (mis. printable wall art, crochet pattern, wedding template)..."
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <SlidersHorizontal className="size-4" />
          <span className="hidden sm:inline">Filter</span>
        </Button>
        <Button type="submit">Cari</Button>
        {searchParams.get("q") && (
          <Button type="button" variant="ghost" onClick={handleReset} title="Reset">
            <RotateCcw className="size-4" />
          </Button>
        )}
      </div>

      {/* Quick filter pills: Digital vs Fisik */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-muted-foreground font-medium text-[11px] mr-1">Tipe:</span>
        <button
          type="button"
          onClick={() => triggerQuickType("")}
          className={`px-2.5 py-0.5 rounded-full border text-[11px] transition-all ${
            !listingType
              ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
              : "bg-muted/40 hover:bg-muted text-muted-foreground border-transparent"
          }`}
        >
          Semua
        </button>
        <button
          type="button"
          onClick={() => triggerQuickType("download")}
          className={`px-2.5 py-0.5 rounded-full border text-[11px] transition-all ${
            listingType === "download"
              ? "bg-sky-600 text-white border-sky-600 font-medium shadow-xs"
              : "bg-muted/40 hover:bg-muted text-muted-foreground border-transparent"
          }`}
        >
          ⚡ Digital Download
        </button>
        <button
          type="button"
          onClick={() => triggerQuickType("physical")}
          className={`px-2.5 py-0.5 rounded-full border text-[11px] transition-all ${
            listingType === "physical"
              ? "bg-zinc-800 text-white border-zinc-800 font-medium shadow-xs dark:bg-zinc-200 dark:text-zinc-900"
              : "bg-muted/40 hover:bg-muted text-muted-foreground border-transparent"
          }`}
        >
          📦 Produk Fisik
        </button>
      </div>

      {showFilters && (
        <div className="bg-muted/40 grid gap-3 rounded-lg border p-4 sm:grid-cols-2 md:grid-cols-5">
          <div>
            <label className="text-muted-foreground text-xs font-medium">Tipe Produk</label>
            <select
              value={listingType}
              onChange={(e) => setListingType(e.target.value)}
              className="border-input bg-background mt-1 h-8 w-full rounded-md border px-2 text-sm"
            >
              <option value="">Semua Tipe</option>
              <option value="download">Digital Download</option>
              <option value="physical">Produk Fisik</option>
            </select>
          </div>
          <div>
            <label className="text-muted-foreground text-xs font-medium">Harga Min (USD)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              className="mt-1 h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-muted-foreground text-xs font-medium">Harga Max (USD)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="100"
              className="mt-1 h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-muted-foreground text-xs font-medium">Urutkan</label>
            <select
              value={sortOn}
              onChange={(e) => setSortOn(e.target.value)}
              className="border-input bg-background mt-1 h-8 w-full rounded-md border px-2 text-sm"
            >
              <option value="created">Tanggal Dibuat</option>
              <option value="updated">Terakhir Diperbarui</option>
              <option value="price">Harga</option>
              <option value="score">Relevansi (Score)</option>
            </select>
          </div>
          <div>
            <label className="text-muted-foreground text-xs font-medium">Arah</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border-input bg-background mt-1 h-8 w-full rounded-md border px-2 text-sm"
            >
              <option value="desc">Menurun (Desc)</option>
              <option value="asc">Menaik (Asc)</option>
            </select>
          </div>
        </div>
      )}
    </form>
  );
}
