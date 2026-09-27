"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveSetting } from "./actions";

export function SettingsClient({ initial }: { initial: Record<string, string> }) {
  const router = useRouter();
  const [values, setValues] = React.useState(initial);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function save(key: string) {
    setBusy(key);
    setNotice(null);
    setError(null);
    try {
      const parsed = JSON.parse(values[key]);
      const result = await saveSetting(key, parsed);
      if (!result.ok) throw new Error(result.error);
      setNotice(`${key} saved`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-moon-dim">
        Convenience fee, GST rates, commission defaults and payout delay are
        JSON here. Every change writes an audit log entry.
      </p>
      {Object.entries(values).map(([key, value]) => (
        <div key={key} className="rounded-md border border-line bg-night-raised p-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm text-sodium">{key}</p>
            <Button
              size="sm"
              disabled={busy === key}
              onClick={() => save(key)}
            >
              {busy === key ? "Saving…" : "Save"}
            </Button>
          </div>
          <textarea
            className="mt-2 h-32 w-full rounded-sm border border-line bg-night px-3 py-2 font-mono text-xs"
            value={value}
            onChange={(e) => setValues({ ...values, [key]: e.target.value })}
          />
        </div>
      ))}
      {notice && <p className="text-sm text-drop">{notice}</p>}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
