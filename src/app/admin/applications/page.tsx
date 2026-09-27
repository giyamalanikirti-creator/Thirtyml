import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { markApplication } from "./actions";

export const metadata: Metadata = { title: "Applications" };
export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const { profile } = await requireAdmin();
  const admin = supabaseAdmin();
  const { data: apps } = await admin
    .from("partner_applications")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <AdminShell profile={profile} section="/applications">
      <ul className="space-y-3">
        {(apps ?? []).map((a) => (
          <li key={a.id} className="rounded-md border border-line bg-night-raised p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display font-semibold">
                  {a.club_name}{" "}
                  <Badge>{a.status.replace("_", " ")}</Badge>
                </p>
                <p className="text-sm text-moon-dim">
                  {a.city} · {a.contact_name} · {a.contact_phone} · {a.contact_email}
                </p>
                {a.message && (
                  <p className="mt-2 text-sm text-moon-dim">{a.message}</p>
                )}
                <p className="mt-1 text-xs text-moon-dim">
                  {new Date(a.created_at).toLocaleString("en-IN")}
                </p>
              </div>
              {a.status === "pending" && (
                <div className="flex gap-2">
                  <form action={markApplication.bind(null, a.id, "approved")}>
                    <Button size="sm" type="submit">Approve</Button>
                  </form>
                  <form action={markApplication.bind(null, a.id, "rejected")}>
                    <Button size="sm" variant="ghost" type="submit">Reject</Button>
                  </form>
                </div>
              )}
            </div>
          </li>
        ))}
        {(apps ?? []).length === 0 && (
          <li className="rounded-md border border-line bg-night-raised p-6 text-center text-sm text-moon-dim">
            No partner applications yet.
          </li>
        )}
      </ul>
    </AdminShell>
  );
}
