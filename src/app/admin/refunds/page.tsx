import type { Metadata } from "next";
import { requireSupport } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/shell";
import { Badge } from "@/components/ui/badge";
import { formatPaise } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = { title: "Refunds" };
export const dynamic = "force-dynamic";

export default async function AdminRefundsPage() {
  const { profile } = await requireSupport();
  const admin = supabaseAdmin();
  const { data: refunds } = await admin
    .from("refunds")
    .select("id, order_id, amount, method, status, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AdminShell profile={profile} section="/refunds">
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-moon-dim">
              <th className="px-4 py-2 font-normal">Order</th>
              <th className="px-4 py-2 font-normal">Amount</th>
              <th className="px-4 py-2 font-normal">Method</th>
              <th className="px-4 py-2 font-normal">Status</th>
              <th className="px-4 py-2 font-normal">Reason</th>
              <th className="px-4 py-2 font-normal">When</th>
            </tr>
          </thead>
          <tbody>
            {(refunds ?? []).map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link href={`/admin/orders/${r.order_id}`} className="hover:text-sodium">
                    {r.order_id.slice(0, 8)}
                  </Link>
                </td>
                <td className="tnum px-4 py-3">{formatPaise(r.amount)}</td>
                <td className="px-4 py-3">{r.method}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      r.status === "processed"
                        ? "drop"
                        : r.status === "failed"
                          ? "danger"
                          : "default"
                    }
                  >
                    {r.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-moon-dim">{r.reason}</td>
                <td className="px-4 py-3 text-xs text-moon-dim">
                  {new Date(r.created_at).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
