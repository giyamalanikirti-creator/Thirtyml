import type { Metadata } from "next";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { getCartView } from "@/lib/cart";
import { CartViewClient } from "./cart-view";

export const metadata: Metadata = { title: "Cart" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const view = await getCartView();
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="font-display text-2xl font-semibold">Your cart</h1>
        <CartViewClient view={view} />
      </main>
      <Footer />
    </>
  );
}
