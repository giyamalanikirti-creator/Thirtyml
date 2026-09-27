"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPaise } from "@/lib/utils";
import { addPriceRule, deletePriceRule } from "./actions";

interface Product {
  id: string;
  name: string;
}
interface Rule {
  id: string;
  productName: string;
  daysOfWeek: number[];
  startTime: string;
  price: number;
}
interface HistoryEntry {
  productName: string;
  oldPrice: number | null;
  newPrice: number;
  reason: string;
  changedAt: string;
  by: string | null;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function RulesAndHistory({
  clubId,
  products,
  rules,
  history,
}: {
  clubId: string;
  products: Product[];
  rules: Rule[];
  history: HistoryEntry[];
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState<"rules" | "history">("rules");
  const [productId, setProductId] = React.useState(products[0]?.id ?? "");
  const [days, setDays] = React.useState<number[]>([6]);
  const [time, setTime] = React.useState("23:00");
  const [price, setPrice] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  async function add() {
    setBusy(true);
    setError(null);
    const result = await addPriceRule({
      clubId,
      productId,
      daysOfWeek: days,
      startTime: time,
      price: price * 100,
    });
    setBusy(false);
    if (result.ok) router.refresh();
    else setError(result.error);
  }

  async function remove(ruleId: string) {
    await deletePriceRule(clubId, ruleId);
    router.refresh();
  }

  return (
    <div className="rounded-md border border-line bg-night-raised">
      <div className="flex gap-1 border-b border-line px-4 py-2 text-sm" role="tablist">
        {(["rules", "history"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={
              "rounded-sm px-3 py-1 " +
              (tab === t
                ? "bg-sodium/15 text-sodium"
                : "text-moon-dim hover:text-moon")
            }
          >
            {t === "rules" ? "Scheduled rules" : "Price history"}
          </button>
        ))}
      </div>

      {tab === "rules" ? (
        <div className="space-y-4 p-4">
          <p className="text-xs text-moon-dim">
            Example: “Stag becomes ₹3,000 from 23:00 on Saturdays.” Rules fire
            once the clock hits their start time on a matching day, and log to
            price history with reason <em>rule</em>.
          </p>
          <div className="grid gap-2 sm:grid-cols-6">
            <select
              className="h-10 rounded-sm border border-line bg-night px-2 text-sm sm:col-span-2"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <Input
              type="number"
              placeholder="₹"
              value={price || ""}
              onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
            />
            <Button
              className="sm:col-span-2"
              size="sm"
              disabled={busy || !productId}
              onClick={add}
            >
              {busy ? "Adding…" : "Add rule"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-1 text-xs">
            {DAYS.map((day, i) => (
              <button
                key={day}
                onClick={() => toggleDay(i)}
                className={
                  "rounded-sm border px-2 py-1 " +
                  (days.includes(i)
                    ? "border-sodium bg-sodium/15 text-sodium"
                    : "border-line text-moon-dim")
                }
              >
                {day}
              </button>
            ))}
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <ul className="space-y-2">
            {rules.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-sm border border-line px-3 py-2 text-sm"
              >
                <span>
                  {r.productName} → {formatPaise(r.price)} at{" "}
                  <span className="tnum">{r.startTime.slice(0, 5)}</span> on{" "}
                  {r.daysOfWeek.map((d) => DAYS[d]).join(", ")}
                </span>
                <button
                  className="text-xs text-danger hover:underline"
                  onClick={() => remove(r.id)}
                >
                  Remove
                </button>
              </li>
            ))}
            {rules.length === 0 && (
              <li className="text-sm text-moon-dim">No scheduled rules yet.</li>
            )}
          </ul>
        </div>
      ) : (
        <ul className="max-h-80 overflow-y-auto p-4">
          {history.length === 0 ? (
            <li className="text-sm text-moon-dim">No changes yet.</li>
          ) : (
            history.map((h, i) => (
              <li
                key={i}
                className="flex items-center justify-between border-b border-line py-2 text-sm last:border-0"
              >
                <span>
                  <strong>{h.productName}</strong>{" "}
                  <span className="tnum text-moon-dim">
                    {h.oldPrice !== null ? `${formatPaise(h.oldPrice)} → ` : ""}
                    {formatPaise(h.newPrice)}
                  </span>{" "}
                  <span className="text-xs text-moon-dim">({h.reason})</span>
                </span>
                <span className="text-xs text-moon-dim">
                  {new Date(h.changedAt).toLocaleString("en-IN")}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
