"use client";

import * as React from "react";
import { formatPaise, cn } from "@/lib/utils";

interface PriceTagProps {
  /** Price in integer paise */
  paise: number;
  /** When the price last changed (ISO string) — renders "Updated Xm ago" */
  updatedAt?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

function agoLabel(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Updated just now";
  if (mins < 60) return `Updated ${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Updated ${hours}h ago`;
  return `Updated ${Math.round(hours / 24)}d ago`;
}

/**
 * The live price. Tabular display numerals; flips when the value changes and
 * shows direction. Free products render as "Free".
 */
export function PriceTag({ paise, updatedAt, className, size = "md" }: PriceTagProps) {
  const prev = React.useRef(paise);
  const [direction, setDirection] = React.useState<"up" | "down" | null>(null);
  const [flipKey, setFlipKey] = React.useState(0);

  React.useEffect(() => {
    if (prev.current !== paise) {
      setDirection(paise > prev.current ? "up" : "down");
      setFlipKey((k) => k + 1);
      prev.current = paise;
    }
  }, [paise]);

  const sizeClass =
    size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";

  return (
    <span className={cn("inline-flex flex-col", className)}>
      <span
        className={cn(
          "font-display font-semibold tnum inline-flex items-center gap-1.5",
          sizeClass
        )}
      >
        <span key={flipKey} className={flipKey > 0 ? "price-flip" : undefined}>
          {paise === 0 ? "Free" : formatPaise(paise)}
        </span>
        {direction === "up" && (
          <span className="text-rise text-sm" aria-label="price went up">
            ▲
          </span>
        )}
        {direction === "down" && (
          <span className="text-drop text-sm" aria-label="price went down">
            ▼
          </span>
        )}
      </span>
      {updatedAt && (
        <span className="text-xs text-moon-dim">{agoLabel(updatedAt)}</span>
      )}
    </span>
  );
}
