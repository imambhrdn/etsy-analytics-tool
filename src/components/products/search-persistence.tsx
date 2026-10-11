"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setLastSearch } from "@/lib/search-store";

export function SearchPersistence() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    if (query) {
      setLastSearch(`?${query}`);
    } else {
      const saved = sessionStorage.getItem("etsy_last_search");
      if (saved && saved.startsWith("?")) {
        router.replace(`/products${saved}`);
      }
    }
  }, [searchParams, router]);

  return null;
}
