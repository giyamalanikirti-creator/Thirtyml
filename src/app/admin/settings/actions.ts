"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function saveSetting(
  key: string,
  value: unknown
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await requireAdmin();
  const admin = supabaseAdmin();
  const { data: existing } = await admin
    .from("platform_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  const { error } = await admin.from("platform_settings").upsert({
    key,
    value: value as never,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  await admin.from("audit_logs").insert({
    actor_id: userId,
    action: "settings.update",
    entity_type: "platform_setting",
    entity_id: key,
    before: (existing?.value as never) ?? null,
    after: value as never,
  });
  revalidatePath("/admin/settings");
  return { ok: true };
}
