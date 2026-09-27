import "server-only";

import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/server";
import type { CartLine } from "@/lib/cart";

/**
 * Fee, tax, coupon and wallet math — server-only, always recomputed from the
 * database. GST rates live in platform_settings and MUST be confirmed with a
 * chartered accountant before launch; nothing here is tax advice.
 */

export interface FeeSettings {
  type: "flat" | "percent" | "both";
  bps: number;
  flatPaise: number;
  minPaise: number;
  maxPaise: number;
}

export interface TaxSettings {
  onConvenienceFeeBps: number;
  onTicketsBps: number;
}

const DEFAULT_FEE: FeeSettings = {
  type: "percent",
  bps: 350,
  flatPaise: 0,
  minPaise: 2000,
  maxPaise: 20000,
};
const DEFAULT_TAX: TaxSettings = { onConvenienceFeeBps: 1800, onTicketsBps: 0 };

export async function getFeeAndTaxSettings(): Promise<{
  fee: FeeSettings;
  tax: TaxSettings;
}> {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { fee: DEFAULT_FEE, tax: DEFAULT_TAX };
  }
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("platform_settings")
    .select("key, value")
    .in("key", ["convenience_fee", "gst"]);
  const map = new Map((data ?? []).map((r) => [r.key, r.value]));
  const feeRaw = map.get("convenience_fee") as Record<string, unknown> | undefined;
  const taxRaw = map.get("gst") as Record<string, unknown> | undefined;
  return {
    fee: {
      type: (feeRaw?.type as FeeSettings["type"]) ?? DEFAULT_FEE.type,
      bps: Number(feeRaw?.bps ?? DEFAULT_FEE.bps),
      flatPaise: Number(feeRaw?.flat_paise ?? 0),
      minPaise: Number(feeRaw?.min_paise ?? DEFAULT_FEE.minPaise),
      maxPaise: Number(feeRaw?.max_paise ?? DEFAULT_FEE.maxPaise),
    },
    tax: {
      onConvenienceFeeBps: Number(
        taxRaw?.on_convenience_fee_bps ?? DEFAULT_TAX.onConvenienceFeeBps
      ),
      onTicketsBps: Number(taxRaw?.on_tickets_bps ?? DEFAULT_TAX.onTicketsBps),
    },
  };
}

export function computeConvenienceFee(
  subtotal: number,
  fee: FeeSettings
): number {
  if (subtotal <= 0) return 0;
  let amount = 0;
  if (fee.type === "flat") amount = fee.flatPaise;
  else if (fee.type === "percent") amount = Math.round((subtotal * fee.bps) / 10000);
  else amount = fee.flatPaise + Math.round((subtotal * fee.bps) / 10000);
  return Math.min(Math.max(amount, fee.minPaise), fee.maxPaise);
}

export interface CouponCheck {
  ok: boolean;
  couponId?: string;
  discount?: number;
  error?: string;
}

export async function validateCoupon(
  code: string,
  userId: string | null,
  lines: CartLine[],
  subtotal: number
): Promise<CouponCheck> {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Demo mode mirrors the two seeded coupons.
    const upper = code.trim().toUpperCase();
    if (upper === "FIRSTNIGHT") {
      return {
        ok: true,
        couponId: "demo-firstnight",
        discount: Math.min(Math.round(subtotal * 0.2), 30000),
      };
    }
    if (upper === "AGRA100") {
      if (!lines.some((l) => l.citySlug === "agra")) {
        return { ok: false, error: "AGRA100 only works on Agra bookings" };
      }
      return { ok: true, couponId: "demo-agra100", discount: 10000 };
    }
    return { ok: false, error: "That code doesn't exist" };
  }

  const admin = supabaseAdmin();
  const { data: coupon } = await admin
    .from("coupons")
    .select("*")
    .ilike("code", code.trim())
    .maybeSingle();
  if (!coupon || !coupon.is_active) {
    return { ok: false, error: "That code doesn't exist or has ended" };
  }

  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return { ok: false, error: "This code isn't live yet" };
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return { ok: false, error: "This code has expired" };
  }
  if (subtotal < coupon.min_cart_value) {
    return { ok: false, error: "Cart value is below this code's minimum" };
  }
  if (coupon.days_of_week && coupon.days_of_week.length > 0) {
    const dows = new Set(
      lines.map((l) => new Date(`${l.nightDate}T12:00:00`).getDay())
    );
    if (![...dows].every((d) => coupon.days_of_week!.includes(d))) {
      return { ok: false, error: "This code isn't valid for those nights" };
    }
  }
  if (coupon.club_id && !lines.every((l) => l.clubId === coupon.club_id)) {
    return { ok: false, error: "This code only works at a specific club" };
  }
  if (coupon.city_id) {
    const { data: city } = await admin
      .from("cities")
      .select("slug")
      .eq("id", coupon.city_id)
      .single();
    if (city && !lines.every((l) => l.citySlug === city.slug)) {
      return { ok: false, error: `This code only works in ${city.slug}` };
    }
  }
  if (
    coupon.product_type &&
    !lines.every((l) => l.productType === coupon.product_type)
  ) {
    return { ok: false, error: "This code doesn't apply to these items" };
  }

  if (coupon.total_limit !== null) {
    const { count } = await admin
      .from("coupon_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", coupon.id);
    if ((count ?? 0) >= coupon.total_limit) {
      return { ok: false, error: "This code has been fully used up" };
    }
  }

  if (userId) {
    const { count } = await admin
      .from("coupon_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", coupon.id)
      .eq("user_id", userId);
    if ((count ?? 0) >= coupon.per_user_limit) {
      return { ok: false, error: "You've already used this code" };
    }
    if (coupon.first_booking_only || coupon.new_users_only) {
      const { count: paidCount } = await admin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("status", ["paid", "partially_refunded", "refunded"]);
      if ((paidCount ?? 0) > 0) {
        return { ok: false, error: "This code is for first bookings only" };
      }
    }
  }

  const discount =
    coupon.discount_type === "flat"
      ? Math.min(coupon.discount_value, subtotal)
      : Math.min(
          Math.round((subtotal * coupon.discount_value) / 10000),
          coupon.max_discount ?? Number.MAX_SAFE_INTEGER,
          subtotal
        );

  return { ok: true, couponId: coupon.id, discount };
}

export interface Totals {
  subtotal: number;
  discount: number;
  convenienceFee: number;
  tax: number;
  walletUsed: number;
  total: number;
}

export function computeTotals(params: {
  subtotal: number;
  discount: number;
  fee: FeeSettings;
  tax: TaxSettings;
  walletBalance: number;
  useWallet: boolean;
}): Totals {
  const discounted = Math.max(0, params.subtotal - params.discount);
  const convenienceFee = computeConvenienceFee(discounted, params.fee);
  const tax =
    Math.round((convenienceFee * params.tax.onConvenienceFeeBps) / 10000) +
    Math.round((discounted * params.tax.onTicketsBps) / 10000);
  const beforeWallet = discounted + convenienceFee + tax;
  const walletUsed = params.useWallet
    ? Math.min(params.walletBalance, beforeWallet)
    : 0;
  return {
    subtotal: params.subtotal,
    discount: params.discount,
    convenienceFee,
    tax,
    walletUsed,
    total: beforeWallet - walletUsed,
  };
}
