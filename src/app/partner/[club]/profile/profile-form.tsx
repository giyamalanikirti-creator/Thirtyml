"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveProfile } from "./actions";

const PinMap = dynamic(() => import("./pin-map"), { ssr: false });

export function ProfileForm({
  clubId,
  initial,
}: {
  clubId: string;
  initial: {
    description: string;
    address: string;
    websiteUrl: string;
    instagramUrl: string;
    phone: string;
    dressCode: string;
    minAge: number;
    lat: number | null;
    lng: number | null;
    houseRules: string;
    requiresGuestNames: boolean;
    bookingCutoffMinutes: number;
  };
}) {
  const router = useRouter();
  const [state, setState] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMessage(null);
    setError(null);
    const result = await saveProfile({ clubId, ...state });
    setBusy(false);
    if (result.ok) {
      setMessage("Profile saved");
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <Field label="About the club">
          <textarea
            rows={4}
            className="w-full rounded-sm border border-line bg-night px-3 py-2 text-sm"
            value={state.description}
            onChange={(e) => setState({ ...state, description: e.target.value })}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Address">
            <Input
              value={state.address}
              onChange={(e) => setState({ ...state, address: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <Input
              value={state.phone}
              onChange={(e) => setState({ ...state, phone: e.target.value })}
            />
          </Field>
          <Field label="Website">
            <Input
              value={state.websiteUrl}
              placeholder="https://…"
              onChange={(e) => setState({ ...state, websiteUrl: e.target.value })}
            />
          </Field>
          <Field label="Instagram">
            <Input
              value={state.instagramUrl}
              placeholder="https://instagram.com/…"
              onChange={(e) => setState({ ...state, instagramUrl: e.target.value })}
            />
          </Field>
          <Field label="Dress code">
            <Input
              value={state.dressCode}
              onChange={(e) => setState({ ...state, dressCode: e.target.value })}
            />
          </Field>
          <Field label="Minimum age">
            <Input
              type="number"
              value={state.minAge}
              min={18}
              max={30}
              onChange={(e) =>
                setState({ ...state, minAge: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Booking cutoff (minutes before night)">
            <Input
              type="number"
              value={state.bookingCutoffMinutes}
              min={0}
              max={1440}
              onChange={(e) =>
                setState({
                  ...state,
                  bookingCutoffMinutes: Number(e.target.value),
                })
              }
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={state.requiresGuestNames}
              onChange={(e) =>
                setState({ ...state, requiresGuestNames: e.target.checked })
              }
            />
            Require names for every guest
          </label>
        </div>
        <Field label="House rules">
          <textarea
            rows={3}
            className="w-full rounded-sm border border-line bg-night px-3 py-2 text-sm"
            value={state.houseRules}
            onChange={(e) => setState({ ...state, houseRules: e.target.value })}
          />
        </Field>

        {message && <p className="text-sm text-drop">{message}</p>}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save profile"}
        </Button>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Location pin</p>
        <p className="mb-2 text-xs text-moon-dim">
          Drag the pin to your entrance. Guests use this for directions.
        </p>
        <PinMap
          lat={state.lat ?? 19.076}
          lng={state.lng ?? 72.8777}
          onChange={(lat, lng) => setState({ ...state, lat, lng })}
        />
        <p className="tnum mt-2 text-xs text-moon-dim">
          {state.lat?.toFixed(5)}, {state.lng?.toFixed(5)}
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-moon-dim">{label}</span>
      {children}
    </label>
  );
}
