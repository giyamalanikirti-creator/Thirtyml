import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/shell";
import { Badge } from "@/components/ui/badge";
import { formatPaise } from "@/lib/utils";
import { CouponClient } from "./coupon-client";

export const metadata: Metadata = { title: "Coupons" };
export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const { profile } = await requireAdmin();
  const admin = supabaseAdmin();
  const { data: coupons } = await admin
    .from("coupons")
    .select("code, discount_type, discount_value, max_discount, min_cart_value, valid_until, is_active, funded_by, per_user_limit")
    .eq("funded_by", "platform")
    .order("code");

  const codes = (coupons ?? []).map((c) => c.code);
  const { data: redemptions } = codes.length
    ? await admin
        .from("coupon_redemptions")
        .select("discount_applied, coupon:coupons!inner(code)")
        .in("coupon.code", codes)
    : { data: [] as never[] };
  const stats = new Map<string, { uses: number; totalDiscount: number }>();
  for (const r of redemptions ?? []) {
    const existing = stats.get(r.coupon.code) ?? { uses: 0, totalDiscount: 0 };
    existing.uses += 1;
    existing.totalDiscount += r.discount_applied;
    stats.set(r.coupon.code, existing);
  }

  return (
    <AdminShell profile={profile} section="/coupons">
      <CouponClient />
      <div className="mt-6 overflow-x-auto rounded-md border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-moon-dim">
              <th className="px-4 py-2 font-normal">Code</th>
              <th className="px-4 py-2 font-normal">Discount</th>
              <th className="px-4 py-2 font-normal">Min cart</th>
              <th className="px-4 py-2 font-normal">Valid until</th>
              <th className="px-4 py-2 font-normal">Uses</th>
              <th className="px-4 py-2 font-normal">Cost</th>
              <th className="px-4 py-2 font-normal">Active</th>
            </tr>
          </thead>
          <tbody>
            {(coupons ?? []).map((c) => {
              const s = stats.get(c.code);
              return (
                <tr key={c.code} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-mono">{c.code}</td>
                  <td className="tnum px-4 py-3">
                    {c.discount_type === "flat"
                      ? formatPaise(c.discount_value)
                      : `${c.discount_value / 100}%`}
                    {c.discount_type === "percent" && c.max_discount
                      ? ` (max ${formatPaise(c.max_discount)})`
                      : ""}
                  </td>
                  <td className="tnum px-4 py-3">{formatPaise(c.min_cart_value)}</td>
                  <td className="px-4 py-3 text-moon-dim">
                    {c.valid_until
                      ? new Date(c.valid_until).toLocaleDateString("en-IN")
                      : "—"}
                  </td>
                  <td className="tnum px-4 py-3">{s?.uses ?? 0}</td>
                  <td className="tnum px-4 py-3">
                    {formatPaise(s?.totalDiscount ?? 0)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={c.is_active ? "drop" : "default"}>
                      {c.is_active ? "on" : "off"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
