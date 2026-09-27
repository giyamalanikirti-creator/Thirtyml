# ThirtyML

A two-sided nightlife marketplace for India: club entry, tables and event
tickets at **live prices** set by the clubs themselves. Customers always see
the price that's valid right now, get warned when anything in their cart
changes, and pay exactly the price shown when they started checkout.

Launch cities: Mumbai, Pune, Agra (new cities addable from admin).

## Stack

Next.js (App Router, TypeScript strict) · Tailwind v4 · Supabase (Postgres,
Auth, Storage, Realtime, pg_cron) · Razorpay (+ Route for club payouts) ·
Resend · MSG91 · Upstash Redis · Cloudflare Turnstile · Sentry · PostHog ·
Vitest + Playwright · Vercel.

See `DESIGN.md` for the design system and `PROGRESS.md` for build status.

## Getting started

```bash
npm install
cp .env.example .env.local   # keys optional — see below
npm run dev
```

**No third-party keys are required for local development.** Every provider
(payments, email, SMS/OTP) sits behind an interface in `src/lib/providers/`
with a console/mock implementation that is used automatically when keys are
missing — OTPs and emails print to the server console, and payments simulate
a gateway that accepts.

### Supabase (from Phase 2)

```bash
npx supabase start          # local stack
npx supabase db reset       # applies migrations + seed
```

Seed data (dev/staging only) includes demo clubs in the three launch cities
and demo accounts — credentials are listed in `supabase/seed.sql` comments.
Demo club listings are approximate and unclaimed; real clubs go live only
after signing up, agreeing to partner terms and completing payout onboarding.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` / `start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |

## Environments

Three separate Supabase projects + Vercel environments: development (local),
staging (previews), production. Razorpay test keys in dev/staging; live keys
only in production. Never expose `SUPABASE_SERVICE_ROLE_KEY` or any secret to
the client.

> **Tax note:** GST rates on the convenience fee and tickets are configured
> in admin `platform_settings`, not hard-coded — confirm rates with a
> chartered accountant before launch.
