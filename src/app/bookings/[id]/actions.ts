"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { cancelBooking, quoteCancellation } from "@/lib/cancellation";
import type { RefundQuote } from "@/lib/cancellation";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";

export async function getCancellationQuote(
  bookingId: string
): Promise<RefundQuote | null> {
  const session = await requireUser();
  return quoteCancellation(bookingId, session.userId);
}

const cancelSchema = z.object({
  bookingId: z.string().uuid(),
  refundMethod: z.enum(["original", "wallet"]),
});

export async function cancelMyBooking(
  input: unknown
): Promise<{ ok: true; refundPaise: number } | { ok: false; error: string }> {
  const session = await requireUser();
  const parsed = cancelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Bad request" };
  const result = await cancelBooking({
    bookingId: parsed.data.bookingId,
    userId: session.userId,
    refundMethod: parsed.data.refundMethod,
  });
  if (result.ok) {
    revalidatePath(`/bookings/${parsed.data.bookingId}`);
    revalidatePath("/bookings");
  }
  return result;
}

const issueSchema = z.object({
  bookingId: z.string().uuid(),
  message: z.string().trim().min(10, "Tell us a bit more").max(2000),
});

export async function raiseIssue(
  input: unknown
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireUser();
  const parsed = issueSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Support isn't available in this environment" };
  }
  const supabase = await supabaseServer();
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: session.userId,
      subject: `Issue with booking`,
      booking_id: parsed.data.bookingId,
    })
    .select("id")
    .single();
  if (error || !ticket) {
    return { ok: false, error: error?.message ?? "Couldn't open a ticket" };
  }
  await supabase.from("support_messages").insert({
    ticket_id: ticket.id,
    author_id: session.userId,
    body: parsed.data.message,
  });
  return { ok: true };
}
