"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSupport } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getPaymentsProvider } from "@/lib/providers";
import { queueOrderConfirmationNotifications } from "@/lib/notifications";

const refundSchema = z.object({
  amount: z.coerce.number().int().min(1),
  reason: z.string().trim().min(3).max(500),
  method: z.enum(["original", "wallet"]),
});

export async function issueRefund(orderId: string, formData: FormData) {
  const session = await requireSupport();
  const parsed = refundSchema.safeParse({
    amount: formData.get("amount"),
    reason: formData.get("reason"),
    method: formData.get("method"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const amountPaise = parsed.data.amount * 100;

  const admin = supabaseAdmin();
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, total, status")
    .eq("id", orderId)
    .single();
  if (!order) throw new Error("Order not found");

  const { data: existingRefunds } = await admin
    .from("refunds")
    .select("amount, status")
    .eq("order_id", orderId);
  const refundedSoFar = (existingRefunds ?? []).reduce(
    (s, r) => s + (r.status !== "failed" ? r.amount : 0),
    0
  );
  if (refundedSoFar + amountPaise > order.total) {
    throw new Error("Refund exceeds order total");
  }

  if (parsed.data.method === "wallet") {
    await admin.from("wallet_ledger").insert({
      user_id: order.user_id,
      amount: amountPaise,
      type: "refund_credit",
      reference_type: "order",
      reference_id: orderId,
      note: `Admin refund: ${parsed.data.reason}`,
    });
    await admin.from("refunds").insert({
      order_id: orderId,
      amount: amountPaise,
      method: "wallet",
      status: "processed",
      reason: parsed.data.reason,
      initiated_by: session.userId,
    });
  } else {
    const { data: payment } = await admin
      .from("payments")
      .select("id, razorpay_payment_id")
      .eq("order_id", orderId)
      .eq("status", "captured")
      .maybeSingle();
    if (!payment?.razorpay_payment_id) {
      throw new Error("No captured payment to refund against");
    }
    const provider = getPaymentsProvider();
    const refund = await provider.createRefund({
      gatewayPaymentId: payment.razorpay_payment_id,
      amountPaise,
      idempotencyKey: `admin-${orderId}-${Date.now()}`,
      notes: { reason: parsed.data.reason },
    });
    await admin.from("refunds").insert({
      order_id: orderId,
      payment_id: payment.id,
      razorpay_refund_id: refund.gatewayRefundId,
      amount: amountPaise,
      method: "original",
      status: refund.status === "processed" ? "processed" : "pending",
      reason: parsed.data.reason,
      initiated_by: session.userId,
    });
  }

  if (refundedSoFar + amountPaise >= order.total) {
    await admin.from("orders").update({ status: "refunded" }).eq("id", orderId);
  } else if (order.status === "paid") {
    await admin.from("orders").update({ status: "partially_refunded" }).eq("id", orderId);
  }

  await admin.from("audit_logs").insert({
    actor_id: session.userId,
    action: "refund.issue",
    entity_type: "order",
    entity_id: orderId,
    reason: parsed.data.reason,
  });

  revalidatePath(`/admin/orders/${orderId}`);
}

export async function resendTicket(bookingId: string) {
  const session = await requireSupport();
  const admin = supabaseAdmin();
  const { data: booking } = await admin
    .from("bookings")
    .select("order_id")
    .eq("id", bookingId)
    .single();
  if (!booking) return;
  await queueOrderConfirmationNotifications(booking.order_id);
  await admin.from("audit_logs").insert({
    actor_id: session.userId,
    action: "ticket.resend",
    entity_type: "booking",
    entity_id: bookingId,
  });
}
