"use client";

import * as React from "react";
import {
  deleteMyAccount,
  exportMyData,
  signOutEverywhere,
} from "@/app/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DangerZone() {
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function onExport() {
    setBusy("export");
    setError(null);
    const result = await exportMyData();
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const blob = new Blob([JSON.stringify(result.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "thirtyml-data-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onDelete() {
    setBusy("delete");
    setError(null);
    const result = await deleteMyAccount({ confirm });
    setBusy(null);
    if (result && !result.ok) setError(result.error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium">Sessions</h3>
        <p className="mt-1 text-sm text-moon-dim">
          Signs you out on every device, including this one.
        </p>
        <Button
          variant="secondary"
          className="mt-2"
          disabled={busy !== null}
          onClick={() => {
            setBusy("signout");
            signOutEverywhere();
          }}
        >
          Sign out of all devices
        </Button>
      </div>

      <div>
        <h3 className="font-medium">Download my data</h3>
        <p className="mt-1 text-sm text-moon-dim">
          A JSON file with your profile, bookings, orders, reviews and wallet
          history.
        </p>
        <Button
          variant="secondary"
          className="mt-2"
          disabled={busy !== null}
          onClick={onExport}
        >
          {busy === "export" ? "Preparing…" : "Download my data"}
        </Button>
      </div>

      <div className="rounded-md border border-danger/40 p-4">
        <h3 className="font-medium text-danger">Delete my account</h3>
        <p className="mt-1 text-sm text-moon-dim">
          Your personal details are removed permanently. Records of payments
          and invoices are kept as required by law. This cannot be undone.
        </p>
        <label className="mt-3 block text-sm">
          <span className="mb-1 block text-moon-dim">
            Type <strong>DELETE</strong> to confirm
          </span>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="max-w-40"
          />
        </label>
        {error && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        )}
        <Button
          variant="danger"
          className="mt-3"
          disabled={busy !== null || confirm !== "DELETE"}
          onClick={onDelete}
        >
          {busy === "delete" ? "Deleting…" : "Delete my account"}
        </Button>
      </div>
    </div>
  );
}
