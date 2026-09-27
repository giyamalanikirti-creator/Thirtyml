import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 font-display text-xl font-semibold">Sign in</h1>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </>
  );
}
