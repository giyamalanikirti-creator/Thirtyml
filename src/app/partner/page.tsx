import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { listMyMemberships } from "@/lib/partner/current";
import { Header } from "@/components/shell/header";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Partner" };
export const dynamic = "force-dynamic";

/** Root of the partner dashboard: sign in, then either bounce into a club or
 *  land here to pick one / apply. */
export default async function PartnerLanding() {
  await requireUser();
  const memberships = await listMyMemberships();

  if (memberships.length === 1) {
    redirect(`/partner/${memberships[0].club?.slug}`);
  }

  if (memberships.length === 0) {
    return (
      <>
        <Header />
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16">
          <h1 className="font-display text-2xl font-semibold">
            You&apos;re signed in — now let&apos;s list your club
          </h1>
          <p className="mt-2 text-sm text-moon-dim">
            You don&apos;t belong to a club yet. Apply and our team will get
            back within 2 working days.
          </p>
          <Link
            href="/partner/apply"
            className={buttonVariants({}) + " mt-6"}
          >
            Apply to list your club
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="font-display text-2xl font-semibold">Your clubs</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {memberships.map((m) => (
            <Link
              key={m.id}
              href={`/partner/${m.club?.slug}`}
              className="rounded-md border border-line bg-night-raised p-5 hover:border-moon-dim"
            >
              <p className="font-display font-semibold">{m.club?.name}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-moon-dim">
                {m.role.replace("_", " ")}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
