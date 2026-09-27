import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import { getPaymentsProvider } from "@/lib/providers";
import { queueOrderConfirmationNotifications } from "@/lib/notifications";

/**
 * Payment orchestration. Everything here is idempotent: the client callback
 * and the webhook can both arrive, in any order, without double-confirming.
 */

export interface GatewayOrderInfo {
  gatewayOrderId: string;
  keyId: string | null;
  amountPaise: number;
  providerName: string;
}

/** Create (or reuse) the gateway order for one of our pending orders. */
export async function ensureGatewayOrder(
  orderId: string,
  userId: string
): Promise<
  | { ok: true; info: GatewayOrderInfo; holdExpiresAt: string | null }
  | { ok: false; error: string }
> {
  const admin = supabaseAdmin();
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, status, total, hold_expires_at, idempotency_key")
    .eq("id", orderId)
    .single();
  if (!order || order.user_id !== userId) {
    return { ok: false, error: "Order not found" };
  }
  if (order.status === "paid") return { ok: false, error: "Already paid" };
  if (order.status !== "pending_payment") {
    return { ok: false, error: "This order can no longer be paid" };
  }
  if (order.hold_expires_at && new Date(order.hold_expires_at) < new Date()) {
    return { ok: false, error: "The 10-minute price lock has expired" };
  }

  const provider = getPaymentsProvider();

  const { data: existing } = await admin
    .from("payments")
    .select("razorpay_order_id, amount")
    .eq("order_id", orderId)
    .eq("status", "created")
    .maybeSingle();
  if (existing) {
    return {
      ok: true,
      info: {
        gatewayOrderId: existing.razorpay_order_id,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? null,
        amountPaise: existing.amount,
        providerName: provider.name,
      },
      holdExpiresAt: order.hold_expires_at,
    };
  }

  const gateway = await provider.createOrder({
    orderId,
    amountPaise: order.total,
    currency: "INR",
    idempotencyKey: order.idempotency_key,
  });

  await admin.from("payments").insert({
    order_id: orderId,
    razorpay_order_id: gateway.gatewayOrderId,
    status: "created",
    amount: order.total,
  });

  return {
    ok: true,
    info: {
      gatewayOrderId: gateway.gatewayOrderId,
      keyId: gateway.keyId,
      amountPaise: gateway.amountPaise,
      providerName: provider.name,
    },
    holdExpiresAt: order.hold_expires_at,
  };
}

/**
 * Mark an order paid and create everything downstream: bookings, tickets,
 * invoice, coupon redemption, wallet debit, notifications. Idempotent —
 * a second call (webhook after callback) no-ops.
 */
