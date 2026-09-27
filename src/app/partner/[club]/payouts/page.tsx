import type { Metadata } from "next";
import { requirePartnerClub } from "@/lib/partner/current";
import { supabaseAdmin } from "@/lib/supabase/server";
import { PartnerShell } from "@/components/partner/shell";
import { Badge } from "@/components/ui/badge";
import { formatPaise } from "@/lib/utils";

export const metadata: Metadata = { title: "Payouts" };
export const dynamic = "force-dynamic";

export default async function PayoutsPage({
  params,
}: {
  params: Promise<{ club: string }>;
}) {
  const { club } = await params;
  const ctx = await requirePartnerClub(club, ["owner", "finance"]);
  const admin = supabaseAdmin();

  const [{ data: payoutRows }, { data: account }] = await Promise.all([
    admin
      .from("payouts")
      .select("*")
      .eq("club_id", ctx.club.id)
      .order("night_date", { ascending: false })
      .limit(60),
    admin
      .from("payout_accounts")
      .select("razorpay_linked_account_id, status, bank_last4, pan_last4, gstin")
      .eq("club_id", ctx.club.id)
      .maybeSingle(),
  ]);

  const rows = payoutRows ?? [];
  const upcoming = rows.filter((r) => r.status === "pending" || r.status === "held");
  const done = rows.filter((r) => r.status === "processed");

  return (
    <PartnerShell ctx={ctx} section="/payouts">
      <div className="mb-6 rounded-md border border-line bg-night-raised p-5">
        <h2 className="font-display font-semibold">Payout account</h2>
        {account ? (
          <div className="mt-3 text-sm">
            <p>
              Status:{" "}
              <Badge
                variant={
                  account.status === "active"
                    ? "drop"
                    : account.status === "needs_info"
                      ? "rise"
                      : "default"
                }
              >
                {account.status}
              </Badge>
            </p>
            <p className="mt-2 text-moon-dim">
              Bank ****{account.bank_last4 ?? "----"} · PAN ****
              {account.pan_last4 ?? "----"}
              {account.gstin && ` · GST ${account.gstin}`}
            </p>
            <p className="mt-2 text-xs text-moon-dim">
              Linked account ID: {account.razorpay_linked_account_id ?? "—"}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-moon-dim">
            No payout account linked yet. During onboarding, ThirtyML sets up a
            Razorpay Route linked account with your bank, PAN and (if
            registered) GST details. You never share these directly with us —
            they go to Razorpay.
          </p>
        )}
      </div>

      <Section title="Upcoming payouts" rows={upcoming} />
      <Section title="Completed" rows={done} />
    </PartnerShell>
  );
}

function Section({
  title,
  rows,
}: {
  title: string;
  rows: {
    id: string;
    night_date: string;
    gross: number;
    commission: number;
    refunds_deducted: number;
    net: number;
    status: string;
    scheduled_for: string | null;
    processed_at: string | null;
  }[];
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 font-display font-semibold">{title}</h2>
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-moon-dim">
              <th className="px-4 py-2 font-normal">Night</th>
              <th className="px-4 py-2 font-normal">Gross</th>
              <th className="px-4 py-2 font-normal">Commission</th>
              <th className="px-4 py-2 font-normal">Refunds</th>
              <th className="px-4 py-2 font-normal">Net</th>
              <th className="px-4 py-2 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  {new Date(`${r.night_date}T12:00:00`).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="tnum px-4 py-3">{formatPaise(r.gross)}</td>
                <td className="tnum px-4 py-3 text-moon-dim">
                  −{formatPaise(r.commission)}
                </td>
                <td className="tnum px-4 py-3 text-moon-dim">
                  −{formatPaise(r.refunds_deducted)}
                </td>
                <td className="tnum px-4 py-3 font-medium">
                  {formatPaise(r.net)}
                </td>
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
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-moon-dim">
                  Nothing here yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
