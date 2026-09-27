import Link from "next/link";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceTag } from "@/components/price/price-tag";
import { buttonVariants } from "@/components/ui/button";

// Placeholder board until Phase 4 wires live prices from Supabase Realtime.
const demoBoard = [
  { club: "Kitty Su", area: "Andheri East", stag: 250000, couple: 350000 },
  { club: "AntiSocial", area: "Khar West", stag: 150000, couple: 250000 },
  { club: "Matahari", area: "Worli", stag: 200000, couple: 300000 },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4">
        <section className="py-12 sm:py-16">
          <p className="text-sm text-moon-dim">Tonight in Mumbai</p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            The night, priced live.
          </h1>
          <p className="mt-3 max-w-xl text-moon-dim">
            Clubs set their own prices in real time. What you see is what you
            pay — entry, tables and event tickets, locked the moment you check
            out.
          </p>

          <Card className="mt-8">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <h2 className="font-display font-semibold">Live price board</h2>
                <Badge variant="sodium">
                  <span
                    aria-hidden
                    className="inline-block h-1.5 w-1.5 rounded-full bg-sodium"
                  />
                  live
                </Badge>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-moon-dim">
                    <th className="px-5 py-2 font-normal">Club</th>
                    <th className="px-5 py-2 font-normal">Stag</th>
                    <th className="px-5 py-2 font-normal">Couple</th>
                  </tr>
                </thead>
                <tbody>
                  {demoBoard.map((row) => (
                    <tr key={row.club} className="border-t border-line">
                      <td className="px-5 py-3">
                        <span className="font-display font-semibold">
                          {row.club}
                        </span>
                        <span className="ml-2 text-xs text-moon-dim">
                          {row.area}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <PriceTag paise={row.stag} size="sm" />
                      </td>
                      <td className="px-5 py-3">
                        <PriceTag paise={row.couple} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>

        <section className="border-t border-line py-12">
          <h2 className="font-display text-2xl font-semibold">How it works</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            <li>
              <h3 className="font-medium">1. Watch the board</h3>
              <p className="mt-1 text-sm text-moon-dim">
                Prices are set by the clubs and update the second they change.
              </p>
            </li>
            <li>
              <h3 className="font-medium">2. Lock your price</h3>
              <p className="mt-1 text-sm text-moon-dim">
                Start checkout and your price is held for 10 minutes, whatever
                the board does.
              </p>
            </li>
            <li>
              <h3 className="font-medium">3. Walk in with a QR</h3>
              <p className="mt-1 text-sm text-moon-dim">
                Your ticket is a QR code scanned at the door. No printouts.
              </p>
            </li>
          </ol>
        </section>

        <section className="rounded-lg border border-line bg-aubergine/60 px-6 py-10 text-center">
          <h2 className="font-display text-2xl font-semibold">Run a club?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-moon-dim">
            Set your own prices, publish events, manage tables and check guests
            in — with payouts straight to your account.
          </p>
          <Link
            href="/for-clubs"
            className={buttonVariants({ variant: "primary", size: "lg" }) + " mt-6"}
          >
            Partner with ThirtyML
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
