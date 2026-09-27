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

const updatesSchema = z.object({
  clubId: z.string().uuid(),
  updates: z
    .array(
      z.object({
        productId: z.string().uuid(),
        basePrice: z.number().int().min(0).max(100_000_00),
        capacity: z.number().int().min(0).max(10000).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .min(1)
    .max(50),
});

export async function savePrices(input: unknown) {
  const parsed = updatesSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Bad input" };
  const actorId = await assertManager(parsed.data.clubId);

  const admin = supabaseAdmin();
  for (const upd of parsed.data.updates) {
    const patch: { base_price: number; capacity_per_night?: number; is_active?: boolean } = {
      base_price: upd.basePrice,
    };
    if (upd.capacity !== undefined) patch.capacity_per_night = upd.capacity;
    if (upd.isActive !== undefined) patch.is_active = upd.isActive;
    const { error } = await admin
      .from("products")
      .update(patch)
      .eq("id", upd.productId)
      .eq("club_id", parsed.data.clubId);
    if (error) return { ok: false as const, error: error.message };
  }
  await admin.from("audit_logs").insert({
    actor_id: actorId,
    action: "pricing.bulk_update",
    entity_type: "club",
    entity_id: parsed.data.clubId,
    reason: `${parsed.data.updates.length} product(s) updated`,
  });
  revalidatePath(`/partner/[club]/pricing`, "page");
  return { ok: true as const };
}

const overrideSchema = z.object({
  clubId: z.string().uuid(),
  productId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  price: z.number().int().min(0),
});

export async function upsertOverride(input: unknown) {
  const parsed = overrideSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Bad input" };
  await assertManager(parsed.data.clubId);
  const admin = supabaseAdmin();
  const { error } = await admin
    .from("price_overrides")
    .upsert(
      {
        product_id: parsed.data.productId,
        on_date: parsed.data.date,
        price: parsed.data.price,
      },
      { onConflict: "product_id,on_date" }
    );
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/partner/[club]/pricing`, "page");
  return { ok: true as const };
}

const ruleSchema = z.object({
  clubId: z.string().uuid(),
  productId: z.string().uuid(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  price: z.number().int().min(0),
});

export async function addPriceRule(input: unknown) {
  const parsed = ruleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Bad input" };
  await assertManager(parsed.data.clubId);
  const admin = supabaseAdmin();
  const { error } = await admin.from("price_rules").insert({
    product_id: parsed.data.productId,
    days_of_week: parsed.data.daysOfWeek,
    start_time: `${parsed.data.startTime}:00`,
    price: parsed.data.price,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/partner/[club]/pricing`, "page");
  return { ok: true as const };
}

export async function deletePriceRule(clubId: string, ruleId: string) {
  await assertManager(clubId);
  const admin = supabaseAdmin();
  await admin.from("price_rules").delete().eq("id", ruleId);
  revalidatePath(`/partner/[club]/pricing`, "page");
  return { ok: true as const };
}

export async function toggleNight(input: {
  clubId: string;
  date: string;
  isOpen: boolean;
  note?: string;
}) {
  await assertManager(input.clubId);
  const admin = supabaseAdmin();
  await admin.from("nights").upsert(
    {
      club_id: input.clubId,
      on_date: input.date,
      is_open: input.isOpen,
      note: input.note ?? null,
    },
    { onConflict: "club_id,on_date" }
  );
  revalidatePath(`/partner/[club]/pricing`, "page");
  return { ok: true as const };
}

const productSchema = z.object({
  clubId: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
  basePrice: z.number().int().min(0),
  capacity: z.number().int().min(0),
  maxPerOrder: z.number().int().min(1).max(50).default(6),
  coverRedeemable: z.boolean().default(false),
});

export async function createEntryProduct(input: unknown) {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Bad input" };
  await assertManager(parsed.data.clubId);
  const admin = supabaseAdmin();
  const { error } = await admin.from("products").insert({
    club_id: parsed.data.clubId,
    type: "entry",
    name: parsed.data.name,
    base_price: parsed.data.basePrice,
    capacity_per_night: parsed.data.capacity,
    max_per_order: parsed.data.maxPerOrder,
    cover_redeemable: parsed.data.coverRedeemable,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/partner/[club]/pricing`, "page");
  return { ok: true as const };
}
