"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TrendSyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/jobs/discovery", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        router.refresh();
      } else {
        alert(data.error || "Gagal sinkronisasi");
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleSync}
      disabled={loading}
      className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
      title="Jalankan sinkronisasi kandidat tren harian sekarang"
    >
      {loading ? (
        <>
          <RefreshCw className="size-3.5 animate-spin" />
          <span>Menyinkronkan...</span>
        </>
      ) : (
        <>
          <Play className="size-3.5" />
          <span>Sinkronkan Sekarang</span>
        </>
      )}
    </Button>
  );
}
