"use client";

import * as React from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          background: "#0d1120",
          color: "#f2efe6",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div>
          <h1>Something went wrong</h1>
          <p style={{ color: "#9ca1b5" }}>
            Try again — your bookings are safe.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              background: "#f7a521",
              color: "#0d1120",
              border: 0,
              borderRadius: 10,
              padding: "10px 20px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
