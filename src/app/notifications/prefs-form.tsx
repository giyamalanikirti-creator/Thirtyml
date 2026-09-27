"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { savePreferences } from "./actions";

const CATEGORIES = [
  { key: "reminders", label: "Night-of reminders" },
  { key: "price_alerts", label: "Price alerts" },
  { key: "waitlist", label: "Waitlist updates" },
  { key: "marketing", label: "Offers & recommendations" },
];
const CHANNELS = [
  { key: "email", label: "Email" },
  { key: "whatsapp", label: "WhatsApp/SMS" },
];

type Prefs = Record<string, Record<string, boolean>>;

export function PrefsForm({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = React.useState<Prefs>(initial);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  function toggle(category: string, channel: string) {
    setPrefs((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !(prev[category]?.[channel] ?? true),
      },
    }));
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    const result = await savePreferences(prefs);
    setBusy(false);
    setMessage(result.ok ? "Preferences saved" : result.error);
  }

  return (
    <div className="rounded-md border border-line bg-night-raised p-5">
      <h2 className="font-display font-semibold">Preferences</h2>
      <p className="mt-1 text-xs text-moon-dim">
        Booking confirmations, tickets and refund updates are always sent —
        they can&apos;t be turned off.
      </p>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-moon-dim">
            <th className="py-1 font-normal">Category</th>
            {CHANNELS.map((c) => (
              <th key={c.key} className="py-1 text-center font-normal">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CATEGORIES.map((cat) => (
            <tr key={cat.key} className="border-t border-line">
              <td className="py-2">{cat.label}</td>
              {CHANNELS.map((ch) => (
                <td key={ch.key} className="py-2 text-center">
                  <input
                    type="checkbox"
                    aria-label={`${cat.label} via ${ch.label}`}
                    checked={prefs[cat.key]?.[ch.key] ?? true}
                    onChange={() => toggle(cat.key, ch.key)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {message && <p className="mt-3 text-sm text-drop">{message}</p>}
      <Button className="mt-4" size="sm" disabled={busy} onClick={save}>
        {busy ? "Saving…" : "Save preferences"}
      </Button>
    </div>
  );
}
