import type { Metadata } from "next";
import { requirePartnerClub } from "@/lib/partner/current";
import { supabaseAdmin } from "@/lib/supabase/server";
import { PartnerShell } from "@/components/partner/shell";
import { EventsClient, type EventListItem } from "./events-client";

export const metadata: Metadata = { title: "Events" };
export const dynamic = "force-dynamic";

export default async function ClubEventsPage({
  params,
}: {
  params: Promise<{ club: string }>;
}) {
  const { club } = await params;
  const ctx = await requirePartnerClub(club, ["owner", "manager"]);
  const admin = supabaseAdmin();
  const { data: events } = await admin
    .from("events")
    .select(
      "id, name, slug, status, starts_at, products(id, name, base_price, capacity_per_night, type)"
    )
    .eq("club_id", ctx.club.id)
    .order("starts_at", { ascending: false });

  const eventIds = (events ?? []).map((e) => e.id);
  const { data: sold } = eventIds.length
    ? await admin
        .from("order_items")
        .select("product_id, quantity")
        .in("product_id", (events ?? []).flatMap((e) => (e.products ?? []).map((p) => p.id)))
    : { data: [] as never[] };
  const soldMap = new Map<string, number>();
  for (const item of sold ?? []) {
    soldMap.set(item.product_id, (soldMap.get(item.product_id) ?? 0) + item.quantity);
  }

  const list: EventListItem[] = (events ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    slug: e.slug,
    status: e.status,
    startsAt: e.starts_at,
    tiers: (e.products ?? [])
      .filter((p) => p.type === "event_ticket")
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.base_price,
        capacity: p.capacity_per_night,
        sold: soldMap.get(p.id) ?? 0,
      })),
  }));

  return (
    <PartnerShell ctx={ctx} section="/events">
      <EventsClient clubId={ctx.club.id} events={list} />
    </PartnerShell>
  );
}
