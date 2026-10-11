"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyButton({
  text,
  label = "Salin",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback jika clipboard permissions diblokir
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={`h-7 px-2 text-xs gap-1.5 cursor-pointer ${className || ""}`}
      title="Salin teks ke clipboard"
    >
      {copied ? (
        <>
          <Check className="size-3 text-emerald-600" />
          <span className="text-emerald-600 font-medium">Tersalin!</span>
        </>
      ) : (
        <>
          <Copy className="size-3 text-muted-foreground" />
          <span>{label}</span>
        </>
      )}
    </Button>
  );
}
