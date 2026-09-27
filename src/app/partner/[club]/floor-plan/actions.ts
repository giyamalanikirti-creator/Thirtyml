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

const addSchema = z.object({
  clubId: z.string().uuid(),
  floorPlanId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(20),
  capacity: z.number().int().min(1).max(50),
  minSpend: z.number().int().min(0),
  price: z.number().int().min(0),
  x: z.number().min(0).max(2000),
  y: z.number().min(0).max(2000),
  shape: z.enum(["round", "rect", "booth"]),
  zone: z.string().optional(),
});

/** Adds a new table: creates the underlying product (type=table, capacity=1
 *  meaning the table sells once per night) and the tables row that positions
 *  it. */
export async function addTable(input: unknown) {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Bad input" };
  await assertManager(parsed.data.clubId);
  const admin = supabaseAdmin();

  let floorPlanId = parsed.data.floorPlanId;
  if (!floorPlanId) {
    const { data: created } = await admin
      .from("floor_plans")
      .insert({ club_id: parsed.data.clubId, name: "Main floor" })
      .select("id")
      .single();
    if (!created) return { ok: false as const, error: "Couldn't create floor plan" };
    floorPlanId = created.id;
  }

  const { data: product, error: productError } = await admin
    .from("products")
    .insert({
      club_id: parsed.data.clubId,
      type: "table",
      name: `Table ${parsed.data.name} (${parsed.data.capacity} guests)`,
      base_price: parsed.data.price,
      capacity_per_night: 1,
      max_per_order: 1,
    })
    .select("id")
    .single();
  if (productError || !product) {
    return { ok: false as const, error: productError?.message ?? "Failed" };
  }

  const { error: tableError } = await admin.from("tables").insert({
    floor_plan_id: floorPlanId,
    product_id: product.id,
    name: parsed.data.name,
    x: parsed.data.x,
    y: parsed.data.y,
    shape: parsed.data.shape,
    capacity: parsed.data.capacity,
    min_spend: parsed.data.minSpend,
    zone: parsed.data.zone ?? null,
  });
  if (tableError) return { ok: false as const, error: tableError.message };

  revalidatePath(`/partner/[club]/floor-plan`, "page");
  return { ok: true as const };
}

const moveSchema = z.object({
  clubId: z.string().uuid(),
  tableId: z.string().uuid(),
  x: z.number(),
  y: z.number(),
});

export async function moveTable(input: unknown) {
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Bad input" };
  await assertManager(parsed.data.clubId);
  const admin = supabaseAdmin();
  await admin
    .from("tables")
    .update({ x: parsed.data.x, y: parsed.data.y })
    .eq("id", parsed.data.tableId);
  return { ok: true as const };
}
