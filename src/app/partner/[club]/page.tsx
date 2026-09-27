import type { Metadata } from "next";
import { requirePartnerClub } from "@/lib/partner/current";
import { clubOverview } from "@/lib/partner/data";
import { todayIst } from "@/lib/data/catalog";
import { PartnerShell } from "@/components/partner/shell";
import { Card, CardContent } from "@/components/ui/card";
import { PriceTag } from "@/components/price/price-tag";
import { formatPaise } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-night-raised p-4">
      <p className="text-xs uppercase tracking-widest text-moon-dim">{label}</p>
      <p className="tnum mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

export default async function ClubOverviewPage({
  params,
}: {
  params: Promise<{ club: string }>;
}) {
  const { club } = await params;
  const ctx = await requirePartnerClub(club);
  const overview = await clubOverview(ctx.club.id, todayIst());

  return (
    <PartnerShell ctx={ctx} section="">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Bookings tonight" value={overview.bookings} />
        <Stat label="Guests expected" value={overview.guestsExpected} />
        <Stat
          label="Admitted"
          value={`${overview.guestsAdmitted} / ${overview.guestsExpected}`}
        />
        <Stat label="Revenue tonight" value={formatPaise(overview.revenue)} />
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          <div className="border-b border-line px-5 py-3">
            <h2 className="font-display font-semibold">Live entry prices</h2>
            <p className="text-xs text-moon-dim">
              Change any price in Pricing — customers see it within a second.
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-moon-dim">
                <th className="px-5 py-2 font-normal">Product</th>
                <th className="px-5 py-2 font-normal">Price</th>
                <th className="px-5 py-2 font-normal">Sold / Capacity</th>
              </tr>
            </thead>
            <tbody>
              {overview.capacity.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-5 py-3">{row.name}</td>
                  <td className="px-5 py-3">
                    <PriceTag
                      paise={row.price}
                      size="sm"
                      updatedAt={row.priceUpdatedAt}
                    />
                  </td>
                  <td className="tnum px-5 py-3">
                    {row.sold} / {row.capacity}
                  </td>
                </tr>
              ))}
              {overview.capacity.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-6 text-center text-sm text-moon-dim">
                    No entry products yet — add some in Pricing.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {overview.rating !== null && (
        <p className="mt-6 text-sm text-moon-dim">
          Guests rate you{" "}
          <span className="tnum text-moon">
            {Number(overview.rating).toFixed(1)}
          </span>{" "}
          across {overview.ratingCount} reviews.
        </p>
      )}
    </PartnerShell>
  );
}
