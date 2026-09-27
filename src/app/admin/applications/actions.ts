"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function markApplication(
  id: string,
  status: "approved" | "rejected" | "needs_info"
) {
  const { userId } = await requireAdmin();
  const admin = supabaseAdmin();
  await admin.from("partner_applications").update({ status }).eq("id", id);
  await admin.from("audit_logs").insert({
    actor_id: userId,
    action: `application.${status}`,
    entity_type: "partner_application",
    entity_id: id,
  });
  revalidatePath("/admin/applications");
}
