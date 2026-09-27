import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "For clubs",
  description:
    "List your club on ThirtyML: control your prices live, publish events, manage tables and get paid out automatically.",
};

const benefits = [
  {
    title: "Your prices, live",
    body: "Change entry prices any time from your phone. Customers see the new price within a second — and demand follows.",
  },
  {
    title: "Tables that sell themselves",
    body: "Put your floor plan online. Guests pick their own table, pay the minimum spend or a deposit, and show up.",
  },
  {
    title: "Events with phased tickets",
    body: "Early bird, Phase 1, Phase 2, VIP — tiers switch automatically when they sell out or the clock runs out.",
  },
  {
    title: "Door that moves fast",
    body: "Scan QR tickets with any phone. Partial check-ins, live counters, and a screen built for a dark club.",
  },
  {
    title: "Money without chasing",
    body: "Payouts land in your account automatically after each night, with statements that make your accountant happy.",
  },
  {
    title: "Your own promo codes",
    body: "Run your own offers, funded by you, on your terms — and see exactly what they cost and earn.",
  },
];

export default function ForClubsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <p className="text-sm font-medium text-dusk">For clubs</p>
        <h1 className="mt-1 max-w-2xl font-display text-4xl font-bold tracking-tight">
          Fill the room at the right price — every night.
        </h1>
        <p className="mt-3 max-w-xl text-moon-dim">
          ThirtyML is the only nightlife marketplace where you control prices
          in real time. No fixed rate cards, no phone calls, no guest-list
          spreadsheets.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/partner/apply" className={buttonVariants({ size: "lg" })}>
            Apply to list your club
          </Link>
          <Link
            href="/partner/login"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Partner login
          </Link>
        </div>

        <section className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-md border border-line bg-night-raised p-5"
            >
              <h2 className="font-display font-semibold">{b.title}</h2>
              <p className="mt-2 text-sm text-moon-dim">{b.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-14 rounded-lg border border-line bg-aubergine/60 p-6">
          <h2 className="font-display text-xl font-semibold">
            How the money works
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-moon-dim">
            Customers pay online when they book. We take a commission on the
            ticket value (agreed with you when you join — the customer-facing
            convenience fee is ours, not yours) and transfer the rest to your
            bank account automatically after the night, through Razorpay&apos;s
            regulated split-settlement rails. You see every booking, deduction
            and payout in your dashboard.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">FAQ</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="font-medium">What does it cost to list?</dt>
              <dd className="mt-1 text-moon-dim">
                Nothing upfront. We only earn when you sell.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Who controls prices?</dt>
              <dd className="mt-1 text-moon-dim">
                You do — always. Change them any time; customers always see
                the price that&apos;s valid right now.
              </dd>
            </div>
            <div>
              <dt className="font-medium">What do we need to go live?</dt>
              <dd className="mt-1 text-moon-dim">
                A signed partner agreement, your KYC for payouts (PAN, bank
                account, GSTIN if registered) and your product list. Most
                clubs are live within a week.
              </dd>
            </div>
          </dl>
        </section>
      </main>
      <Footer />
    </>
  );
}
