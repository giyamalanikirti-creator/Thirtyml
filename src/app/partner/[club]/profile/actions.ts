"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";

async function assertManager(clubId: string) {
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
}

const profileSchema = z.object({
  clubId: z.string().uuid(),
  description: z.string().trim().max(2000).optional(),
  address: z.string().trim().max(300).optional(),
  websiteUrl: z.string().trim().url().or(z.literal("")).optional(),
  instagramUrl: z.string().trim().url().or(z.literal("")).optional(),
  phone: z.string().trim().max(20).optional(),
  dressCode: z.string().trim().max(80).optional(),
  minAge: z.number().int().min(18).max(30),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  houseRules: z.string().trim().max(2000).optional(),
  requiresGuestNames: z.boolean(),
  bookingCutoffMinutes: z.number().int().min(0).max(1440),
});

export async function saveProfile(input: unknown) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0].message };
  }
  await assertManager(parsed.data.clubId);
  const admin = supabaseAdmin();
  const { error } = await admin
    .from("clubs")
    .update({
      description: parsed.data.description || null,
      address: parsed.data.address || null,
      website_url: parsed.data.websiteUrl || null,
      instagram_url: parsed.data.instagramUrl || null,
      phone: parsed.data.phone || null,
      dress_code: parsed.data.dressCode || null,
      min_age: parsed.data.minAge,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      house_rules: parsed.data.houseRules || null,
      requires_guest_names: parsed.data.requiresGuestNames,
      booking_cutoff_minutes: parsed.data.bookingCutoffMinutes,
    })
    .eq("id", parsed.data.clubId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/partner/[club]/profile`, "page");
  return { ok: true as const };
}
