"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const KEY = "tml_cookie_consent";
type Choice = "accepted" | "declined" | "pending";

function readChoice(): Choice {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === "accepted" || saved === "declined" ? saved : "pending";
  } catch {
    return "pending";
  }
}

/** Cookie consent banner. Analytics stays off until the user opts in. */
export function CookieConsent() {
  // useSyncExternalStore gives us a mount-safe read of localStorage without a
  // setState-in-effect lint warning; SSR falls through to "pending".
  const choice = React.useSyncExternalStore(
    (onChange) => {
      const handler = () => onChange();
      window.addEventListener("storage", handler);
      window.addEventListener("thirtyml:consent-changed", handler);
      return () => {
        window.removeEventListener("storage", handler);
        window.removeEventListener("thirtyml:consent-changed", handler);
      };
    },
    readChoice,
    () => "pending"
  );

  function record(value: "accepted" | "declined") {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event("thirtyml:consent-changed"));
    if (value === "accepted") {
      window.dispatchEvent(new Event("thirtyml:consent-granted"));
    }
  }

  if (choice !== "pending") return null;
  return (
    <div
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-lg border border-line bg-night-raised p-4 shadow-lg"
      role="dialog"
      aria-live="polite"
      aria-label="Cookies"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-moon-dim">
          We use strictly necessary cookies for sign-in, your city choice and
          your cart. Analytics cookies are optional — you can change your mind
          any time.{" "}
          <Link href="/legal/cookies" className="text-dusk hover:underline">
            Cookie policy
          </Link>
          .
        </p>
        <div className="flex gap-2 sm:ml-auto">
          <Button variant="ghost" size="sm" onClick={() => record("declined")}>
            Necessary only
          </Button>
          <Button size="sm" onClick={() => record("accepted")}>
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
