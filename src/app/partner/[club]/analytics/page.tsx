import type { Metadata } from "next";
import { requirePartnerClub } from "@/lib/partner/current";
import { supabaseAdmin } from "@/lib/supabase/server";
import { PartnerShell } from "@/components/partner/shell";
import { formatPaise } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

function thirtyDaysAgoIso(): string {
  return new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-md border border-line bg-night-raised p-4">
      <p className="text-xs uppercase tracking-widest text-moon-dim">{label}</p>
      <p className="tnum mt-1 font-display text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-moon-dim">{sub}</p>}
    </div>
  );
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ club: string }>;
}) {
  const { club } = await params;
  const ctx = await requirePartnerClub(club, ["owner", "manager", "finance"]);
  const admin = supabaseAdmin();

  const since30 = thirtyDaysAgoIso();
  const { data: items } = await admin
    .from("order_items")
    .select("quantity, unit_price, night_date")
    .eq("club_id", ctx.club.id)
    .gte("night_date", since30);

  const revenue = (items ?? []).reduce(
    (s, i) => s + i.quantity * i.unit_price,
    0
  );
  const byNight = new Map<string, number>();
  const byDow = new Array(7).fill(0);
  for (const item of items ?? []) {
    const rev = item.quantity * item.unit_price;
    byNight.set(item.night_date, (byNight.get(item.night_date) ?? 0) + rev);
    byDow[new Date(`${item.night_date}T12:00:00`).getDay()] += rev;
  }

  const { count: orderCount } = await admin
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("club_id", ctx.club.id)
    .gte("night_date", since30);

  const { count: bookingCount } = await admin
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("club_id", ctx.club.id)
    .gte("night_date", since30)
    .neq("status", "cancelled");
  const aov = bookingCount && bookingCount > 0 ? Math.round(revenue / bookingCount) : 0;

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const maxDow = Math.max(1, ...byDow);

  return (
    <PartnerShell ctx={ctx} section="/analytics">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue (30d)" value={formatPaise(revenue)} />
        <Stat label="Bookings (30d)" value={bookingCount ?? 0} />
        <Stat label="Line items (30d)" value={orderCount ?? 0} />
        <Stat label="Average per booking" value={formatPaise(aov)} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-semibold">
          Revenue by day of week
        </h2>
        <div className="grid grid-cols-7 items-end gap-2 rounded-md border border-line bg-night-raised p-4">
          {byDow.map((rev, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="flex h-40 w-full items-end">
                <div
                  className="w-full rounded-t-sm bg-sodium"
                  style={{ height: `${(rev / maxDow) * 100}%` }}
                  title={formatPaise(rev)}
                />
              </div>
              <p className="mt-1 text-xs text-moon-dim">{dayNames[i]}</p>
              <p className="tnum text-[10px] text-moon-dim">
                {rev > 0 ? formatPaise(rev) : "—"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-8 text-xs text-moon-dim">
        Deeper analytics (funnel, price-change impact, repeat customers)
        arrive after launch in Phase 10.
      </p>
    </PartnerShell>
  );
}
