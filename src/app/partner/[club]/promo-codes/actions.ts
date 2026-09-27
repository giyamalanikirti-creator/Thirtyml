"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";

async function assertManager(clubId: string): Promise<string> {
  const session = await requireUser();
  const supabase = await supabaseServer();
  const { data: member } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", clubId)
    .eq("user_id", session.userId)
    .is("removed_at", null)
    .maybeSingle();
  if (!member || (member.role !== "owner" && member.role !== "manager")) {
    throw new Error("Not authorised");
  }
  return session.userId;
}

const codeSchema = z.object({
  clubId: z.string().uuid(),
  code: z.string().trim().min(3).max(20).regex(/^[A-Z0-9]+$/, "Uppercase letters/numbers only"),
  discountType: z.enum(["flat", "percent"]),
  discountValue: z.number().int().min(1),
  maxDiscount: z.number().int().min(0).optional(),
  minCartValue: z.number().int().min(0),
  totalLimit: z.number().int().min(1).optional(),
  perUserLimit: z.number().int().min(1),
});

export async function createClubCode(input: unknown) {
  const parsed = codeSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  await assertManager(parsed.data.clubId);
  const admin = supabaseAdmin();
  const { error } = await admin.from("coupons").insert({
    code: parsed.data.code,
    discount_type: parsed.data.discountType,
    discount_value: parsed.data.discountValue,
    max_discount: parsed.data.maxDiscount ?? null,
    min_cart_value: parsed.data.minCartValue,
    total_limit: parsed.data.totalLimit ?? null,
    per_user_limit: parsed.data.perUserLimit,
    funded_by: "club",
    club_id: parsed.data.clubId,
    is_active: true,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/partner/[club]/promo-codes`, "page");
  return { ok: true as const };
}

export async function toggleCode(clubId: string, code: string, active: boolean) {
  await assertManager(clubId);
  await supabaseAdmin()
    .from("coupons")
    .update({ is_active: active })
    .eq("code", code)
    .eq("club_id", clubId);
  revalidatePath(`/partner/[club]/promo-codes`, "page");
  return { ok: true as const };
}
