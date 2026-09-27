import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSupport } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/shell";
import { Badge } from "@/components/ui/badge";
import { formatPaise } from "@/lib/utils";
import { issueRefund, resendTicket } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Order detail" };
export const dynamic = "force-dynamic";

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireSupport();
  const { id } = await params;
  const admin = supabaseAdmin();

  const { data: order } = await admin
    .from("orders")
    .select(
      "id, status, subtotal, discount, convenience_fee, tax, wallet_used, total, created_at, lead_guest_name, lead_guest_email, lead_guest_phone, order_items(product_name, quantity, unit_price, night_date, clubs(name)), bookings(id, booking_code, status, night_date, clubs(name)), payments(razorpay_order_id, razorpay_payment_id, status, method), refunds(id, amount, status, reason, method, created_at)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const paidPayment = order.payments?.find((p) => p.status === "captured");
  const refunded = (order.refunds ?? []).reduce(
    (s, r) => s + (r.status !== "failed" ? r.amount : 0),
    0
  );
  const refundable = Math.max(0, order.total - refunded);

  return (
    <AdminShell profile={profile} section="/orders">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="rounded-md border border-line bg-night-raised p-5">
            <h2 className="font-display text-lg font-semibold">
              Order {order.id.slice(0, 8)}{" "}
              <Badge>{order.status}</Badge>
            </h2>
            <p className="mt-1 text-sm text-moon-dim">
              {order.lead_guest_name} · {order.lead_guest_phone} ·{" "}
              {order.lead_guest_email}
            </p>
            <p className="mt-1 text-xs text-moon-dim">
              {new Date(order.created_at).toLocaleString("en-IN")}
            </p>
          </div>

          <section className="mt-6">
            <h3 className="mb-2 font-display font-semibold">Line items</h3>
            <table className="w-full text-sm">
              <tbody>
                {(order.order_items ?? []).map((item, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="py-2">{item.product_name}</td>
                    <td className="py-2 text-moon-dim">{item.clubs?.name}</td>
                    <td className="py-2 text-moon-dim">{item.night_date}</td>
                    <td className="tnum py-2 text-right">
                      {item.quantity} × {formatPaise(item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mt-6">
            <h3 className="mb-2 font-display font-semibold">Bookings</h3>
            <ul className="space-y-2 text-sm">
              {(order.bookings ?? []).map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded-md border border-line px-3 py-2"
                >
                  <span>
                    {b.clubs?.name} · {b.night_date} ·{" "}
                    <span className="font-mono">{b.booking_code}</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        b.status === "checked_in"
                          ? "drop"
                          : b.status === "cancelled"
                            ? "danger"
                            : "default"
                      }
                    >
                      {b.status}
                    </Badge>
                    <form action={resendTicket.bind(null, b.id)}>
                      <button className="text-xs text-dusk hover:underline">
                        Resend ticket
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {order.payments?.length ? (
            <section className="mt-6">
              <h3 className="mb-2 font-display font-semibold">Payments</h3>
              <ul className="space-y-1 text-sm">
                {order.payments.map((p, i) => (
                  <li key={i} className="rounded-md border border-line px-3 py-2 font-mono text-xs">
                    {p.razorpay_order_id} · {p.razorpay_payment_id ?? "—"} · {p.status} · {p.method ?? "—"}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {(order.refunds ?? []).length > 0 && (
            <section className="mt-6">
              <h3 className="mb-2 font-display font-semibold">Refunds</h3>
              <ul className="space-y-1 text-sm">
                {order.refunds!.map((r) => (
                  <li key={r.id} className="rounded-md border border-line px-3 py-2">
                    <span className="tnum">{formatPaise(r.amount)}</span> ·{" "}
                    {r.method} ·{" "}
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
                    </Badge>{" "}
                    · <span className="text-xs text-moon-dim">{r.reason}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-md border border-line bg-night-raised p-5">
            <h3 className="font-display font-semibold">Totals</h3>
            <dl className="tnum mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatPaise(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Discount</dt>
                <dd>−{formatPaise(order.discount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Fee</dt>
                <dd>{formatPaise(order.convenience_fee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>GST</dt>
                <dd>{formatPaise(order.tax)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Wallet</dt>
                <dd>−{formatPaise(order.wallet_used)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-1 font-semibold">
                <dt>Total</dt>
                <dd>{formatPaise(order.total)}</dd>
              </div>
              <div className="flex justify-between text-moon-dim">
                <dt>Refunded so far</dt>
                <dd>{formatPaise(refunded)}</dd>
              </div>
            </dl>
          </div>

          {paidPayment && refundable > 0 && (
            <form
              action={issueRefund.bind(null, order.id)}
              className="rounded-md border border-danger/40 bg-night-raised p-5"
            >
              <h3 className="font-display font-semibold">Issue refund</h3>
              <p className="mt-1 text-xs text-moon-dim">
                Up to {formatPaise(refundable)} available.
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <Input
                  name="amount"
                  type="number"
                  placeholder="Amount in ₹"
                  required
                  min={1}
                  max={refundable / 100}
                />
                <Input name="reason" placeholder="Reason (audit-logged)" required />
                <div className="flex items-center gap-2 text-xs">
                  <label className="flex items-center gap-1">
                    <input type="radio" name="method" value="original" defaultChecked />
                    Original
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" name="method" value="wallet" />
                    Wallet
                  </label>
                </div>
                <Button size="sm" variant="danger" type="submit" className="w-full">
                  Refund
                </Button>
              </div>
            </form>
          )}
        </aside>
      </div>
    </AdminShell>
  );
}
