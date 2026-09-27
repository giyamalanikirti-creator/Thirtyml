"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/utils";

export interface TablePickerData {
  clubName: string;
  citySlug: string;
  clubSlug: string;
  date: string;
  width: number;
  height: number;
  tables: {
    id: string;
    productId: string;
    name: string;
    x: number;
    y: number;
    shape: "round" | "rect" | "booth";
    capacity: number;
    minSpend: number;
    zone: string | null;
    price: number;
    available: boolean;
  }[];
}

export function TablePicker({ data }: { data: TablePickerData }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const active = data.tables.find((t) => t.id === selected);

  async function reserve() {
    if (!active) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            productId: active.productId,
            nightDate: data.date,
            quantity: 1,
            tableId: active.id,
          },
        ],
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Couldn't add the table to cart");
      return;
    }
    router.push("/cart");
  }

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="rounded-md border border-line bg-aubergine/30">
        <svg
          viewBox={`0 0 ${data.width} ${data.height}`}
          className="w-full"
          role="img"
          aria-label={`Floor plan at ${data.clubName}`}
        >
          {data.tables.map((t) => {
            const state = !t.available
              ? "booked"
              : selected === t.id
                ? "selected"
                : "avail";
            const fill =
              state === "booked" ? "#2a3048" : state === "selected" ? "#f7a521" : "#6fa8c9";
            return (
              <g
                key={t.id}
                transform={`translate(${t.x},${t.y})`}
                className={t.available ? "cursor-pointer" : "opacity-70"}
                onClick={() => t.available && setSelected(t.id)}
                role="button"
                aria-pressed={selected === t.id}
                aria-label={`${t.name}, seats ${t.capacity}, ${
                  t.available ? "available" : "booked"
                }`}
              >
                {t.shape === "round" ? (
                  <circle r={28} fill={fill} stroke="#0d1120" strokeWidth={2} />
                ) : t.shape === "booth" ? (
                  <rect x={-38} y={-24} width={76} height={48} rx={6} fill={fill} stroke="#0d1120" strokeWidth={2} />
                ) : (
                  <rect x={-30} y={-24} width={60} height={48} rx={4} fill={fill} stroke="#0d1120" strokeWidth={2} />
                )}
                {state === "booked" && (
                  <line x1={-24} y1={-24} x2={24} y2={24} stroke="#0d1120" strokeWidth={3} />
                )}
                <text textAnchor="middle" dy="6" fill="#0d1120" fontSize={12} fontWeight={700}>
                  {t.name}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="border-t border-line px-4 py-2 text-xs text-moon-dim">
          <LegendDot color="#6fa8c9" label="Available" />
          <LegendDot color="#f7a521" label="Selected" />
          <LegendDot color="#2a3048" label="Booked ✕" />
        </div>
      </div>

      <aside className="rounded-md border border-line bg-night-raised p-5">
        {active ? (
          <>
            <p className="font-display text-lg font-semibold">
              {data.clubName} · Table {active.name}
            </p>
            <p className="mt-1 text-sm text-moon-dim">
              Seats {active.capacity}
              {active.zone && ` · ${active.zone}`}
            </p>
            <dl className="tnum mt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt>Minimum spend</dt>
                <dd>{formatPaise(active.minSpend)}</dd>
              </div>
              <div className="flex justify-between font-display font-semibold">
                <dt>Book for</dt>
                <dd>{formatPaise(active.price)}</dd>
              </div>
            </dl>
            {error && (
              <p role="alert" className="mt-3 text-sm text-danger">
                {error}
              </p>
            )}
            <Button className="mt-4 w-full" onClick={reserve} disabled={busy}>
              {busy ? "Reserving…" : `Add table ${active.name} to cart`}
            </Button>
          </>
        ) : (
          <p className="text-sm text-moon-dim">
            Tap a table on the floor plan. Booked tables are crossed out.
          </p>
        )}
      </aside>
    </div>
  );
}

function LegendDot({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <span className="mr-4 inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="inline-block h-3 w-3 rounded-sm border border-night"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
