"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser, supabaseConfigured } from "@/lib/supabase/client";
import {
  emailSchema,
  otpSchema,
  passwordSchema,
  phoneSchema,
} from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "login" | "signup";
type Method = "phone" | "email" | "magic";

export function AuthForm({
  mode,
  partner = false,
}: {
  mode: Mode;
  partner?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? (partner ? "/partner" : "/");

  const [method, setMethod] = React.useState<Method>(
    partner ? "email" : "phone"
  );
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  if (!supabaseConfigured()) {
    return (
      <p className="rounded-md border border-line bg-night-raised p-4 text-sm text-moon-dim">
        Sign-in isn&apos;t configured in this environment yet (Supabase keys
        missing). Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable it.
      </p>
    );
  }

  const supabase = supabaseBrowser();

  async function run(fn: () => Promise<string | null>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const failure = await fn();
      if (failure) setError(failure);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function sendOtp() {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) return parsed.error.issues[0].message;
    const { error } = await supabase.auth.signInWithOtp({
      phone: parsed.data,
    });
    if (error) return error.message;
    setOtpSent(true);
    setNotice("Code sent. It can take up to a minute to arrive.");
    return null;
  }

  async function verifyOtp() {
    const parsedPhone = phoneSchema.safeParse(phone);
    const parsedOtp = otpSchema.safeParse(otp);
    if (!parsedPhone.success) return parsedPhone.error.issues[0].message;
    if (!parsedOtp.success) return parsedOtp.error.issues[0].message;
    const { error } = await supabase.auth.verifyOtp({
      phone: parsedPhone.data,
      token: parsedOtp.data,
      type: "sms",
    });
    if (error) return error.message;
    router.push(next);
    router.refresh();
    return null;
  }

  async function emailPassword() {
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) return parsedEmail.error.issues[0].message;
    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedPassword.success) return parsedPassword.error.issues[0].message;

    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp({
            email: parsedEmail.data,
            password: parsedPassword.data,
            options: { emailRedirectTo: `${location.origin}/auth/callback` },
          })
        : await supabase.auth.signInWithPassword({
            email: parsedEmail.data,
            password: parsedPassword.data,
          });
    if (error) return error.message;
    if (mode === "signup") {
      setNotice("Check your inbox to confirm your email.");
      return null;
    }
    router.push(next);
    router.refresh();
    return null;
  }

  async function magicLink() {
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) return parsedEmail.error.issues[0].message;
    const { error } = await supabase.auth.signInWithOtp({
      email: parsedEmail.data,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) return error.message;
    setNotice("Magic link sent — check your inbox.");
    return null;
  }

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) return error.message;
    return null;
  }

  return (
    <div className="w-full max-w-sm">
      <div
        className="mb-5 grid grid-cols-3 rounded-md border border-line p-1 text-sm"
        role="tablist"
        aria-label="Sign-in method"
      >
        {(
          [
            ["phone", "Phone"],
            ["email", "Email"],
            ["magic", "Magic link"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={method === value}
            className={
              "rounded-sm py-1.5 " +
              (method === value
                ? "bg-night-raised text-moon"
                : "text-moon-dim hover:text-moon")
            }
            onClick={() => {
              setMethod(value);
              setError(null);
              setNotice(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (method === "phone") run(otpSent ? verifyOtp : sendOtp);
          else if (method === "email") run(emailPassword);
          else run(magicLink);
        }}
      >
        {method === "phone" && (
          <>
            <label className="block text-sm">
              <span className="mb-1 block text-moon-dim">Mobile number</span>
              <Input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={otpSent}
              />
            </label>
            {otpSent && (
              <label className="block text-sm">
                <span className="mb-1 block text-moon-dim">6-digit code</span>
                <Input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </label>
            )}
          </>
        )}

        {(method === "email" || method === "magic") && (
          <label className="block text-sm">
            <span className="mb-1 block text-moon-dim">Email</span>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        )}

        {method === "email" && (
          <label className="block text-sm">
            <span className="mb-1 block text-moon-dim">Password</span>
            <Input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        {notice && <p className="text-sm text-drop">{notice}</p>}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy
            ? "Please wait…"
            : method === "phone"
              ? otpSent
                ? "Verify code"
                : "Send code"
              : method === "magic"
                ? "Send magic link"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-moon-dim">
        <span className="h-px flex-1 bg-line" /> or{" "}
        <span className="h-px flex-1 bg-line" />
      </div>

      <Button
        variant="secondary"
        className="w-full"
        disabled={busy}
        onClick={() => run(google)}
      >
        Continue with Google
      </Button>

      <p className="mt-5 text-center text-sm text-moon-dim">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link className="text-dusk hover:underline" href="/signup">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link className="text-dusk hover:underline" href="/login">
              Sign in
            </Link>
          </>
        )}
        {method === "email" && mode === "login" && (
          <>
            {" · "}
            <Link className="text-dusk hover:underline" href="/reset-password">
              Forgot password?
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
