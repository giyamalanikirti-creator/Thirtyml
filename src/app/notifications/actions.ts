"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export async function markAllRead() {
  await requireUser();
  const supabase = await supabaseServer();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null)
    .eq("channel", "in_app");
  revalidatePath("/notifications");
}

const prefsSchema = z.record(
  z.string(),
  z.record(z.string(), z.boolean())
);

export async function savePreferences(input: unknown) {
  const session = await requireUser();
  const parsed = prefsSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Bad preferences" };
  const supabase = await supabaseServer();
  const { error } = await supabase.from("notification_preferences").upsert({
    user_id: session.userId,
    prefs: parsed.data,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/notifications");
  return { ok: true as const };
}
