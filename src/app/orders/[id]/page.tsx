import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPaise } from "@/lib/utils";

export const metadata: Metadata = { title: "Order confirmed" };
export const dynamic = "force-dynamic";

const nightFmt = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Asia/Kolkata",
});

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const supabase = await supabaseServer();

  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, status, subtotal, discount, convenience_fee, tax, wallet_used, total,
       created_at,
       bookings(id, booking_code, night_date, guest_count, status, clubs(name, slug, cities(slug))),
       invoices(invoice_number)`
    )
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();
  if (order.status === "pending_payment") redirect(`/orders/${id}/pay`);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        {order.status === "paid" || order.status === "partially_refunded" ? (
          <>
            <p className="font-display text-3xl font-bold text-drop">
              You&apos;re in. 🎉
            </p>
            <p className="mt-1 text-sm text-moon-dim">
              Paid {formatPaise(order.total)} · Order{" "}
              <span className="tnum">{order.id.slice(0, 8)}</span>
              {order.invoices && (
                <>
                  {" · "}
                  <Link
                    href={`/orders/${order.id}/invoice`}
                    className="text-dusk hover:underline"
                  >
                    Invoice {order.invoices.invoice_number}
                  </Link>
                </>
              )}
            </p>
          </>
        ) : (
          <p className="font-display text-2xl font-bold">
            Order {order.status}
          </p>
        )}

        <section className="mt-8 space-y-4">
          {(order.bookings ?? []).map((b) => (
            <div
              key={b.id}
              className="rounded-md border border-line bg-night-raised p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold">
                    {b.clubs?.name}
                  </h2>
                  <p className="mt-0.5 text-sm text-moon-dim">
                    {nightFmt.format(new Date(`${b.night_date}T12:00:00`))} ·{" "}
                    {b.guest_count} guest{b.guest_count === 1 ? "" : "s"}
                  </p>
                  <p className="tnum mt-2 text-sm">
                    Booking code:{" "}
                    <strong className="font-mono">{b.booking_code}</strong>
                  </p>
                </div>
                <Badge variant={b.status === "confirmed" ? "drop" : "default"}>
                  {b.status}
                </Badge>
              </div>
              <Link
                href={`/bookings/${b.id}`}
                className={buttonVariants({ variant: "secondary", size: "sm" }) + " mt-4"}
              >
                Open QR ticket
              </Link>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-md border border-line p-5">
          <h2 className="text-sm font-medium text-moon-dim">Payment summary</h2>
          <dl className="tnum mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatPaise(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-drop">
                <dt>Discount</dt>
                <dd>−{formatPaise(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Convenience fee</dt>
              <dd>{formatPaise(order.convenience_fee)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>GST</dt>
              <dd>{formatPaise(order.tax)}</dd>
            </div>
            {order.wallet_used > 0 && (
              <div className="flex justify-between text-drop">
                <dt>Wallet credit</dt>
                <dd>−{formatPaise(order.wallet_used)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-1 font-semibold">
              <dt>Total paid</dt>
              <dd>{formatPaise(order.total)}</dd>
            </div>
          </dl>
        </section>

        <div className="mt-8 flex gap-3">
          <Link href="/bookings" className={buttonVariants({})}>
            My bookings
          </Link>
          <Link href="/clubs" className={buttonVariants({ variant: "ghost" })}>
            Keep exploring
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
