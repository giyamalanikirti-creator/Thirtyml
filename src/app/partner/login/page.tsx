import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Partner login" };

export default function PartnerLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-aubergine/40 px-4 py-12">
      <Link
        href="/"
        className="mb-2 font-display text-2xl font-bold tracking-tight"
      >
        Thirty<span className="text-sodium">ML</span>
      </Link>
      <p className="mb-8 text-sm font-medium tracking-wide text-dusk">
        Partner dashboard
      </p>
      <h1 className="mb-6 font-display text-xl font-semibold">
        Sign in to your club
      </h1>
      <Suspense>
        <AuthForm mode="login" partner />
      </Suspense>
      <p className="mt-6 text-sm text-moon-dim">
        Not on ThirtyML yet?{" "}
        <Link href="/partner/apply" className="text-dusk hover:underline">
          Apply to list your club
        </Link>
      </p>
    </main>
  );
}
