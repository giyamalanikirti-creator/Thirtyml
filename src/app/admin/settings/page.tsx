import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/shell";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = { title: "Platform settings" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const { profile } = await requireAdmin();
  const admin = supabaseAdmin();
  const { data: rows } = await admin
    .from("platform_settings")
    .select("key, value");

  return (
    <AdminShell profile={profile} section="/settings">
      <SettingsClient
        initial={Object.fromEntries(
          (rows ?? []).map((r) => [r.key, JSON.stringify(r.value, null, 2)])
        )}
      />
    </AdminShell>
  );
}
