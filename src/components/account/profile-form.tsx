"use client";

import * as React from "react";
import { updateProfile } from "@/app/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FALLBACK_CITIES } from "@/lib/cities";

export function ProfileForm({
  initial,
}: {
  initial: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    homeCity: string;
  };
}) {
  const [state, setState] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    const result = await updateProfile({
      fullName: state.fullName,
      dateOfBirth: state.dateOfBirth,
      gender: state.gender || undefined,
      homeCity: state.homeCity,
    });
    setBusy(false);
    if (result.ok) setMessage("Profile saved");
    else setError(result.error);
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <label className="block text-sm">
        <span className="mb-1 block text-moon-dim">Full name</span>
        <Input
          value={state.fullName}
          autoComplete="name"
          onChange={(e) => setState({ ...state, fullName: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-moon-dim">
          Date of birth{" "}
          <span className="text-xs">(needed for age-restricted entry)</span>
        </span>
        <Input
          type="date"
          value={state.dateOfBirth}
          autoComplete="bday"
          onChange={(e) => setState({ ...state, dateOfBirth: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-moon-dim">Gender (optional)</span>
        <select
          className="flex h-10 w-full rounded-sm border border-line bg-night px-3 text-sm text-moon"
          value={state.gender}
          onChange={(e) => setState({ ...state, gender: e.target.value })}
        >
          <option value="">Prefer not to say</option>
          <option value="woman">Woman</option>
          <option value="man">Man</option>
          <option value="nonbinary">Non-binary</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-moon-dim">Home city</span>
        <select
          className="flex h-10 w-full rounded-sm border border-line bg-night px-3 text-sm text-moon"
          value={state.homeCity}
          onChange={(e) => setState({ ...state, homeCity: e.target.value })}
        >
          {FALLBACK_CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      {message && <p className="text-sm text-drop">{message}</p>}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
