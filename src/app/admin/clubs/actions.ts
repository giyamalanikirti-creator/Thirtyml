"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

async function log(actor: string, action: string, clubId: string, reason?: string) {
  await supabaseAdmin().from("audit_logs").insert({
    actor_id: actor,
    action,
    entity_type: "club",
    entity_id: clubId,
    reason: reason ?? null,
  });
}

export async function approveClub(clubId: string) {
  const { userId } = await requireAdmin();
  await supabaseAdmin().from("clubs").update({ status: "approved" }).eq("id", clubId);
  await log(userId, "club.approve", clubId);
  revalidatePath("/admin/clubs");
}

export async function suspendClub(clubId: string) {
  const { userId } = await requireAdmin();
  await supabaseAdmin().from("clubs").update({ status: "suspended" }).eq("id", clubId);
  await log(userId, "club.suspend", clubId);
  revalidatePath("/admin/clubs");
}

export async function featureClub(clubId: string, featured: boolean) {
  const { userId } = await requireAdmin();
  await supabaseAdmin().from("clubs").update({ is_featured: featured }).eq("id", clubId);
  await log(userId, featured ? "club.feature" : "club.unfeature", clubId);
  revalidatePath("/admin/clubs");
}
