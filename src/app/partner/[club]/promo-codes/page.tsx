import type { Metadata } from "next";
import { requirePartnerClub } from "@/lib/partner/current";
import { supabaseAdmin } from "@/lib/supabase/server";
import { PartnerShell } from "@/components/partner/shell";
import { PromoClient } from "./promo-client";

export const metadata: Metadata = { title: "Promo codes" };
export const dynamic = "force-dynamic";

export default async function PromoCodesPage({
  params,
}: {
  params: Promise<{ club: string }>;
}) {
  const { club } = await params;
  const ctx = await requirePartnerClub(club, ["owner", "manager"]);
  const admin = supabaseAdmin();
  const { data: coupons } = await admin
    .from("coupons")
    .select("code, discount_type, discount_value, max_discount, min_cart_value, total_limit, per_user_limit, is_active")
    .eq("club_id", ctx.club.id)
    .eq("funded_by", "club")
    .order("code");

  const codes = (coupons ?? []).map((c) => c.code);
  const { data: redemptions } = codes.length
    ? await admin
        .from("coupon_redemptions")
        .select("coupon:coupons!inner(code)")
        .in("coupon.code", codes)
    : { data: [] as never[] };
  const useCount = new Map<string, number>();
  for (const r of redemptions ?? []) {
    useCount.set(r.coupon.code, (useCount.get(r.coupon.code) ?? 0) + 1);
  }

  return (
    <PartnerShell ctx={ctx} section="/promo-codes">
      <PromoClient
        clubId={ctx.club.id}
        rows={(coupons ?? []).map((c) => ({
          code: c.code,
          discountType: c.discount_type as "flat" | "percent",
          discountValue: c.discount_value,
          maxDiscount: c.max_discount,
          minCartValue: c.min_cart_value,
          totalLimit: c.total_limit,
          perUserLimit: c.per_user_limit,
          isActive: c.is_active,
          used: useCount.get(c.code) ?? 0,
        }))}
      />
    </PartnerShell>
  );
}
