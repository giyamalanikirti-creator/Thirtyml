"use client";

import * as React from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-6xl flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-semibold">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm text-moon-dim">
        That wasn&apos;t supposed to happen. Your cart and bookings are safe —
        try again.
      </p>
      <Button onClick={reset} className="mt-8">
        Try again
      </Button>
    </main>
  );
}
