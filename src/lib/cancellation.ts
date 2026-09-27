import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import { getPaymentsProvider } from "@/lib/providers";
import { queueNotification } from "@/lib/notifications";
import { formatPaise } from "@/lib/utils";

/**
 * Cancellations and refunds. Each club sets a policy per product type in
 * clubs.cancellation_policy, e.g.
 *   { "entry": {"type": "full_until_hours", "hours": 6},
 *     "table": {"type": "partial", "refund_bps": 5000, "hours": 24},
 *     "event_ticket": {"type": "non_refundable"} }
 * Missing entries fall back to full refund until 6 hours before the night.
 * The convenience fee is refunded only when the club cancels the night.
 */

interface PolicyRule {
  type: "non_refundable" | "full_until_hours" | "partial" | "reschedule_only";
  hours?: number;
  refund_bps?: number;
}

const DEFAULT_RULE: PolicyRule = { type: "full_until_hours", hours: 6 };

function ruleFor(
  policy: unknown,
  productType: string
): PolicyRule {
  if (policy && typeof policy === "object" && productType in policy) {
    return (policy as Record<string, PolicyRule>)[productType] ?? DEFAULT_RULE;
  }
  return DEFAULT_RULE;
}

/** Night is treated as starting 21:00 IST on its date. */
function nightStart(nightDate: string): Date {
  return new Date(`${nightDate}T21:00:00+05:30`);
}

export interface RefundQuote {
  cancellable: boolean;
  reason?: string;
  refundPaise: number;
  itemised: { name: string; paise: number }[];
}

export async function quoteCancellation(
  bookingId: string,
  userId: string
): Promise<RefundQuote | null> {
  const admin = supabaseAdmin();
  const { data: booking } = await admin
    .from("bookings")
    .select(
      `id, user_id, status, night_date, club_id, order_id,
       clubs(cancellation_policy, booking_cutoff_minutes)`
    )
    .eq("id", bookingId)
    .single();
  if (!booking || booking.user_id !== userId) return null;

  if (booking.status !== "confirmed") {
    return {
      cancellable: false,
      reason: `This booking is already ${booking.status.replace("_", " ")}`,
      refundPaise: 0,
      itemised: [],
    };
  }

  const { data: items } = await admin
    .from("order_items")
    .select("product_name, product_type, unit_price, quantity")
    .eq("order_id", booking.order_id)
    .eq("club_id", booking.club_id)
    .eq("night_date", booking.night_date);

  const hoursLeft =
    (nightStart(booking.night_date).getTime() - Date.now()) / 3600000;

  let refund = 0;
  const itemised: { name: string; paise: number }[] = [];
  let anyRefundable = false;

  for (const item of items ?? []) {
    const rule = ruleFor(booking.clubs?.cancellation_policy, item.product_type);
    const paid = item.unit_price * item.quantity;
    let itemRefund = 0;
    if (rule.type === "full_until_hours") {
      if (hoursLeft >= (rule.hours ?? 6)) {
        itemRefund = paid;
        anyRefundable = true;
      }
    } else if (rule.type === "partial") {
      if (hoursLeft >= (rule.hours ?? 24)) {
        itemRefund = Math.round((paid * (rule.refund_bps ?? 5000)) / 10000);
        anyRefundable = true;
      }
    }
    refund += itemRefund;
    itemised.push({ name: item.product_name, paise: itemRefund });
  }

  if (hoursLeft <= 0) {
    return {
      cancellable: false,
      reason: "The night has already started",
      refundPaise: 0,
      itemised: [],
    };
  }

  return {
    cancellable: true,
    reason: anyRefundable
      ? undefined
      : "Past the refund window — cancelling now returns nothing",
    refundPaise: refund,
    itemised,
  };
}

