"use client";

import { useSyncExternalStore } from "react";

let listeners: Array<() => void> = [];

export function setLastSearch(search: string) {
  if (typeof window !== "undefined") {
    if (search) {
      sessionStorage.setItem("etsy_last_search", search);
    } else {
      sessionStorage.removeItem("etsy_last_search");
    }
    listeners.forEach((l) => l());
  }
}

export function useLastSearch(): string {
  return useSyncExternalStore(
    (callback) => {
      listeners.push(callback);
      window.addEventListener("storage", callback);
      return () => {
        listeners = listeners.filter((l) => l !== callback);
        window.removeEventListener("storage", callback);
      };
    },
    () => {
      if (typeof window === "undefined") return "";
      return sessionStorage.getItem("etsy_last_search") || "";
    },
    () => "",
  );
}
