import type { Metadata } from "next";
import { requirePartnerClub } from "@/lib/partner/current";
import { supabaseAdmin } from "@/lib/supabase/server";
import { todayIst } from "@/lib/data/catalog";
import { PartnerShell } from "@/components/partner/shell";
import { ScannerClient } from "./scanner-client";

export const metadata: Metadata = { title: "Check-in" };
export const dynamic = "force-dynamic";

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ club: string }>;
}) {
  const { club } = await params;
  const ctx = await requirePartnerClub(club);
  const admin = supabaseAdmin();
  const date = todayIst();

  const { data: bookings } = await admin
    .from("bookings")
    .select("guest_count, tickets(guests_admitted)")
    .eq("club_id", ctx.club.id)
    .eq("night_date", date)
    .neq("status", "cancelled");
  const expected = (bookings ?? []).reduce((s, b) => s + b.guest_count, 0);
  const admitted = (bookings ?? []).reduce(
    (s, b) => s + (b.tickets?.[0]?.guests_admitted ?? 0),
    0
  );

  return (
    <PartnerShell
      ctx={ctx}
      section="/check-in"
      actions={
        <span className="tnum rounded-full border border-line px-3 py-1 text-sm">
          {admitted} / {expected} in
        </span>
      }
    >
      <ScannerClient clubId={ctx.club.id} />
    </PartnerShell>
  );
}
