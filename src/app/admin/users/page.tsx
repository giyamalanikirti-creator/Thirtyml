import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/shell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { profile } = await requireAdmin();
  const sp = await searchParams;
  const admin = supabaseAdmin();
  let query = admin
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at, deleted_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (sp.q) {
    if (sp.q.includes("@")) query = query.ilike("email", `%${sp.q}%`);
    else if (/^\+?\d/.test(sp.q)) query = query.ilike("phone", `%${sp.q}%`);
    else query = query.ilike("full_name", `%${sp.q}%`);
  }
  const { data: users } = await query;

  return (
    <AdminShell profile={profile} section="/users">
      <form action="" className="mb-4">
        <Input name="q" placeholder="Search name, email or phone" defaultValue={sp.q ?? ""} />
      </form>
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-moon-dim">
              <th className="px-4 py-2 font-normal">Name</th>
              <th className="px-4 py-2 font-normal">Email</th>
              <th className="px-4 py-2 font-normal">Phone</th>
              <th className="px-4 py-2 font-normal">Role</th>
              <th className="px-4 py-2 font-normal">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  {u.full_name ?? "—"}{" "}
                  {u.deleted_at && <Badge variant="danger">Deleted</Badge>}
                </td>
                <td className="px-4 py-3 text-moon-dim">{u.email ?? "—"}</td>
                <td className="px-4 py-3 text-moon-dim">{u.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge>{u.role}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-moon-dim">
                  {new Date(u.created_at).toLocaleDateString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
