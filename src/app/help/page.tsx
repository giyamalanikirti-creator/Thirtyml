import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/shell/static-page";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Help centre" };
export const revalidate = 300;

const fallbackFaqs = [
  {
    q: "Where's my ticket?",
    a: "Open My bookings — every confirmed booking has a QR ticket. It was also emailed to you.",
  },
  {
    q: "The price changed after I added it to my cart",
    a: "Clubs price in real time. Your cart shows the current price and asks you to confirm any change. Once you start checkout, your price is locked for 10 minutes.",
  },
  {
    q: "Can I cancel?",
    a: "Depends on the club's policy for that product — it's shown on your ticket page, and the exact refund amount is shown before you confirm.",
  },
  {
    q: "The scanner at the door rejected my QR",
    a: "Check you're at the right club on the right night. If it still fails, show the 8-character booking code on your ticket — staff can enter it manually.",
  },
];

export default async function HelpPage() {
  let faqs = fallbackFaqs;
  if (isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    const { data } = await supabase
      .from("help_articles")
      .select("title, body")
      .eq("is_published", true)
      .order("sort_order");
    if (data && data.length > 0) {
      faqs = data.map((a) => ({ q: a.title, a: a.body }));
    }
  }

  return (
    <StaticPage title="Help centre">
      <dl className="space-y-5">
        {faqs.map((f) => (
          <div key={f.q}>
            <dt className="font-medium text-moon">{f.q}</dt>
            <dd className="mt-1">{f.a}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-8">
        Still stuck?{" "}
        <Link href="/support" className="text-dusk hover:underline">
          Open a support ticket
        </Link>{" "}
        or email support@thirtyml.in.
      </p>
    </StaticPage>
  );
}
