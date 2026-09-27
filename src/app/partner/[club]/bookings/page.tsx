import type { Metadata } from "next";
import { requirePartnerClub } from "@/lib/partner/current";
import { supabaseAdmin } from "@/lib/supabase/server";
import { todayIst } from "@/lib/data/catalog";
import { PartnerShell } from "@/components/partner/shell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Bookings" };
export const dynamic = "force-dynamic";

export default async function ClubBookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ club: string }>;
  searchParams: Promise<{ date?: string; q?: string }>;
}) {
  const { club } = await params;
  const ctx = await requirePartnerClub(club);
  const sp = await searchParams;
  const date = sp.date ?? todayIst();

  const admin = supabaseAdmin();
  const { data: bookings } = await admin
    .from("bookings")
    .select(
      "id, booking_code, night_date, guest_count, status, created_at, orders(lead_guest_name, lead_guest_phone), tickets(guests_admitted, guests_total)"
    )
    .eq("club_id", ctx.club.id)
    .eq("night_date", date)
    .order("created_at", { ascending: false });

  const filtered = sp.q
    ? (bookings ?? []).filter(
        (b) =>
          b.booking_code.toLowerCase().includes(sp.q!.toLowerCase()) ||
          (b.orders?.lead_guest_name ?? "").toLowerCase().includes(sp.q!.toLowerCase()) ||
          (b.orders?.lead_guest_phone ?? "").includes(sp.q!)
      )
    : bookings ?? [];

  return (
    <PartnerShell
      ctx={ctx}
      section="/bookings"
      actions={
        <a
          href={`/api/partner/${ctx.club.slug}/bookings/export?date=${date}`}
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          Export CSV
        </a>
      }
    >
      <form className="mb-4 flex flex-wrap gap-2" action="">
        <Input type="date" name="date" defaultValue={date} />
        <Input name="q" placeholder="Search code, name, phone" defaultValue={sp.q ?? ""} />
        <button className={buttonVariants({ variant: "secondary", size: "md" })}>
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-moon-dim">
              <th className="px-4 py-2 font-normal">Code</th>
              <th className="px-4 py-2 font-normal">Guest</th>
              <th className="px-4 py-2 font-normal">Phone</th>
              <th className="px-4 py-2 font-normal">Guests</th>
              <th className="px-4 py-2 font-normal">Status</th>
              <th className="px-4 py-2 font-normal">Booked</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono">{b.booking_code}</td>
                <td className="px-4 py-3">{b.orders?.lead_guest_name ?? "—"}</td>
                <td className="px-4 py-3 text-moon-dim">{b.orders?.lead_guest_phone ?? "—"}</td>
                <td className="tnum px-4 py-3">
                  {b.tickets?.[0]?.guests_admitted ?? 0} / {b.guest_count}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      b.status === "checked_in"
                        ? "drop"
                        : b.status === "cancelled"
                          ? "danger"
                          : "default"
                    }
                  >
                    {b.status.replace("_", " ")}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-moon-dim">
                  {new Date(b.created_at).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-moon-dim">
                  No bookings match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PartnerShell>
  );
}
