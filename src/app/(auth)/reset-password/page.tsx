"use client";

import * as React from "react";
import { supabaseBrowser, supabaseConfigured } from "@/lib/supabase/client";
import { emailSchema, passwordSchema } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [stage, setStage] = React.useState<"request" | "update">("request");
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!supabaseConfigured()) return;
    // Arriving from the reset email puts a recovery session in the URL hash.
    const supabase = supabaseBrowser();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStage("update");
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const supabase = supabaseBrowser();
    try {
      if (stage === "request") {
        const parsed = emailSchema.safeParse(email);
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const { error } = await supabase.auth.resetPasswordForEmail(
          parsed.data,
          { redirectTo: `${location.origin}/reset-password` }
        );
        if (error) throw error;
        setMessage("Reset link sent — check your inbox.");
      } else {
        const parsed = passwordSchema.safeParse(password);
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const { error } = await supabase.auth.updateUser({
          password: parsed.data,
        });
        if (error) throw error;
        setMessage("Password updated. You can sign in with it now.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!supabaseConfigured()) {
    return (
      <p className="text-sm text-moon-dim">
        Password reset needs Supabase keys configured.
      </p>
    );
  }

  return (
    <>
      <h1 className="mb-6 font-display text-xl font-semibold">
        {stage === "request" ? "Reset your password" : "Choose a new password"}
      </h1>
      <form className="w-full max-w-sm space-y-3" onSubmit={submit}>
        {stage === "request" ? (
          <label className="block text-sm">
            <span className="mb-1 block text-moon-dim">Email</span>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        ) : (
          <label className="block text-sm">
            <span className="mb-1 block text-moon-dim">New password</span>
            <Input
              type="password"
              autoComplete="new-password"
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
        {message && <p className="text-sm text-drop">{message}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {stage === "request" ? "Send reset link" : "Update password"}
        </Button>
      </form>
    </>
  );
}
