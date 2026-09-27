import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My bookings" };
export const dynamic = "force-dynamic";

const nightFmt = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
] as const;

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "upcoming" } = await searchParams;
  await requireUser();
  const supabase = await supabaseServer();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  let query = supabase
    .from("bookings")
    .select(
      "id, booking_code, night_date, guest_count, status, clubs(name, slug, cities(slug))"
    )
    .order("night_date", { ascending: tab === "upcoming" });
  if (tab === "cancelled") query = query.eq("status", "cancelled");
  else if (tab === "past")
    query = query.neq("status", "cancelled").lt("night_date", today);
  else query = query.neq("status", "cancelled").gte("night_date", today);

  const { data: bookings } = await query;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="font-display text-2xl font-semibold">My bookings</h1>

        <div className="mt-4 flex gap-2" role="tablist">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/bookings?tab=${t.key}`}
              role="tab"
              aria-selected={tab === t.key}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                tab === t.key
                  ? "border-sodium bg-sodium/15 text-sodium"
                  : "border-line text-moon-dim hover:text-moon"
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {(bookings ?? []).length === 0 ? (
          <div className="mt-8 rounded-md border border-line bg-night-raised p-8 text-center">
            <p className="text-sm text-moon-dim">
              {tab === "upcoming"
                ? "No upcoming nights. The board is live — go find one."
                : `No ${tab} bookings.`}
            </p>
            {tab === "upcoming" && (
              <Link
                href="/clubs"
                className={buttonVariants({ variant: "secondary" }) + " mt-4"}
              >
                Explore clubs
              </Link>
            )}
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {(bookings ?? []).map((b) => (
              <li key={b.id}>
                <Link
                  href={`/bookings/${b.id}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-line bg-night-raised px-4 py-3 hover:border-moon-dim"
                >
                  <div>
                    <p className="font-display font-semibold">{b.clubs?.name}</p>
                    <p className="text-sm text-moon-dim">
                      {nightFmt.format(new Date(`${b.night_date}T12:00:00`))} ·{" "}
                      {b.guest_count} guest{b.guest_count === 1 ? "" : "s"} ·{" "}
                      <span className="font-mono">{b.booking_code}</span>
                    </p>
                  </div>
                  <Badge
                    variant={
                      b.status === "confirmed" || b.status === "checked_in"
                        ? "drop"
                        : b.status === "cancelled"
                          ? "danger"
                          : "default"
                    }
                  >
                    {b.status.replace("_", " ")}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