export async function cancelBooking(params: {
  bookingId: string;
  userId: string;
  refundMethod: "original" | "wallet";
}): Promise<{ ok: true; refundPaise: number } | { ok: false; error: string }> {
  const quote = await quoteCancellation(params.bookingId, params.userId);
  if (!quote) return { ok: false, error: "Booking not found" };
  if (!quote.cancellable) {
    return { ok: false, error: quote.reason ?? "Can't cancel this booking" };
  }

  const admin = supabaseAdmin();

  // Atomic claim so double-clicks can't refund twice.
  const { data: claimed } = await admin
    .from("bookings")
    .update({
      status: "cancelled",
      cancellation_reason: "customer_cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", params.bookingId)
    .eq("status", "confirmed")
    .select("id, order_id, user_id, night_date, clubs(name)")
    .maybeSingle();
  if (!claimed) return { ok: false, error: "Already cancelled" };

  await admin
    .from("tickets")
    .update({ status: "void" })
    .eq("booking_id", params.bookingId);

  if (quote.refundPaise > 0) {
    if (params.refundMethod === "wallet") {
      await admin.from("wallet_ledger").insert({
        user_id: claimed.user_id,
        amount: quote.refundPaise,
        type: "refund_credit",
        reference_type: "booking",
        reference_id: params.bookingId,
        note: `Cancelled ${claimed.clubs?.name ?? "booking"} · ${claimed.night_date}`,
      });
      await admin.from("refunds").insert({
        order_id: claimed.order_id,
        booking_id: params.bookingId,
        amount: quote.refundPaise,
        method: "wallet",
        status: "processed",
        reason: "customer cancellation (wallet credit)",
        initiated_by: params.userId,
      });
    } else {
      const { data: payment } = await admin
        .from("payments")
        .select("id, razorpay_payment_id")
        .eq("order_id", claimed.order_id)
        .eq("status", "captured")
        .maybeSingle();
      if (!payment?.razorpay_payment_id) {
        return { ok: false, error: "Original payment not found for refund" };
      }
      const provider = getPaymentsProvider();
      const refund = await provider.createRefund({
        gatewayPaymentId: payment.razorpay_payment_id,
        amountPaise: quote.refundPaise,
        idempotencyKey: `cancel-${params.bookingId}`,
        notes: { booking_id: params.bookingId },
      });
      await admin.from("refunds").insert({
        order_id: claimed.order_id,
        booking_id: params.bookingId,
        payment_id: payment.id,
        razorpay_refund_id: refund.gatewayRefundId,
        amount: quote.refundPaise,
        method: "original",
        status: refund.status === "processed" ? "processed" : "pending",
        reason: "customer cancellation",
        initiated_by: params.userId,
      });
    }
  }

  await queueNotification({
    userId: claimed.user_id,
    category: "booking_cancelled",
    channel: "in_app",
    title: "Booking cancelled",
    body:
      quote.refundPaise > 0
        ? `Your booking at ${claimed.clubs?.name ?? "the club"} is cancelled. Refund: ${formatPaise(quote.refundPaise)} (${params.refundMethod === "wallet" ? "wallet credit, instant" : "to your original payment method, 5–7 working days"}).`
        : `Your booking at ${claimed.clubs?.name ?? "the club"} is cancelled. No refund was due under the club's policy.`,
  });
  await queueNotification({
    userId: claimed.user_id,
    category: "booking_cancelled",
    channel: "email",
    title: "Your ThirtyML booking is cancelled",
    body:
      quote.refundPaise > 0
        ? `Booking at ${claimed.clubs?.name} on ${claimed.night_date} cancelled. Refund of ${formatPaise(quote.refundPaise)} initiated via ${params.refundMethod}.`
        : `Booking at ${claimed.clubs?.name} on ${claimed.night_date} cancelled. No refund was due under the club's policy.`,
  });

  return { ok: true, refundPaise: quote.refundPaise };
}

/** Club/admin: cancel a whole night and refund everyone in full. */
export async function cancelNight(params: {
  clubId: string;
  nightDate: string;
  actorId: string;
}): Promise<{ refundedBookings: number }> {
  const admin = supabaseAdmin();
  const { data: bookings } = await admin
    .from("bookings")
    .select("id, order_id, user_id, orders(total), clubs(name)")
    .eq("club_id", params.clubId)
    .eq("night_date", params.nightDate)
    .eq("status", "confirmed");

  let refunded = 0;
  for (const booking of bookings ?? []) {
    const { data: claimed } = await admin
      .from("bookings")
      .update({
        status: "cancelled",
        cancellation_reason: "night_cancelled_by_club",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", booking.id)
      .eq("status", "confirmed")
      .select("id")
      .maybeSingle();
    if (!claimed) continue;

    await admin
      .from("tickets")
      .update({ status: "void" })
      .eq("booking_id", booking.id);

    // Full refund including fees — the club cancelled, not the customer.
    const { data: items } = await admin
      .from("order_items")
      .select("unit_price, quantity")
      .eq("order_id", booking.order_id)
      .eq("club_id", params.clubId)
      .eq("night_date", params.nightDate);
    const amount = (items ?? []).reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );
    if (amount > 0) {
      const { data: payment } = await admin
        .from("payments")
        .select("id, razorpay_payment_id")
        .eq("order_id", booking.order_id)
        .eq("status", "captured")
        .maybeSingle();
      if (payment?.razorpay_payment_id) {
        try {
          const provider = getPaymentsProvider();
          const refund = await provider.createRefund({
            gatewayPaymentId: payment.razorpay_payment_id,
            amountPaise: amount,
            idempotencyKey: `night-${params.clubId}-${params.nightDate}-${booking.id}`,
            notes: { reason: "night_cancelled" },
          });
          await admin.from("refunds").insert({
            order_id: booking.order_id,
            booking_id: booking.id,
            payment_id: payment.id,
            razorpay_refund_id: refund.gatewayRefundId,
            amount,
            method: "original",
            status: refund.status === "processed" ? "processed" : "pending",
            reason: "night cancelled by club",
            initiated_by: params.actorId,
          });
        } catch (e) {
          console.error("night refund failed", booking.id, e);
        }
      }
    }

    await queueNotification({
      userId: booking.user_id,
      category: "night_cancelled",
      channel: "in_app",
      title: "Night cancelled — full refund on its way",
      body: `${booking.clubs?.name ?? "The club"} cancelled ${params.nightDate}. Your full payment is being refunded to your original method.`,
    });
    await queueNotification({
      userId: booking.user_id,
      category: "night_cancelled",
      channel: "email",
      title: "Night cancelled — full refund on its way",
      body: `${booking.clubs?.name ?? "The club"} cancelled ${params.nightDate}. Your full payment is being refunded.`,
    });
    refunded += 1;
  }

  await admin
    .from("nights")
    .upsert(
      {
        club_id: params.clubId,
        on_date: params.nightDate,
        is_open: false,
        note: "Cancelled",
      },
      { onConflict: "club_id,on_date" }
    );

  await admin.from("audit_logs").insert({
    actor_id: params.actorId,
    action: "night.cancel",
    entity_type: "club",
    entity_id: params.clubId,
    reason: `night ${params.nightDate} cancelled, ${refunded} bookings refunded`,
  });

  return { refundedBookings: refunded };
}
