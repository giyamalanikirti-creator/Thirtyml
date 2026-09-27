import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { Badge } from "@/components/ui/badge";
import { formatPaise } from "@/lib/utils";

export const metadata: Metadata = { title: "Wallet" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

function nowMs(): number {
  return Date.now();
}

const TYPE_LABELS: Record<string, string> = {
  refund_credit: "Refund credit",
  referral_reward: "Referral reward",
  goodwill: "Goodwill credit",
  order_payment: "Used on a booking",
  expiry: "Expired",
  admin_adjustment: "Adjustment",
};

export default async function WalletPage() {
  await requireUser();
  const supabase = await supabaseServer();
  const { data: ledger } = await supabase
    .from("wallet_ledger")
    .select("id, amount, type, note, expires_at, created_at")
    .order("created_at", { ascending: false });

  const rows = ledger ?? [];
  const now = nowMs();
  const balance = rows.reduce(
    (sum, r) =>
      r.amount < 0 || !r.expires_at || new Date(r.expires_at).getTime() > now
        ? sum + r.amount
        : sum,
    0
  );
  const expiringSoon = rows.filter(
    (r) =>
      r.amount > 0 &&
      r.expires_at &&
      new Date(r.expires_at).getTime() > now &&
      new Date(r.expires_at).getTime() < now + 30 * 86400000
  );

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="font-display text-2xl font-semibold">Wallet</h1>

        <div className="mt-6 rounded-md border border-line bg-night-raised p-6">
          <p className="text-sm text-moon-dim">Available balance</p>
          <p className="tnum mt-1 font-display text-3xl font-bold text-sodium">
            {formatPaise(balance)}
          </p>
          <p className="mt-2 text-xs text-moon-dim">
            Applies at checkout. Credits can expire — see the dates below.
          </p>
        </div>

        {expiringSoon.length > 0 && (
          <p className="mt-4 rounded-md border border-rise/40 bg-rise/10 p-3 text-sm text-rise">
            {formatPaise(expiringSoon.reduce((s, r) => s + r.amount, 0))} expires
            in the next 30 days.
          </p>
        )}

        <h2 className="mt-8 font-display text-lg font-semibold">History</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-moon-dim">
            No wallet activity yet. Refunds, referral rewards and goodwill
            credits appear here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-md border border-line">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm">{TYPE_LABELS[r.type] ?? r.type}</p>
                  {r.note && (
                    <p className="text-xs text-moon-dim">{r.note}</p>
                  )}
                  <p className="text-xs text-moon-dim">
                    {dateFmt.format(new Date(r.created_at))}
                    {r.expires_at && r.amount > 0 && (
                      <> · expires {dateFmt.format(new Date(r.expires_at))}</>
                    )}
                  </p>
                </div>
                <Badge variant={r.amount > 0 ? "drop" : "default"} className="tnum">
                  {r.amount > 0 ? "+" : "−"}
                  {formatPaise(Math.abs(r.amount))}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
