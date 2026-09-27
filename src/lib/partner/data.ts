import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

/** Tonight-at-a-glance for a club. */
export async function clubOverview(clubId: string, date: string) {
  const admin = supabaseAdmin();
  const [{ data: products }, { data: bookings }, { count: orderCount }, { data: ratings }] =
    await Promise.all([
      admin
        .from("products")
        .select("id, type, name, capacity_per_night, base_price, price_updated_at, is_active")
        .eq("club_id", clubId)
        .eq("type", "entry")
        .eq("is_active", true),
      admin
        .from("bookings")
        .select("id, status, guest_count, tickets(guests_admitted, guests_total)")
        .eq("club_id", clubId)
        .eq("night_date", date),
      admin
        .from("order_items")
        .select("id", { count: "exact", head: true })
        .eq("club_id", clubId)
        .eq("night_date", date),
      admin.from("clubs").select("avg_rating, rating_count").eq("id", clubId).single(),
    ]);

  const confirmed = (bookings ?? []).filter((b) => b.status !== "cancelled");
  const guestsExpected = confirmed.reduce((s, b) => s + b.guest_count, 0);
  const admitted = confirmed.reduce(
    (s, b) => s + (b.tickets?.[0]?.guests_admitted ?? 0),
    0
  );

  const { data: sold } = await admin
    .from("order_items")
    .select("quantity, unit_price")
    .eq("club_id", clubId)
    .eq("night_date", date);
  const revenue = (sold ?? []).reduce(
    (s, i) => s + i.quantity * i.unit_price,
    0
  );
  const soldByProduct = new Map<string, number>();
  const { data: sold2 } = await admin
    .from("order_items")
    .select("product_id, quantity")
    .eq("club_id", clubId)
    .eq("night_date", date);
  for (const item of sold2 ?? []) {
    soldByProduct.set(
      item.product_id,
      (soldByProduct.get(item.product_id) ?? 0) + item.quantity
    );
  }

  const capacityLines = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.base_price,
    priceUpdatedAt: p.price_updated_at,
    capacity: p.capacity_per_night,
    sold: soldByProduct.get(p.id) ?? 0,
  }));

  return {
    bookings: confirmed.length,
    orderCount: orderCount ?? 0,
    guestsExpected,
    guestsAdmitted: admitted,
    revenue,
    capacity: capacityLines,
    rating: ratings?.avg_rating ?? null,
    ratingCount: ratings?.rating_count ?? 0,
  };
}
