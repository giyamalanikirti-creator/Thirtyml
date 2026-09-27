"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPaise } from "@/lib/utils";
import { createClubCode, toggleCode } from "./actions";

interface Row {
  code: string;
  discountType: "flat" | "percent";
  discountValue: number;
  maxDiscount: number | null;
  minCartValue: number;
  totalLimit: number | null;
  perUserLimit: number;
  isActive: boolean;
  used: number;
}

export function PromoClient({ clubId, rows }: { clubId: string; rows: Row[] }) {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [type, setType] = React.useState<"flat" | "percent">("percent");
  const [value, setValue] = React.useState(10);
  const [cap, setCap] = React.useState(300);
  const [min, setMin] = React.useState(500);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    const result = await createClubCode({
      clubId,
      code: code.toUpperCase(),
      discountType: type,
      discountValue: type === "percent" ? value * 100 : value * 100,
      maxDiscount: type === "percent" ? cap * 100 : undefined,
      minCartValue: min * 100,
      perUserLimit: 1,
    });
    setBusy(false);
    if (result.ok) {
      setCode("");
      router.refresh();
    } else setError(result.error);
  }

  return (
    <div>
      <div className="mb-6 rounded-md border border-line bg-night-raised p-4">
        <h2 className="font-display font-semibold">New code</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-5">
          <Input
            placeholder="CODE"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <select
            className="h-10 rounded-sm border border-line bg-night px-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
          >
            <option value="percent">% off</option>
            <option value="flat">Flat ₹ off</option>
          </select>
          <Input
            type="number"
            placeholder={type === "percent" ? "% off" : "₹ off"}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
          {type === "percent" && (
            <Input
              type="number"
              placeholder="Cap ₹"
              value={cap}
              onChange={(e) => setCap(Number(e.target.value))}
            />
          )}
          <Input
            type="number"
            placeholder="Min cart ₹"
            value={min}
            onChange={(e) => setMin(Number(e.target.value))}
          />
          <Button disabled={busy || !code} onClick={create}>
            {busy ? "Creating…" : "Create"}
          </Button>
          {error && (
            <p role="alert" className="text-sm text-danger sm:col-span-5">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-moon-dim">
              <th className="px-4 py-2 font-normal">Code</th>
              <th className="px-4 py-2 font-normal">Discount</th>
              <th className="px-4 py-2 font-normal">Min cart</th>
              <th className="px-4 py-2 font-normal">Used</th>
              <th className="px-4 py-2 font-normal">Active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono">{r.code}</td>
                <td className="tnum px-4 py-3">
                  {r.discountType === "flat"
                    ? formatPaise(r.discountValue)
                    : `${r.discountValue / 100}%`}
                  {r.discountType === "percent" && r.maxDiscount
                    ? ` (max ${formatPaise(r.maxDiscount)})`
                    : ""}
                </td>
                <td className="tnum px-4 py-3">{formatPaise(r.minCartValue)}</td>
                <td className="tnum px-4 py-3">{r.used}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={r.isActive ? "drop" : "default"}
                    onClick={() => toggleCode(clubId, r.code, !r.isActive).then(() => router.refresh())}
                    className="cursor-pointer"
                  >
                    {r.isActive ? "on" : "off"}
                  </Badge>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-moon-dim">
                  No codes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
