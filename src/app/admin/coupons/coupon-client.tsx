"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPlatformCoupon } from "./actions";

export function CouponClient() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [type, setType] = React.useState<"flat" | "percent">("percent");
  const [value, setValue] = React.useState(10);
  const [cap, setCap] = React.useState(300);
  const [min, setMin] = React.useState(500);
  const [validUntil, setValidUntil] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    const result = await createPlatformCoupon({
      code: code.toUpperCase(),
      discountType: type,
      discountValue: value * 100,
      maxDiscount: type === "percent" ? cap * 100 : undefined,
      minCartValue: min * 100,
      validUntil: validUntil || undefined,
      perUserLimit: 1,
    });
    setBusy(false);
    if (result.ok) {
      setOpen(false);
      setCode("");
      router.refresh();
    } else setError(result.error);
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        + New platform coupon
      </Button>
    );
  }
  return (
    <div className="rounded-md border border-line bg-night-raised p-4">
      <div className="grid gap-2 sm:grid-cols-6">
        <Input placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
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
        <Input
          type="date"
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
        />
        <div className="flex gap-2 sm:col-span-6">
          <Button size="sm" disabled={busy || !code} onClick={create}>
            {busy ? "Creating…" : "Create"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