export async function finalizeOrderPaid(params: {
  orderId: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  method?: string;
  rawPayload?: unknown;
}): Promise<{ ok: boolean; alreadyDone?: boolean; error?: string }> {
  const admin = supabaseAdmin();

  // Atomic claim: only one caller flips pending_payment → paid.
  const { data: claimed } = await admin
    .from("orders")
    .update({ status: "paid" })
    .eq("id", params.orderId)
    .eq("status", "pending_payment")
    .select("id, user_id, coupon_id, discount, wallet_used, total, subtotal, convenience_fee, tax, lead_guest_name, lead_guest_email, lead_guest_phone")
    .maybeSingle();

  if (!claimed) {
    const { data: current } = await admin
      .from("orders")
      .select("status")
      .eq("id", params.orderId)
      .single();
    if (current?.status === "paid") return { ok: true, alreadyDone: true };
    return { ok: false, error: `Order is ${current?.status ?? "missing"}` };
  }

  await admin
    .from("payments")
    .update({
      razorpay_payment_id: params.gatewayPaymentId,
      status: "captured",
      method: params.method ?? null,
      raw_payload: (params.rawPayload as never) ?? null,
    })
    .eq("order_id", params.orderId)
    .eq("razorpay_order_id", params.gatewayOrderId);

  // Bookings: one per club+night from the snapshot items.
  const { data: items } = await admin
    .from("order_items")
    .select("product_id, club_id, night_date, quantity, product_type, unit_price, product_name")
    .eq("order_id", params.orderId);

  const groups = new Map<string, { clubId: string; night: string; guests: number }>();
  for (const item of items ?? []) {
    const key = `${item.club_id}:${item.night_date}`;
    const group = groups.get(key) ?? {
      clubId: item.club_id,
      night: item.night_date,
      guests: 0,
    };
    // Couples count as 2 guests, group-of-4 tickets as 4; default 1/qty.
    const per = /couple/i.test(item.product_name)
      ? 2
      : /group of 4/i.test(item.product_name)
        ? 4
        : 1;
    group.guests += item.quantity * per;
    groups.set(key, group);
  }

  for (const group of groups.values()) {
    const { data: booking } = await admin
      .from("bookings")
      .insert({
        order_id: params.orderId,
        user_id: claimed.user_id,
        club_id: group.clubId,
        night_date: group.night,
        status: "confirmed",
        guest_count: group.guests,
      })
      .select("id")
      .single();
    if (booking) {
      if (claimed.lead_guest_name) {
        await admin.from("booking_guests").insert({
          booking_id: booking.id,
          full_name: claimed.lead_guest_name,
          is_lead: true,
        });
      }
      await admin.from("tickets").insert({
        booking_id: booking.id,
        guests_total: group.guests,
      });
    }
  }

  // Holds are no longer needed — the sale is recorded in order_items.
  await admin.from("inventory_holds").delete().eq("order_id", params.orderId);

  // Coupon redemption
  if (claimed.coupon_id) {
    await admin.from("coupon_redemptions").insert({
      coupon_id: claimed.coupon_id,
      user_id: claimed.user_id,
      order_id: params.orderId,
      discount_applied: claimed.discount,
    });
  }

  // Wallet debit
  if (claimed.wallet_used > 0) {
    await admin.from("wallet_ledger").insert({
      user_id: claimed.user_id,
      amount: -claimed.wallet_used,
      type: "order_payment",
      reference_type: "order",
      reference_id: params.orderId,
    });
  }

  // Invoice with a sequential per-FY number
  const { data: invoiceNumber } = await admin.rpc("next_invoice_number");
  const { data: settings } = await admin
    .from("platform_settings")
    .select("value")
    .eq("key", "seller_gstin")
    .maybeSingle();
  if (invoiceNumber) {
    await admin.from("invoices").insert({
      order_id: params.orderId,
      invoice_number: invoiceNumber,
      financial_year: invoiceNumber.split("/")[1] ?? "",
      seller_gstin: (settings?.value as string) || null,
      totals: {
        subtotal: claimed.subtotal,
        discount: claimed.discount,
        convenience_fee: claimed.convenience_fee,
        tax: claimed.tax,
        wallet_used: claimed.wallet_used,
        total: claimed.total,
      },
    });
  }

  // Clear the user's cart and queue confirmations via the outbox.
  const { data: cart } = await admin
    .from("carts")
    .select("id")
    .eq("user_id", claimed.user_id)
    .maybeSingle();
  if (cart) {
    await admin
      .from("cart_items")
      .delete()
      .eq("cart_id", cart.id)
      .eq("saved_for_later", false);
  }

  await queueOrderConfirmationNotifications(params.orderId);

  return { ok: true };
}

export async function markPaymentFailed(params: {
  gatewayOrderId: string;
  reason?: string;
  rawPayload?: unknown;
}): Promise<void> {
  const admin = supabaseAdmin();
  await admin
    .from("payments")
    .update({
      status: "failed",
      raw_payload: (params.rawPayload as never) ?? null,
    })
    .eq("razorpay_order_id", params.gatewayOrderId)
    .neq("status", "captured");
  // The order stays pending_payment and retryable until its hold expires.
}

/** Reconciliation: resolve pending orders against the gateway. */
export async function reconcilePendingOrders(): Promise<{
  checked: number;
  resolved: number;
}> {
  const admin = supabaseAdmin();
  const provider = getPaymentsProvider();
  const { data: pending } = await admin
    .from("payments")
    .select("order_id, razorpay_order_id, razorpay_payment_id, status, orders!inner(status)")
    .eq("orders.status", "pending_payment")
    .in("status", ["created", "authorized"])
    .limit(100);

  let resolved = 0;
  for (const payment of pending ?? []) {
    if (!payment.razorpay_payment_id) continue;
    try {
      const status = await provider.fetchPaymentStatus(
        payment.razorpay_payment_id
      );
      if (status.status === "captured") {
        await finalizeOrderPaid({
          orderId: payment.order_id,
          gatewayOrderId: payment.razorpay_order_id,
          gatewayPaymentId: payment.razorpay_payment_id,
        });
        resolved += 1;
      }
    } catch (e) {
      console.error("reconcile failed for", payment.order_id, e);
    }
  }
  return { checked: pending?.length ?? 0, resolved };
}
