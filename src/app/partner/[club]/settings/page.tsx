import type { Metadata } from "next";
import { requirePartnerClub } from "@/lib/partner/current";
import { PartnerShell } from "@/components/partner/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function ClubSettingsPage({
  params,
}: {
  params: Promise<{ club: string }>;
}) {
  const { club } = await params;
  const ctx = await requirePartnerClub(club, ["owner", "manager"]);

  return (
    <PartnerShell ctx={ctx} section="/settings">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cancellation policy</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-moon-dim">
            <p>
              Set per-product-type cancellation rules on your Profile page —
              the JSON schema is documented there. The default is full refund
              until 6 hours before the night.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Booking cutoff &amp; guest names</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-moon-dim">
            <p>
              Change these on Profile — the cutoff controls how close to the
              night guests can still buy, and the guest-names flag decides
              whether couple/table bookings require names.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notification preferences</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-moon-dim">
            <p>
              You&apos;ll receive new-booking pings, daily summaries and
              payout notifications by default. Fine-grained club preferences
              land in Phase 10.
            </p>
          </CardContent>
        </Card>
      </div>
    </PartnerShell>
  );
}
