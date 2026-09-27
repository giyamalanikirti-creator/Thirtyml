import type { Metadata } from "next";
import { requireSupport } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/shell";
import { formatPaise } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin dashboard" };
export const dynamic = "force-dynamic";

function sinceIso(): string {
  return new Date(Date.now() - 30 * 86400000).toISOString();
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-night-raised p-4">
      <p className="text-xs uppercase tracking-widest text-moon-dim">{label}</p>
      <p className="tnum mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

export default async function AdminDashboard() {
  const { profile } = await requireSupport();
  const admin = supabaseAdmin();
  const since = sinceIso();

  const [{ data: paid }, { count: refundCount }, { data: pending }, { data: recent }] =
    await Promise.all([
      admin.from("orders").select("total").eq("status", "paid").gte("created_at", since),
      admin.from("refunds").select("id", { count: "exact", head: true }).gte("created_at", since),
      admin
        .from("webhook_events")
        .select("id")
        .is("processed_at", null),
      admin
        .from("orders")
        .select("id, total, status, created_at, lead_guest_name")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const gmv = (paid ?? []).reduce((s, o) => s + o.total, 0);

  return (
    <AdminShell profile={profile} section="">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="GMV (30d)" value={formatPaise(gmv)} />
        <Stat label="Orders (30d)" value={paid?.length ?? 0} />
        <Stat label="Refunds (30d)" value={refundCount ?? 0} />
        <Stat label="Unprocessed webhooks" value={pending?.length ?? 0} />
      </div>

      <section className="mt-6">
        <h2 className="mb-3 font-display font-semibold">Recent orders</h2>
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-moon-dim">
                <th className="px-4 py-2 font-normal">Order</th>
                <th className="px-4 py-2 font-normal">Guest</th>
                <th className="px-4 py-2 font-normal">Status</th>
                <th className="px-4 py-2 font-normal">Amount</th>
                <th className="px-4 py-2 font-normal">Created</th>
              </tr>
            </thead>
            <tbody>
              {(recent ?? []).map((o) => (
                <tr key={o.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">
                    <a href={`/admin/orders/${o.id}`} className="hover:text-sodium">
                      {o.id.slice(0, 8)}
                    </a>
                  </td>
                  <td className="px-4 py-3">{o.lead_guest_name ?? "—"}</td>
                  <td className="px-4 py-3">{o.status}</td>
                  <td className="tnum px-4 py-3">{formatPaise(o.total)}</td>
                  <td className="px-4 py-3 text-xs text-moon-dim">
                    {new Date(o.created_at).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
