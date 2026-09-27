import type { Metadata } from "next";
import { StaticPage } from "@/components/shell/static-page";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <StaticPage title="About ThirtyML">
      <p>
        ThirtyML is a nightlife marketplace built on one idea:{" "}
        <strong>the price of a night out should be honest and live</strong>.
        Clubs set their own prices in real time, and you always pay exactly
        what you saw when you checked out — never a surprise at the door.
      </p>
      <h2>What we do</h2>
      <p>
        We sell club entry passes, table reservations and event tickets in
        Mumbai, Pune and Agra, with more cities on the way. Every booking gets
        a QR ticket scanned at the door, and every rupee is itemised — cover,
        fees and taxes, all before you pay.
      </p>
      <h2>For clubs</h2>
      <p>
        Partners get a live pricing dashboard, floor-plan table booking, event
        ticketing with phased tiers, QR check-in and automatic payouts. If you
        run a venue, see our For clubs page.
      </p>
    </StaticPage>
  );
}
