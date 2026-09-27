import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ club: string }> }
) {
  const { club } = await params;
  const session = await requireUser();
  const supabase = await supabaseServer();
  const { data: found } = await supabase
    .from("clubs")
    .select("id, slug")
    .eq("slug", club)
    .maybeSingle();
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data: member } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", found.id)
    .eq("user_id", session.userId)
    .is("removed_at", null)
    .maybeSingle();
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const date =
    new URL(request.url).searchParams.get("date") ??
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

  const admin = supabaseAdmin();
  const { data: bookings } = await admin
    .from("bookings")
    .select(
      "booking_code, guest_count, status, created_at, orders(lead_guest_name, lead_guest_phone, lead_guest_email), tickets(guests_admitted)"
    )
    .eq("club_id", found.id)
    .eq("night_date", date);

  const rows = [
    ["Booking code", "Lead guest", "Phone", "Email", "Guests", "Admitted", "Status", "Booked at"].join(","),
    ...(bookings ?? []).map((b) =>
      [
        b.booking_code,
        JSON.stringify(b.orders?.lead_guest_name ?? ""),
        b.orders?.lead_guest_phone ?? "",
        b.orders?.lead_guest_email ?? "",
        b.guest_count,
        b.tickets?.[0]?.guests_admitted ?? 0,
        b.status,
        b.created_at,
      ].join(",")
    ),
  ];
  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="bookings-${club}-${date}.csv"`,
    },
  });
}
