"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPaise } from "@/lib/utils";
import { addTable, moveTable } from "./actions";

export interface TableRow {
  id: string;
  name: string;
  x: number;
  y: number;
  shape: "round" | "rect" | "booth";
  capacity: number;
  minSpend: number;
  zone: string | null;
  productPrice: number;
}

export function FloorPlanEditor({
  clubId,
  floorPlanId,
  tables,
  width = 1000,
  height = 700,
}: {
  clubId: string;
  floorPlanId: string | null;
  tables: TableRow[];
  width?: number;
  height?: number;
}) {
  const router = useRouter();
  // While the user drags, we override just the moving table's position via
  // dragOffset. Everyone else renders from the server's `tables` prop, so a
  // router.refresh after save picks up the new coords automatically.
  const [selected, setSelected] = React.useState<string | null>(null);
  const [dragOffset, setDragOffset] = React.useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const items = tables.map((t) =>
    dragOffset && dragOffset.id === t.id
      ? { ...t, x: dragOffset.x, y: dragOffset.y }
      : t
  );
  const [draft, setDraft] = React.useState({
    name: "",
    capacity: 4,
    minSpend: 1500000,
    price: 1500000,
    shape: "round" as const,
    zone: "",
  });

  function onPointerDown(id: string, e: React.PointerEvent<SVGGElement>) {
    setSelected(id);
    const start = { x: e.clientX, y: e.clientY };
    const svg = (e.target as SVGElement).ownerSVGElement!;
    const rect = svg.getBoundingClientRect();
    const scale = width / rect.width;
    const orig = items.find((t) => t.id === id)!;

    function move(ev: PointerEvent) {
      const dx = (ev.clientX - start.x) * scale;
      const dy = (ev.clientY - start.y) * scale;
      setDragOffset({
        id,
        x: Math.max(0, Math.min(width - 60, orig.x + dx)),
        y: Math.max(0, Math.min(height - 60, orig.y + dy)),
      });
    }
    async function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      // Snapshot the last dragged position, then clear.
      let final: { x: number; y: number } | null = null;
      setDragOffset((prev) => {
        if (prev && prev.id === id) {
          final = { x: prev.x, y: prev.y };
        }
        return null;
      });
      const snap = final as { x: number; y: number } | null;
      if (snap) {
        await moveTable({ clubId, tableId: id, x: snap.x, y: snap.y });
        router.refresh();
      }
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  async function add() {
    if (!draft.name) return;
    const result = await addTable({
      clubId,
      floorPlanId: floorPlanId ?? undefined,
      name: draft.name,
      capacity: draft.capacity,
      minSpend: draft.minSpend,
      price: draft.price,
      x: 100,
      y: 100,
      shape: draft.shape,
      zone: draft.zone || undefined,
    });
    if (result.ok) {
      setDraft({ ...draft, name: "" });
      router.refresh();
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="overflow-hidden rounded-md border border-line bg-aubergine/30">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full touch-none"
          role="img"
          aria-label="Floor plan editor"
        >
          <rect width={width} height={height} fill="url(#grid)" />
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2a3048" strokeWidth="0.5" />
            </pattern>
          </defs>
          {items.map((t) => (
            <g
              key={t.id}
              data-table={t.id}
              transform={`translate(${t.x},${t.y})`}
              className="cursor-move"
              onPointerDown={(e) => onPointerDown(t.id, e)}
            >
              {t.shape === "round" ? (
                <circle r={28} fill="#f7a521" opacity={selected === t.id ? 1 : 0.85} />
              ) : t.shape === "booth" ? (
                <rect x={-38} y={-24} width={76} height={48} rx={6} fill="#6fa8c9" />
              ) : (
                <rect x={-30} y={-24} width={60} height={48} rx={4} fill="#f7a521" opacity={0.9} />
              )}
              <text textAnchor="middle" dy="6" fill="#0d1120" fontWeight="700" fontSize={14}>
                {t.name}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <aside className="rounded-md border border-line bg-night-raised p-4">
        <h2 className="font-display font-semibold">Add table</h2>
        <div className="mt-3 space-y-2 text-sm">
          <Input
            placeholder="Name (e.g. T5)"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Guests"
              value={draft.capacity}
              onChange={(e) => setDraft({ ...draft, capacity: Number(e.target.value) })}
            />
            <select
              className="h-10 rounded-sm border border-line bg-night px-2 text-sm"
              value={draft.shape}
              onChange={(e) => setDraft({ ...draft, shape: e.target.value as typeof draft.shape })}
            >
              <option value="round">Round</option>
              <option value="rect">Rect</option>
              <option value="booth">Booth</option>
            </select>
          </div>
          <Input
            type="number"
            placeholder="Min spend (₹)"
            value={draft.minSpend / 100}
            onChange={(e) => setDraft({ ...draft, minSpend: Number(e.target.value) * 100 })}
          />
          <Input
            type="number"
            placeholder="Price to book (₹)"
            value={draft.price / 100}
            onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) * 100 })}
          />
          <Input
            placeholder="Zone (VIP, dance floor…)"
            value={draft.zone}
            onChange={(e) => setDraft({ ...draft, zone: e.target.value })}
          />
          <Button className="w-full" onClick={add} disabled={!draft.name}>
            Add to floor
          </Button>
        </div>

        {selected && (
          <div className="mt-6 border-t border-line pt-4">
            {(() => {
              const t = items.find((x) => x.id === selected)!;
              return (
                <>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-moon-dim">
                    Seats {t.capacity} · Min spend {formatPaise(t.minSpend)} ·
                    Sells at {formatPaise(t.productPrice)}
                  </p>
                  <p className="mt-2 text-xs text-moon-dim">
                    Drag to move. Position saves on release.
                  </p>
                </>
              );
            })()}
          </div>
        )}
      </aside>
    </div>
  );
}
