"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyButton({
  text,
  label = "Salin",
  iconOnly = false,
  className,
}: {
  text: string;
  label?: string;
  iconOnly?: boolean;
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
      size={iconOnly ? "icon-sm" : "sm"}
      onClick={handleCopy}
      className={`cursor-pointer transition-colors ${
        iconOnly ? "size-7" : "h-7 px-2 text-xs gap-1.5"
      } ${className || ""}`}
      title={copied ? "Tersalin!" : "Salin ke clipboard"}
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-600" />
      ) : (
        <Copy className="size-3.5 text-muted-foreground" />
      )}
      {!iconOnly && (
        <span className={copied ? "text-emerald-600 font-medium" : ""}>
          {copied ? "Tersalin!" : label}
        </span>
      )}
    </Button>
  );
}
