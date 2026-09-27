import type { Metadata } from "next";
import Link from "next/link";
import { requireSupport } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/shell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatPaise } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { profile } = await requireSupport();
  const sp = await searchParams;
  const admin = supabaseAdmin();
  let query = admin
    .from("orders")
    .select("id, status, total, created_at, lead_guest_name, lead_guest_phone, lead_guest_email")
    .order("created_at", { ascending: false })
    .limit(100);
  if (sp.q) {
    if (/^[0-9a-f-]{8,}$/i.test(sp.q)) query = query.eq("id", sp.q);
    else if (/^\+?\d[\d\s-]+$/.test(sp.q)) query = query.ilike("lead_guest_phone", `%${sp.q}%`);
    else if (sp.q.includes("@")) query = query.ilike("lead_guest_email", `%${sp.q}%`);
    else query = query.ilike("lead_guest_name", `%${sp.q}%`);
  }
  const { data: orders } = await query;

  return (
    <AdminShell profile={profile} section="/orders">
      <form action="" className="mb-4 flex gap-2">
        <Input name="q" placeholder="Search by order id, phone, email, or name" defaultValue={sp.q ?? ""} />
      </form>
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-moon-dim">
              <th className="px-4 py-2 font-normal">Order</th>
              <th className="px-4 py-2 font-normal">Guest</th>
              <th className="px-4 py-2 font-normal">Phone</th>
              <th className="px-4 py-2 font-normal">Status</th>
              <th className="px-4 py-2 font-normal">Total</th>
              <th className="px-4 py-2 font-normal">Created</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link href={`/admin/orders/${o.id}`} className="hover:text-sodium">
                    {o.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-4 py-3">{o.lead_guest_name ?? "—"}</td>
                <td className="px-4 py-3 text-moon-dim">{o.lead_guest_phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      o.status === "paid"
                        ? "drop"
                        : o.status === "refunded" || o.status === "cancelled"
                          ? "default"
                          : o.status === "failed" || o.status === "expired"
                            ? "danger"
                            : "rise"
                    }
                  >
                    {o.status}
                  </Badge>
                </td>
                <td className="tnum px-4 py-3">{formatPaise(o.total)}</td>
                <td className="px-4 py-3 text-xs text-moon-dim">
                  {new Date(o.created_at).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
