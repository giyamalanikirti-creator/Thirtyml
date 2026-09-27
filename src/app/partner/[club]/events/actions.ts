"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

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

const eventSchema = z.object({
  clubId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
  startsAt: z.string(),
  endsAt: z.string().optional(),
  publish: z.boolean().default(false),
});

export async function createEvent(input: unknown) {
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Bad input" };
  await assertManager(parsed.data.clubId);
  const admin = supabaseAdmin();
  const slug = slugify(parsed.data.name);
  const { data, error } = await admin
    .from("events")
    .insert({
      club_id: parsed.data.clubId,
      slug,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt ?? null,
      status: parsed.data.publish ? "published" : "draft",
    })
    .select("id, slug")
    .single();
  if (error || !data) {
    return { ok: false as const, error: error?.message ?? "Failed" };
  }
  revalidatePath(`/partner/[club]/events`, "page");
  return { ok: true as const, eventId: data.id };
}

const tierSchema = z.object({
  clubId: z.string().uuid(),
  eventId: z.string().uuid(),
  name: z.string().trim().min(2).max(60),
  price: z.number().int().min(0),
  capacity: z.number().int().min(1).max(10000),
  maxPerOrder: z.number().int().min(1).max(50).default(6),
  salesStartAt: z.string().optional(),
  salesEndAt: z.string().optional(),
});

export async function addTier(input: unknown) {
  const parsed = tierSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Bad input" };
  await assertManager(parsed.data.clubId);
  const admin = supabaseAdmin();
  const { error } = await admin.from("products").insert({
    club_id: parsed.data.clubId,
    event_id: parsed.data.eventId,
    type: "event_ticket",
    name: parsed.data.name,
    base_price: parsed.data.price,
    capacity_per_night: parsed.data.capacity,
    max_per_order: parsed.data.maxPerOrder,
    sales_start_at: parsed.data.salesStartAt ?? null,
    sales_end_at: parsed.data.salesEndAt ?? null,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/partner/[club]/events`, "page");
  return { ok: true as const };
}

export async function publishEvent(clubId: string, eventId: string, publish: boolean) {
  await assertManager(clubId);
  const admin = supabaseAdmin();
  await admin
    .from("events")
    .update({ status: publish ? "published" : "draft" })
    .eq("id", eventId)
    .eq("club_id", clubId);
  revalidatePath(`/partner/[club]/events`, "page");
  return { ok: true as const };
}
