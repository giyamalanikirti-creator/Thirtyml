import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/shell/header";
import { requireUser } from "@/lib/auth";
import { getCartView } from "@/lib/cart";
import { getWalletBalance, previewTotals } from "@/lib/orders";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const { userId, profile } = await requireUser();
  const view = await getCartView();
  const active = view.lines.filter((l) => !l.savedForLater);
  if (active.length === 0) redirect("/cart");
  if (view.needsAcknowledgement) redirect("/cart");

  const [{ totals }, walletBalance] = await Promise.all([
    previewTotals(view, null, false, userId),
    getWalletBalance(),
  ]);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="font-display text-2xl font-semibold">Checkout</h1>
        <p className="mt-1 text-sm text-moon-dim">
          Review, add your details, pay. Prices lock for 10 minutes the moment
          you continue to payment.
        </p>
        <div className="mt-6">
          <CheckoutClient
            view={view}
            initialTotals={totals}
            walletBalance={walletBalance}
            profile={{
              name: profile.full_name ?? "",
              phone: profile.phone ?? "",
              email: profile.email ?? "",
            }}
          />
        </div>
      </main>
    </>
  );
}
