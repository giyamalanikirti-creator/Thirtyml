import { NextResponse } from "next/server";
import { getUserAndProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** .ics download for a booking (night treated as 21:00–01:30 IST). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getUserAndProfile();
  if (!session) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }
  const supabase = await supabaseServer();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, booking_code, night_date, clubs(name, address)")
    .eq("id", id)
    .maybeSingle();
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const start = `${booking.night_date.replaceAll("-", "")}T210000`;
  const endDate = new Date(`${booking.night_date}T12:00:00`);
  endDate.setDate(endDate.getDate() + 1);
  const end = `${endDate.toISOString().slice(0, 10).replaceAll("-", "")}T013000`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ThirtyML//booking//EN",
    "BEGIN:VEVENT",
    `UID:${booking.id}@thirtyml`,
    `DTSTART;TZID=Asia/Kolkata:${start}`,
    `DTEND;TZID=Asia/Kolkata:${end}`,
    `SUMMARY:Night at ${booking.clubs?.name ?? "the club"} (ThirtyML)`,
    `DESCRIPTION:Booking code ${booking.booking_code}. QR ticket in your ThirtyML account.`,
    booking.clubs?.address ? `LOCATION:${booking.clubs.address}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="thirtyml-${booking.booking_code}.ics"`,
    },
  });
}
