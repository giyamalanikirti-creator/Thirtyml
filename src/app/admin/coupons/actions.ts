"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

const schema = z.object({
  code: z.string().trim().min(3).max(20).regex(/^[A-Z0-9]+$/),
  discountType: z.enum(["flat", "percent"]),
  discountValue: z.number().int().min(1),
  maxDiscount: z.number().int().min(0).optional(),
  minCartValue: z.number().int().min(0),
  validUntil: z.string().optional(),
  perUserLimit: z.number().int().min(1),
});

export async function createPlatformCoupon(input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const { userId } = await requireAdmin();
  const admin = supabaseAdmin();
  const { error } = await admin.from("coupons").insert({
    code: parsed.data.code,
    discount_type: parsed.data.discountType,
    discount_value: parsed.data.discountValue,
    max_discount: parsed.data.maxDiscount ?? null,
    min_cart_value: parsed.data.minCartValue,
    valid_until: parsed.data.validUntil ?? null,
    per_user_limit: parsed.data.perUserLimit,
    funded_by: "platform",
    is_active: true,
    created_by: userId,
  });
  if (error) return { ok: false as const, error: error.message };
  await admin.from("audit_logs").insert({
    actor_id: userId,
    action: "coupon.create",
    entity_type: "coupon",
    entity_id: parsed.data.code,
  });
  revalidatePath("/admin/coupons");
  return { ok: true as const };
}
