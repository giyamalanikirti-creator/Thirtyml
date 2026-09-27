import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-2 font-display text-xl font-semibold">
        Create your account
      </h1>
      <p className="mb-6 max-w-sm text-center text-sm text-moon-dim">
        By continuing you agree to our{" "}
        <Link href="/legal/terms" className="text-dusk hover:underline">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="text-dusk hover:underline">
          privacy policy
        </Link>
        .
      </p>
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </>
  );
}
