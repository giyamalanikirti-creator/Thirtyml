import type { Metadata } from "next";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { Badge } from "@/components/ui/badge";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatPaise } from "@/lib/utils";

export const metadata: Metadata = { title: "Offers" };
export const revalidate = 300;

const demoOffers = [
  {
    code: "FIRSTNIGHT",
    description: "20% off your first night, up to ₹300",
    terms: "New customers only. One use.",
  },
  {
    code: "AGRA100",
    description: "Flat ₹100 off in Agra",
    terms: "Valid on bookings in Agra. Up to 3 uses per customer.",
  },
];

export default async function OffersPage() {
  let offers = demoOffers;
  if (isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    const { data } = await supabase
      .from("coupons")
      .select("code, description, discount_type, discount_value, max_discount, min_cart_value")
      .eq("is_active", true)
      .order("created_at");
    if (data && data.length > 0) {
      offers = data.map((c) => ({
        code: c.code,
        description:
          c.description ??
          (c.discount_type === "flat"
            ? `Flat ${formatPaise(c.discount_value)} off`
            : `${c.discount_value / 100}% off${c.max_discount ? ` up to ${formatPaise(c.max_discount)}` : ""}`),
        terms:
          c.min_cart_value > 0
            ? `On orders over ${formatPaise(c.min_cart_value)}.`
            : "See checkout for full terms.",
      }));
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="font-display text-2xl font-semibold">Offers</h1>
        <p className="mt-2 text-sm text-moon-dim">
          Apply a code at checkout — the discount shows in your price breakdown
          before you pay.
        </p>
        <ul className="mt-6 space-y-4">
          {offers.map((o) => (
            <li
              key={o.code}
              className="rounded-md border border-line bg-night-raised p-5"
            >
              <div className="flex items-center gap-3">
                <Badge variant="sodium" className="font-mono text-sm">
                  {o.code}
                </Badge>
                <span className="font-medium">{o.description}</span>
              </div>
              <p className="mt-2 text-xs text-moon-dim">{o.terms}</p>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}
