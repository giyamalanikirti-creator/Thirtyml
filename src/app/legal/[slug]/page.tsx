import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StaticPage } from "@/components/shell/static-page";

/**
 * Baseline legal pages. In Phase 9 these become versioned CMS documents
 * editable from admin; the drafts below MUST be reviewed by a lawyer before
 * launch (tracked in LAUNCH.md).
 */
const pages: Record<string, { title: string; body: React.ReactNode }> = {
  terms: {
    title: "Terms of use",
    body: (
      <>
        <p>Draft — to be reviewed by counsel before launch.</p>
        <h2>1. The service</h2>
        <p>
          ThirtyML sells club entry passes, table reservations and event
          tickets on behalf of partner venues. The venue is the provider of
          the night itself; we are the booking platform.
        </p>
        <h2>2. Prices</h2>
        <p>
          Prices are set by venues and can change at any time. The price you
          pay is the price shown when you start checkout, held for 10 minutes.
        </p>
        <h2>3. Entry</h2>
        <p>
          Venues check age and ID at the door and reserve rights of admission.
          Minimum ages are shown on each listing and confirmed at purchase.
        </p>
        <h2>4. Conduct, liability, disputes</h2>
        <p>
          To be completed with counsel: limitation of liability, governing law
          (India), arbitration/jurisdiction, prohibited conduct.
        </p>
      </>
    ),
  },
  privacy: {
    title: "Privacy policy",
    body: (
      <>
        <p>Draft — to be reviewed by counsel before launch (DPDP Act 2023).</p>
        <h2>What we collect</h2>
        <p>
          Account details (name, phone, email, date of birth), bookings and
          payments (processed by Razorpay — we never store card or bank
          numbers), device data, and analytics only with your consent.
        </p>
        <h2>Why we collect it</h2>
        <p>
          To take bookings, verify age requirements, send tickets, prevent
          fraud, and meet tax and accounting law. We do not sell personal
          data.
        </p>
        <h2>Your rights</h2>
        <p>
          Access and export your data, correct it, or delete your account from
          Profile &amp; settings. Financial records are retained as required
          by law. Grievances: see the Grievance officer page.
        </p>
      </>
    ),
  },
  refunds: {
    title: "Refund & cancellation policy",
    body: (
      <>
        <p>Draft — to be reviewed by counsel before launch.</p>
        <h2>Cancelling a booking</h2>
        <p>
          Each venue sets its own cancellation policy per product, shown
          before you pay: non-refundable, full refund until a cut-off,
          partial refund, or reschedule only. The exact refund amount is
          always shown before you confirm a cancellation.
        </p>
        <h2>If the venue cancels</h2>
        <p>
          You get a full refund automatically — including our convenience
          fee — to your original payment method or as wallet credit, your
          choice.
        </p>
        <h2>Refund timelines</h2>
        <p>
          Refunds to the original method are initiated immediately and
          typically settle in 5–7 working days depending on your bank. Wallet
          credit is instant.
        </p>
      </>
    ),
  },
  cookies: {
    title: "Cookie policy",
    body: (
      <>
        <p>
          We use strictly necessary cookies for sign-in, your city choice and
          your cart. Analytics cookies (PostHog) are set only after you
          consent via the cookie banner, and you can withdraw consent there
          any time.
        </p>
      </>
    ),
  },
  "partner-terms": {
    title: "Partner terms",
    body: (
      <>
        <p>Draft — to be reviewed by counsel before launch.</p>
        <p>
          Commercial terms (commission, payout schedule, chargebacks, venue
          obligations on capacity and pricing honesty, cancellation duties,
          data handling) are set out in each venue&apos;s signed partner agreement.
          A club may only be listed as bookable after signing.
        </p>
      </>
    ),
  },
  grievance: {
    title: "Grievance officer",
    body: (
      <>
        <p>
          As required under Indian law (including the DPDP Act 2023 and the
          IT Rules), ThirtyML has a grievance officer:
        </p>
        <p>
          <strong>Name:</strong> To be appointed before launch
          <br />
          <strong>Email:</strong> grievance@thirtyml.in
          <br />
          <strong>Response time:</strong> acknowledgement within 48 hours,
          resolution within 30 days.
        </p>
      </>
    ),
  },
};

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = pages[slug];
  return page ? { title: page.title } : {};
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  return <StaticPage title={page.title}>{page.body}</StaticPage>;
}
