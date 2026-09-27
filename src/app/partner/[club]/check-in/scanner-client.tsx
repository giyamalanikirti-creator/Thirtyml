"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { admitGuests, type ScanResult } from "./actions";

const Html5QrScanner = dynamic(() => import("./html5-scanner"), {
  ssr: false,
});

export function ScannerClient({ clubId }: { clubId: string }) {
  const [result, setResult] = React.useState<ScanResult | null>(null);
  const [guests, setGuests] = React.useState(1);
  const [manual, setManual] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const lastToken = React.useRef<string>("");
  const lockUntil = React.useRef<number>(0);

  async function submit(token: string) {
    if (busy) return;
    if (token === lastToken.current && Date.now() < lockUntil.current) return;
    lastToken.current = token;
    lockUntil.current = Date.now() + 3000;
    setBusy(true);
    const res = await admitGuests({ clubId, token, guestsToAdmit: guests });
    setBusy(false);
    setResult(res);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(res.ok ? 60 : [80, 60, 80]);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center gap-2 text-sm">
        <label className="text-moon-dim">Guests per scan:</label>
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setGuests((n) => Math.max(1, n - 1))}
          >
            −
          </Button>
          <span className="tnum w-6 text-center">{guests}</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setGuests((n) => Math.min(20, n + 1))}
          >
            +
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-line">
        <Html5QrScanner onScan={submit} />
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (manual) submit(manual.trim());
        }}
      >
        <Input
          placeholder="Enter booking code or QR token"
          value={manual}
          onChange={(e) => setManual(e.target.value.toUpperCase())}
        />
        <Button type="submit" size="lg" disabled={busy || !manual}>
          Admit
        </Button>
      </form>

      {result && <ResultBanner result={result} />}
    </div>
  );
}

function ResultBanner({ result }: { result: ScanResult }) {
  if (!result.ok) {
    return (
      <div className="mt-4 rounded-lg bg-danger p-8 text-center">
        <p className="font-display text-3xl font-black tracking-wider text-moon">
          REJECTED
        </p>
        <p className="mt-2 text-lg text-moon">{result.reason}</p>
      </div>
    );
  }
  const done = result.remaining === 0;
  const already = result.status === "already_used";
  return (
    <div
      className={
        "mt-4 rounded-lg p-8 text-center " +
        (already ? "bg-dusk" : "bg-drop")
      }
    >
      <p className="font-display text-4xl font-black tracking-wider text-night">
        {already ? "ALREADY USED" : "ADMITTED"}
      </p>
      {!already && (
        <p className="mt-1 text-lg text-night">
          {result.admitted} guest{result.admitted === 1 ? "" : "s"} admitted
        </p>
      )}
      <p className="tnum mt-3 font-mono text-2xl font-bold text-night">
        {result.bookingCode}
      </p>
      {result.leadName && (
        <p className="mt-1 text-lg text-night/80">{result.leadName}</p>
      )}
      <p className="mt-2 text-sm text-night/80">
        {done
          ? `All ${result.total} guest${result.total === 1 ? "" : "s"} in`
          : `${result.remaining} of ${result.total} still to come`}
      </p>
    </div>
  );
}
