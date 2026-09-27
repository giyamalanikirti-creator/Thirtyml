import * as Sentry from "@sentry/nextjs";

export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return; // No DSN locally — Sentry stays off.
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
    tracesSampleRate: 0.1,
  });
}

export const onRequestError = Sentry.captureRequestError;
