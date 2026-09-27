import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { formatPaise } from "@/lib/utils";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Invoice" };
export const dynamic = "force-dynamic";

/**
 * Print-friendly tax invoice (browser print → PDF). A generated-PDF email
 * attachment is tracked as a Phase 9 polish item.
 */
export default async function InvoicePage({
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
      `id, created_at, lead_guest_name, lead_guest_email,
       subtotal, discount, convenience_fee, tax, wallet_used, total,
       invoices(invoice_number, seller_gstin, club_gstin, created_at),
       order_items(product_name, quantity, unit_price, night_date)`
    )
    .eq("id", id)
    .maybeSingle();
  if (!order || !order.invoices) notFound();
  const invoice = order.invoices;

  return (
    <main className="mx-auto max-w-2xl bg-white p-10 font-sans text-sm text-black print:p-0">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Thirty<span className="text-[#d98a0f]">ML</span>
          </h1>
          <p className="mt-1 text-xs text-neutral-600">
            Tax invoice · {invoice.invoice_number}
          </p>
        </div>
        <div className="text-right text-xs text-neutral-600">
          <p>
            Date:{" "}
            {new Intl.DateTimeFormat("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "Asia/Kolkata",
            }).format(new Date(invoice.created_at))}
          </p>
          {invoice.seller_gstin && <p>GSTIN: {invoice.seller_gstin}</p>}
        </div>
      </div>

      <div className="mt-6 text-xs">
        <p className="font-medium">Billed to</p>
        <p>{order.lead_guest_name}</p>
        <p>{order.lead_guest_email}</p>
      </div>

      <table className="mt-6 w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-neutral-300 text-xs text-neutral-600">
            <th className="py-2 font-normal">Item</th>
            <th className="py-2 font-normal">Night</th>
            <th className="py-2 text-right font-normal">Qty</th>
            <th className="py-2 text-right font-normal">Unit</th>
            <th className="py-2 text-right font-normal">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(order.order_items ?? []).map((item, i) => (
            <tr key={i} className="border-b border-neutral-200">
              <td className="py-2">{item.product_name}</td>
              <td className="py-2">{item.night_date}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">{formatPaise(item.unit_price)}</td>
              <td className="py-2 text-right">
                {formatPaise(item.unit_price * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto mt-4 w-64 space-y-1 text-right">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatPaise(order.subtotal)}</dd>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between">
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
          <div className="flex justify-between">
            <dt>Wallet credit</dt>
            <dd>−{formatPaise(order.wallet_used)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-neutral-300 pt-1 font-bold">
          <dt>Total</dt>
          <dd>{formatPaise(order.total)}</dd>
        </div>
      </dl>

      <p className="mt-8 text-[10px] text-neutral-500">
        Entry to the venue is provided by the club named on your booking; the
        convenience fee is charged by ThirtyML. Tax rates as configured at the
        time of sale — confirm applicability with your tax advisor.
      </p>
      <PrintButton />
    </main>
  );
}
