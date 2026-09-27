import "server-only";

import { randomUUID } from "node:crypto";
import { isSupabaseConfigured, supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import { getCartView, type CartView } from "@/lib/cart";
import {
  computeTotals,
  getFeeAndTaxSettings,
  validateCoupon,
  type Totals,
} from "@/lib/pricing";

/**
 * Order creation: snapshots prices, holds inventory for 10 minutes and
 * writes the order under the service role. Everything is recomputed
 * server-side — client-sent prices are never trusted.
 */

const HOLD_MINUTES = 10;

export interface GuestDetails {
  name: string;
  phone: string;
  email: string;
  guestNames?: string[];
}

export type CreateOrderResult =
  | { ok: true; orderId: string; total: number }
  | { ok: false; error: string };

export async function getWalletBalance(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("wallet_ledger")
    .select("amount, expires_at");
  if (!data) return 0;
  const now = Date.now();
  return data.reduce(
    (sum, row) =>
      row.amount < 0 || !row.expires_at || new Date(row.expires_at).getTime() > now
        ? sum + row.amount
        : sum,
    0
  );
}

export async function previewTotals(
  view: CartView,
  couponCode: string | null,
  useWallet: boolean,
  userId: string | null
): Promise<{ totals: Totals; couponError?: string }> {
  const { fee, tax } = await getFeeAndTaxSettings();
  let discount = 0;
  let couponError: string | undefined;
  const active = view.lines.filter((l) => !l.savedForLater);
  if (couponCode) {
    const check = await validateCoupon(couponCode, userId, active, view.subtotal);
    if (check.ok) discount = check.discount ?? 0;
    else couponError = check.error;
  }
  const walletBalance = useWallet ? await getWalletBalance() : 0;
  return {
    totals: computeTotals({
      subtotal: view.subtotal,
      discount,
      fee,
      tax,
      walletBalance,
      useWallet,
    }),
    couponError,
  };
}

export async function createOrderFromCart(params: {
  userId: string;
  guest: GuestDetails;
  couponCode: string | null;
  useWallet: boolean;
}): Promise<CreateOrderResult> {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false,
      error:
        "Checkout needs a configured Supabase project. In this demo environment you can browse and fill the cart, but not pay.",
    };
  }

  const view = await getCartView();
  const lines = view.lines.filter((l) => !l.savedForLater);
  if (lines.length === 0) return { ok: false, error: "Your cart is empty" };
  if (view.needsAcknowledgement) {
    return {
      ok: false,
      error: "Prices changed — confirm the new prices in your cart first",
    };
  }
  for (const line of lines) {
    if (line.available < line.quantity) {
      return {
        ok: false,
        error: `${line.productName} at ${line.clubName} has only ${line.available} left for that night`,
      };
    }
  }

  const admin = supabaseAdmin();
  const { fee, tax } = await getFeeAndTaxSettings();

  let discount = 0;
  let couponId: string | null = null;
  if (params.couponCode) {
    const check = await validateCoupon(
      params.couponCode,
      params.userId,
      lines,
      view.subtotal
    );
    if (!check.ok) return { ok: false, error: check.error ?? "Invalid code" };
    discount = check.discount ?? 0;
    couponId = check.couponId ?? null;
  }

  const walletBalance = params.useWallet ? await getWalletBalance() : 0;
  const totals = computeTotals({
    subtotal: view.subtotal,
    discount,
    fee,
    tax,
    walletBalance,
    useWallet: params.useWallet,
  });

  const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60000).toISOString();
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: params.userId,
      status: "pending_payment",
      subtotal: totals.subtotal,
      discount: totals.discount,
      convenience_fee: totals.convenienceFee,
      tax: totals.tax,
      wallet_used: totals.walletUsed,
      total: totals.total,
      coupon_id: couponId?.startsWith("demo-") ? null : couponId,
      hold_expires_at: holdExpiresAt,
      idempotency_key: randomUUID(),
      lead_guest_name: params.guest.name,
      lead_guest_phone: params.guest.phone,
      lead_guest_email: params.guest.email,
    })
    .select("id")
    .single();
  if (orderError || !order) {
    return { ok: false, error: orderError?.message ?? "Couldn't create order" };
  }

  // Snapshot items and hold inventory. place_hold re-checks availability
  // under an advisory lock, so two simultaneous checkouts can't both get the
  // last spot.
  for (const line of lines) {
    const { error: itemError } = await admin.from("order_items").insert({
      order_id: order.id,
      product_id: line.productId,
      night_date: line.nightDate,
      quantity: line.quantity,
      unit_price: line.currentPrice,
      product_name: line.productName,
      product_type: line.productType,
      club_id: line.clubId,
    });
    if (itemError) {
      await abortOrder(order.id);
      return { ok: false, error: itemError.message };
    }

    const { error: holdError } = await admin.rpc("place_hold", {
      p_product_id: line.productId,
      p_date: line.nightDate,
      p_quantity: line.quantity,
      p_order_id: order.id,
      p_hold_minutes: HOLD_MINUTES,
    });
    if (holdError) {
      await abortOrder(order.id);
      if (holdError.message.includes("sold_out")) {
        return {
          ok: false,
          error: `${line.productName} at ${line.clubName} just sold out for that night`,
        };
      }
      return { ok: false, error: holdError.message };
    }
  }

  return { ok: true, orderId: order.id, total: totals.total };
}

async function abortOrder(orderId: string): Promise<void> {
  const admin = supabaseAdmin();
  await admin.from("inventory_holds").delete().eq("order_id", orderId);
  await admin.from("order_items").delete().eq("order_id", orderId);
  await admin.from("orders").delete().eq("id", orderId);
}
