"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import { todayIst } from "@/lib/data/catalog";

async function assertDoorStaff(clubId: string): Promise<string> {
  const session = await requireUser();
  const supabase = await supabaseServer();
  const { data: member } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", clubId)
    .eq("user_id", session.userId)
    .is("removed_at", null)
    .maybeSingle();
  if (!member) throw new Error("Not authorised");
  return session.userId;
}

const scanSchema = z.object({
  clubId: z.string().uuid(),
  token: z.string().min(4).max(64),
  guestsToAdmit: z.number().int().min(1).max(50),
});

export type ScanResult =
  | {
      ok: true;
      admitted: number;
      remaining: number;
      total: number;
      bookingCode: string;
      leadName: string | null;
      status: "just_admitted" | "already_used";
    }
  | { ok: false; reason: string };

/**
 * Validate a QR (or manually entered token) and admit guests. Everything
 * happens under the service role after a door-staff role check, so we can
 * write to tickets and check_ins irrespective of RLS.
 */
export async function admitGuests(input: unknown): Promise<ScanResult> {
  const parsed = scanSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "Bad scan" };
  const staffId = await assertDoorStaff(parsed.data.clubId);

  const admin = supabaseAdmin();
  const { data: ticket } = await admin
    .from("tickets")
    .select(
      "id, status, guests_total, guests_admitted, bookings!inner(id, club_id, night_date, status, booking_code, booking_guests(full_name, is_lead))"
    )
    .eq("qr_token", parsed.data.token)
    .maybeSingle();
  if (!ticket) return { ok: false, reason: "Unknown ticket" };

  const booking = ticket.bookings;
  if (booking.club_id !== parsed.data.clubId) {
    return { ok: false, reason: "Wrong club" };
  }
  const today = todayIst();
  if (booking.night_date !== today) {
    return {
      ok: false,
      reason: `Wrong date — this ticket is for ${booking.night_date}`,
    };
  }
  if (booking.status === "cancelled") {
    return { ok: false, reason: "Booking cancelled" };
  }
  if (ticket.status === "void") {
    return { ok: false, reason: "Ticket voided" };
  }

  const remaining = ticket.guests_total - ticket.guests_admitted;
  if (remaining <= 0) {
    return {
      ok: true,
      admitted: ticket.guests_admitted,
      remaining: 0,
      total: ticket.guests_total,
      bookingCode: booking.booking_code,
      leadName:
        booking.booking_guests?.find((g) => g.is_lead)?.full_name ?? null,
      status: "already_used",
    };
  }
  const admit = Math.min(remaining, parsed.data.guestsToAdmit);
  const newAdmitted = ticket.guests_admitted + admit;

  await admin
    .from("tickets")
    .update({
      guests_admitted: newAdmitted,
      status: newAdmitted >= ticket.guests_total ? "used" : "partially_used",
    })
    .eq("id", ticket.id);

  await admin.from("check_ins").insert({
    ticket_id: ticket.id,
    staff_id: staffId,
    guests_admitted: admit,
  });

  if (newAdmitted > 0 && booking.status === "confirmed") {
    await admin
      .from("bookings")
      .update({ status: "checked_in" })
      .eq("id", booking.id);
  }

  return {
    ok: true,
    admitted: admit,
    remaining: ticket.guests_total - newAdmitted,
    total: ticket.guests_total,
    bookingCode: booking.booking_code,
    leadName: booking.booking_guests?.find((g) => g.is_lead)?.full_name ?? null,
    status: "just_admitted",
  };
}
