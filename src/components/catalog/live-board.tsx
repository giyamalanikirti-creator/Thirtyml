"use client";

import Link from "next/link";
import type { PriceBoardRow } from "@/lib/data/types";
import { PriceTag } from "@/components/price/price-tag";
import { Badge } from "@/components/ui/badge";
import { useLiveBoard } from "@/hooks/use-live-board";

/**
 * The signature element: tonight's city price board, updating live.
 */
export function LiveBoard({
  citySlug,
  initial,
}: {
  citySlug: string;
  initial: PriceBoardRow[];
}) {
  const rows = useLiveBoard(citySlug, initial);

  if (rows.length === 0) {
    return (
      <p className="px-5 py-8 text-sm text-moon-dim">
        No clubs are on sale in this city yet.
      </p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-moon-dim">
          <th className="px-5 py-2 font-normal">Club</th>
          <th className="px-5 py-2 font-normal">Entry from</th>
          <th className="px-5 py-2 text-right font-normal">Tonight</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.clubId} className="border-t border-line">
            <td className="px-5 py-3">
              <Link
                href={`/${citySlug}/clubs/${row.clubSlug}`}
                className="font-display font-semibold hover:text-sodium"
              >
                {row.clubName}
              </Link>
              {row.areaName && (
                <span className="ml-2 hidden text-xs text-moon-dim sm:inline">
                  {row.areaName}
                </span>
              )}
            </td>
            <td className="px-5 py-3">
              {row.minPrice !== null ? (
                <PriceTag
                  paise={row.minPrice}
                  size="sm"
                  updatedAt={row.priceUpdatedAt}
                />
              ) : (
                <span className="text-moon-dim">—</span>
              )}
            </td>
            <td className="px-5 py-3 text-right">
              {row.isOpen ? (
                <Badge variant="drop">Open</Badge>
              ) : (
                <Badge>Closed</Badge>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
