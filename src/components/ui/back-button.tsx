"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton({
  fallback = "/products",
  className,
  label = "Kembali ke Product Explorer",
}: {
  fallback?: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();

  const handleBack = () => {
    // Jika ada histori browser, kembali ke halaman sebelumnya (mempertahankan query & filter)
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`gap-2 ${className || ""}`}
    >
      <ArrowLeft className="size-4" />
      {label}
    </Button>
  );
}
