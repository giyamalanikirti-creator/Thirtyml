"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPaise } from "@/lib/utils";
import { savePrices, createEntryProduct } from "./actions";

export interface PricingRow {
  id: string;
  name: string;
  basePrice: number;
  capacity: number;
  isActive: boolean;
  priceUpdatedAt: string | null;
  sold: number;
}

export function PricingTable({
  clubId,
  rows,
}: {
  clubId: string;
  rows: PricingRow[];
}) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<Record<string, Partial<PricingRow>>>({});
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  function edit(id: string, patch: Partial<PricingRow>) {
    setDraft((d) => ({ ...d, [id]: { ...(d[id] ?? {}), ...patch } }));
    setNotice(null);
    setError(null);
  }

  function value<K extends keyof PricingRow>(row: PricingRow, key: K): PricingRow[K] {
    const dv = draft[row.id]?.[key];
    return (dv !== undefined ? dv : row[key]) as PricingRow[K];
  }

  const dirty = Object.keys(draft).length > 0;

  async function save() {
    setBusy(true);
    setError(null);
    const updates = Object.entries(draft).map(([productId, patch]) => ({
      productId,
      basePrice: (patch.basePrice ?? rows.find((r) => r.id === productId)!.basePrice),
      capacity: patch.capacity,
      isActive: patch.isActive,
    }));
    const result = await savePrices({ clubId, updates });
    setBusy(false);
    if (result.ok) {
      setDraft({});
      setNotice("Prices saved");
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  function bulk(deltaPaise: number) {
    const next: typeof draft = {};
    for (const row of rows) {
      next[row.id] = { basePrice: Math.max(0, value(row, "basePrice") + deltaPaise) };
    }
    setDraft(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => bulk(50000)}>
          +₹500 all
        </Button>
        <Button variant="secondary" size="sm" onClick={() => bulk(-50000)}>
          −₹500 all
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDraft({})} disabled={!dirty}>
          Reset
        </Button>
        <span className="ml-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setPreview((v) => !v)}>
            {preview ? "Back to editor" : "Customer view"}
          </Button>
          <Button size="sm" disabled={!dirty || busy} onClick={save}>
            {busy ? "Saving…" : dirty ? `Save ${Object.keys(draft).length} change${Object.keys(draft).length === 1 ? "" : "s"}` : "Save prices"}
          </Button>
        </span>
      </div>

      {notice && <p className="text-sm text-drop">{notice}</p>}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-md border border-line bg-night-raised">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-moon-dim">
              <th className="px-4 py-2 font-normal">Product</th>
              <th className="px-4 py-2 font-normal">Base price</th>
              <th className="px-4 py-2 font-normal">Capacity</th>
              <th className="px-4 py-2 font-normal">Sold tonight</th>
              <th className="px-4 py-2 font-normal">Active</th>
              <th className="px-4 py-2 font-normal">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowDirty = Boolean(draft[row.id]);
              const currentPrice = value(row, "basePrice");
              return (
                <tr
                  key={row.id}
                  className={"border-t border-line " + (rowDirty ? "bg-sodium/10" : "")}
                >
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3">
                    {preview ? (
                      <span className="tnum font-display font-semibold text-sodium">
                        {formatPaise(currentPrice)}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-moon-dim">₹</span>
                        <Input
                          className="w-24 tnum"
                          type="number"
                          min={0}
                          value={Math.round(currentPrice / 100)}
                          onChange={(e) =>
                            edit(row.id, {
                              basePrice: Math.max(0, Number(e.target.value)) * 100,
                            })
                          }
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {preview ? (
                      value(row, "capacity")
                    ) : (
                      <Input
                        className="w-20 tnum"
                        type="number"
                        min={0}
                        value={value(row, "capacity")}
                        onChange={(e) =>
                          edit(row.id, {
                            capacity: Math.max(0, Number(e.target.value)),
                          })
                        }
                      />
                    )}
                  </td>
                  <td className="tnum px-4 py-3 text-moon-dim">
                    {row.sold}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={value(row, "isActive")}
                      onChange={(e) => edit(row.id, { isActive: e.target.checked })}
                      disabled={preview}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-moon-dim">
                    {row.priceUpdatedAt
                      ? new Date(row.priceUpdatedAt).toLocaleString("en-IN")
                      : "—"}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-moon-dim">
                  No entry products yet — add one below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-md border border-line bg-night-raised p-4">
        <Button variant="ghost" size="sm" onClick={() => setCreating((v) => !v)}>
          {creating ? "Cancel" : "+ Add entry product"}
        </Button>
        {creating && (
          <NewProductForm
            clubId={clubId}
            onCreated={() => {
              setCreating(false);
              router.refresh();
            }}
          />
        )}
      </div>
    </div>
  );
}

function NewProductForm({
  clubId,
  onCreated,
}: {
  clubId: string;
  onCreated: () => void;
}) {
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState(0);
  const [capacity, setCapacity] = React.useState(100);
  const [cover, setCover] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const result = await createEntryProduct({
      clubId,
      name,
      basePrice: price * 100,
      capacity,
      coverRedeemable: cover,
    });
    setBusy(false);
    if (result.ok) onCreated();
    else setError(result.error);
  }

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-5">
      <Input placeholder="Name (e.g. Stag)" value={name} onChange={(e) => setName(e.target.value)} />
      <Input
        type="number"
        placeholder="₹"
        value={price || ""}
        onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
      />
      <Input
        type="number"
        placeholder="Capacity"
        value={capacity || ""}
        onChange={(e) => setCapacity(Math.max(0, Number(e.target.value)))}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={cover} onChange={(e) => setCover(e.target.checked)} />
        Cover redeemable
      </label>
      <Button size="sm" disabled={busy || !name} onClick={submit}>
        {busy ? "Adding…" : "Add"}
      </Button>
      {error && (
        <p role="alert" className="col-span-full text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
