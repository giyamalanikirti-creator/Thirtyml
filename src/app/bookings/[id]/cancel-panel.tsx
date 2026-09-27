"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/utils";
import type { RefundQuote } from "@/lib/cancellation";
import { cancelMyBooking, getCancellationQuote, raiseIssue } from "./actions";

export function CancelPanel({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [quote, setQuote] = React.useState<RefundQuote | null>(null);
  const [open, setOpen] = React.useState(false);
  const [method, setMethod] = React.useState<"original" | "wallet">("original");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [issueOpen, setIssueOpen] = React.useState(false);
  const [issueText, setIssueText] = React.useState("");
  const [issueDone, setIssueDone] = React.useState(false);

  async function openCancel() {
    setBusy(true);
    const q = await getCancellationQuote(bookingId);
    setQuote(q);
    setOpen(true);
    setBusy(false);
  }

  async function confirmCancel() {
    setBusy(true);
    setError(null);
    const result = await cancelMyBooking({ bookingId, refundMethod: method });
    setBusy(false);
    if (result.ok) router.refresh();
    else setError(result.error);
  }

  async function sendIssue() {
    setBusy(true);
    setError(null);
    const result = await raiseIssue({ bookingId, message: issueText });
    setBusy(false);
    if (result.ok) setIssueDone(true);
    else setError(result.error);
  }

  return (
    <div className="mt-6 space-y-4">
      {!open ? (
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" disabled={busy} onClick={openCancel}>
            Cancel this booking
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => setIssueOpen((v) => !v)}
          >
            Raise an issue
          </Button>
        </div>
      ) : quote && quote.cancellable ? (
        <div className="rounded-md border border-line bg-night-raised p-4">
          <h3 className="font-medium">Cancel and refund</h3>
          {quote.refundPaise > 0 ? (
            <>
              <p className="mt-1 text-sm text-moon-dim">
                You&apos;ll get back{" "}
                <strong className="tnum text-moon">
                  {formatPaise(quote.refundPaise)}
                </strong>{" "}
                under the club&apos;s policy (convenience fee is
                non-refundable).
              </p>
              <div className="mt-3 space-y-1 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={method === "original"}
                    onChange={() => setMethod("original")}
                  />
                  Back to my original payment method (5–7 working days)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={method === "wallet"}
                    onChange={() => setMethod("wallet")}
                  />
                  Instant ThirtyML wallet credit
                </label>
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-moon-dim">
              {quote.reason ??
                "No refund is due under the club's policy for this timing."}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <Button variant="danger" disabled={busy} onClick={confirmCancel}>
              {busy
                ? "Cancelling…"
                : quote.refundPaise > 0
                  ? `Cancel and refund ${formatPaise(quote.refundPaise)}`
                  : "Cancel without refund"}
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
              Keep my booking
            </Button>
          </div>
        </div>
      ) : (
        <p className="rounded-md border border-line bg-night-raised p-4 text-sm text-moon-dim">
          {quote?.reason ?? "This booking can't be cancelled."}
        </p>
      )}

      {issueOpen && !issueDone && (
        <div className="rounded-md border border-line bg-night-raised p-4">
          <h3 className="font-medium">What went wrong?</h3>
          <textarea
            rows={4}
            value={issueText}
            onChange={(e) => setIssueText(e.target.value)}
            className="mt-2 w-full rounded-sm border border-line bg-night px-3 py-2 text-sm"
            placeholder="Tell us what happened — we reply within 24 hours."
          />
          {error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          )}
          <Button className="mt-3" disabled={busy} onClick={sendIssue}>
            Send to support
          </Button>
        </div>
      )}
      {issueDone && (
        <p className="rounded-md border border-drop/40 bg-drop/10 p-3 text-sm text-drop">
          Ticket opened — track it under Support in your account.
        </p>
      )}
    </div>
  );
}
