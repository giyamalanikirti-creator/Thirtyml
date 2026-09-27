import type { Metadata } from "next";
import { requirePartnerClub } from "@/lib/partner/current";
import { supabaseAdmin } from "@/lib/supabase/server";
import { todayIst } from "@/lib/data/catalog";
import { PartnerShell } from "@/components/partner/shell";
import { PricingTable, type PricingRow } from "./pricing-table";
import { RulesAndHistory } from "./rules-and-history";

export const metadata: Metadata = { title: "Pricing" };
export const dynamic = "force-dynamic";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ club: string }>;
}) {
  const { club } = await params;
  const ctx = await requirePartnerClub(club, ["owner", "manager"]);
  const admin = supabaseAdmin();
  const date = todayIst();

  const [{ data: products }, { data: sold }, { data: rules }, { data: history }] =
    await Promise.all([
      admin
        .from("products")
        .select("id, name, base_price, capacity_per_night, is_active, price_updated_at, sort_order")
        .eq("club_id", ctx.club.id)
        .eq("type", "entry")
        .order("sort_order"),
      admin
        .from("order_items")
        .select("product_id, quantity")
        .eq("club_id", ctx.club.id)
        .eq("night_date", date),
      admin
        .from("price_rules")
        .select("id, product_id, days_of_week, start_time, price, is_active, products!inner(club_id, name)")
        .eq("products.club_id", ctx.club.id),
      admin
        .from("price_history")
        .select("new_price, old_price, reason, changed_at, changed_by, products!inner(club_id, name)")
        .eq("products.club_id", ctx.club.id)
        .order("changed_at", { ascending: false })
        .limit(80),
    ]);

  const soldMap = new Map<string, number>();
  for (const item of sold ?? []) {
    soldMap.set(item.product_id, (soldMap.get(item.product_id) ?? 0) + item.quantity);
  }

  const rows: PricingRow[] = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    basePrice: p.base_price,
    capacity: p.capacity_per_night,
    isActive: p.is_active,
    priceUpdatedAt: p.price_updated_at,
    sold: soldMap.get(p.id) ?? 0,
  }));

  return (
    <PartnerShell ctx={ctx} section="/pricing">
      <p className="mb-4 text-sm text-moon-dim">
        These prices go live the second you save. Customers see the change on
        their screens within a second.
      </p>
      <PricingTable clubId={ctx.club.id} rows={rows} />

      <div className="mt-8">
        <RulesAndHistory
          clubId={ctx.club.id}
          products={(products ?? []).map((p) => ({ id: p.id, name: p.name }))}
          rules={(rules ?? []).map((r) => ({
            id: r.id,
            productName: r.products.name,
            daysOfWeek: r.days_of_week,
            startTime: r.start_time,
            price: r.price,
          }))}
          history={(history ?? []).map((h) => ({
            productName: h.products.name,
            oldPrice: h.old_price,
            newPrice: h.new_price,
            reason: h.reason,
            changedAt: h.changed_at,
            by: h.changed_by,
          }))}
        />
      </div>
    </PartnerShell>
  );
}
