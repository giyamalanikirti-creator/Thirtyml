"use client";

import * as React from "react";
import { submitApplication } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ApplyForm() {
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (done) {
    return (
      <p className="rounded-md border border-line bg-night-raised p-4 text-sm">
        Application received. We&apos;ll be in touch within 2 working days.
      </p>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const result = await submitApplication({
      clubName: form.get("clubName"),
      city: form.get("city"),
      contactName: form.get("contactName"),
      contactPhone: form.get("contactPhone"),
      contactEmail: form.get("contactEmail"),
      message: form.get("message") || undefined,
    });
    setBusy(false);
    if (result.ok) setDone(true);
    else setError(result.error);
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      {(
        [
          ["clubName", "Club name", "text"],
          ["city", "City", "text"],
          ["contactName", "Your name", "text"],
          ["contactPhone", "Phone", "tel"],
          ["contactEmail", "Email", "email"],
        ] as const
      ).map(([name, label, type]) => (
        <label key={name} className="block text-sm">
          <span className="mb-1 block text-moon-dim">{label}</span>
          <Input name={name} type={type} required />
        </label>
      ))}
      <label className="block text-sm">
        <span className="mb-1 block text-moon-dim">
          Anything else? (optional)
        </span>
        <textarea
          name="message"
          rows={4}
          className="w-full rounded-sm border border-line bg-night px-3 py-2 text-sm text-moon placeholder:text-moon-dim"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? "Submitting…" : "Submit application"}
      </Button>
    </form>
  );
}
