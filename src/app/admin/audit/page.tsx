import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/shell";

export const metadata: Metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const { profile } = await requireAdmin();
  const admin = supabaseAdmin();
  const { data: rows } = await admin
    .from("audit_logs")
    .select("id, actor_id, action, entity_type, entity_id, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const actorIds = Array.from(
    new Set((rows ?? []).map((r) => r.actor_id).filter((id): id is string => Boolean(id)))
  );
  const { data: profiles } = actorIds.length
    ? await admin.from("profiles").select("id, full_name, email").in("id", actorIds)
    : { data: [] as never[] };
  const actorMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <AdminShell profile={profile} section="/audit">
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-moon-dim">
              <th className="px-4 py-2 font-normal">Time</th>
              <th className="px-4 py-2 font-normal">Actor</th>
              <th className="px-4 py-2 font-normal">Action</th>
              <th className="px-4 py-2 font-normal">Target</th>
              <th className="px-4 py-2 font-normal">Reason</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-xs text-moon-dim">
                  {new Date(r.created_at).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3">
                  {(() => { const a = r.actor_id ? actorMap.get(r.actor_id) : null; return a?.full_name ?? a?.email ?? "—"; })()}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{r.action}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {r.entity_type} {r.entity_id?.slice(0, 8) ?? ""}
                </td>
                <td className="px-4 py-3 text-xs text-moon-dim">
                  {r.reason ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
