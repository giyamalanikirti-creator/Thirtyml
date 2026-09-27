import type { Metadata } from "next";
import { StaticPage } from "@/components/shell/static-page";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <StaticPage title="Contact us">
      <p>
        <strong>Booking problems on the night:</strong> use “Raise an issue”
        on your ticket — it reaches our on-call team fastest.
      </p>
      <p>
        <strong>Support:</strong> support@thirtyml.in (replies within 24
        hours). You can also open a ticket from the Help centre.
      </p>
      <p>
        <strong>Clubs and partnerships:</strong> partners@thirtyml.in, or
        apply directly from the For clubs page.
      </p>
      <p>
        <strong>Grievances (DPDP Act 2023):</strong> our grievance officer&apos;s
        contact details are on the Grievance officer page.
      </p>
    </StaticPage>
  );
}
