"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/states";

/** Error boundary global (PRD §15). */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log ke console server/browser tanpa membocorkan data sensitif.
    console.error("Unhandled app error:", error.message);
  }, [error]);

  return (
    <ErrorState
      title="Terjadi kesalahan"
      description="Sesuatu gagal dimuat. Coba lagi; jika berlanjut, periksa status data & diagnostik di Settings."
      action={
        <Button variant="outline" onClick={reset}>
          Coba lagi
        </Button>
      }
    />
  );
}
