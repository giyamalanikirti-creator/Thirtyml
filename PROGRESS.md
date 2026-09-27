# ThirtyML build progress

Any future session: read this first, then `DESIGN.md`, then the phase plan in
the original brief. Work phases in order; keep this file updated.

## Completed phases

### Phase 1 — Foundation ✅
- Next.js 16 (App Router, TS strict, RSC) + Tailwind v4 at repo root,
  `src/` layout, `@/*` alias.
- `DESIGN.md`: full token set (night/aubergine/sodium/dusk palette),
  Bricolage Grotesque + Inter, type/spacing/radius scales, ASCII sketches for
  the six key screens. Tokens are live in `src/app/globals.css` via Tailwind
  v4 `@theme`.
- Layout shell: `Header` (logo, city switcher, search entry, favourites /
  cart / account icons), `Footer` (discover / for clubs / company / legal
  incl. grievance officer). Home page with a placeholder live price board.
- UI primitives in `src/components/ui`: Button (xl size for door check-in),
  Card, Input, Badge, Skeleton. `PriceTag` in `src/components/price` does the
  split-flap flip, direction glyphs, "Updated Xm ago", reduced-motion pulse.
- `src/lib/utils.ts`: `cn`, `formatPaise` (integer paise → ₹ Indian
  grouping — the only money formatter), `slugify`.
- Provider layer `src/lib/providers/`: `PaymentsProvider`, `EmailProvider`,
  `SmsProvider` interfaces + console/mock implementations (mock payments use
  a real HMAC scheme mirroring Razorpay so verification paths run). Factories
  fall back to mocks whenever keys are absent — app runs with zero keys.
- Error handling: `error.tsx`, `global-error.tsx`, `not-found.tsx`; Sentry
  via `instrumentation.ts` / `instrumentation-client.ts`, off without a DSN.
- `/api/health`, `.env.example`, Vitest (`npm run test`) with first unit
  tests, `npm run typecheck`, GitHub Actions CI (typecheck, lint, unit,
  build). Old Firebase prototype preserved at
  `docs/legacy/prototype-firebase.html`; Jekyll workflow removed.

### Phase 2 — Database ✅
- 11 migrations in `supabase/migrations/` (one concern each): extensions +
  role helpers, core (profiles/cities/clubs/members/hours/photos/amenities/
  genres), catalogue (events/products/price overrides/rules/history/nights/
  floor plans/tables), commerce (carts/coupons/orders/bookings/tickets/
  check-ins/inventory_holds), payments (payments/webhook_events/refunds/
  invoices with per-FY sequential numbers/payout accounts/payouts/settlement
  lines), offers+wallet (ledger-based), engagement (favorites/alerts/
  waitlist/reviews with rating trigger/recently viewed), ops (notification
  outbox/support/CMS/applications/claims/platform_settings/feature
  flags/audit log), pricing functions, RLS, realtime + pg_cron.
- Money is bigint paise everywhere. Every FK and common filter is indexed.
- `effective_price(product, date, at)`: override → day-of-week/time rule
  (tonight only) → base; event tiers are products so tier price = base.
  `available_quantity` = capacity − paid items − live holds. `place_hold`
  serialises per product+night via advisory xact lock — no overselling.
  `expire_stale_holds` + `apply_due_price_rules` run via pg_cron (guarded so
  plain Postgres skips scheduling). Price changes auto-log to
  `price_history` via trigger; tampering can't skip it.
- RLS on every table; finance tables (orders/payments/payouts/wallet writes
  etc.) have no client policies — service-role only. Tests in
  `supabase/tests/rls.test.sql` prove: anon sees catalogue only; customer A
  can't see customer B's orders/wallet; club B can't read club A's bookings
  or reprice its products; door staff can see bookings but not edit prices
  or payouts; overrides beat base price; the last table can't be double-held
  (sold_out); expiry frees inventory and expires the pending order; invoice
  numbers are sequential per financial year; rating trigger works.
- `scripts/db-test.sh` runs shim + migrations + seed + tests on a throwaway
  DB (local socket or ADMIN_URL for CI — wired into GitHub Actions).
- `supabase/seed.sql` (dev/staging only): 3 cities, 10 demo clubs
  (approximate coords, unclaimed), entry products per club, floor plans +
  tables for the big rooms, 4 events with tiers, nights for 14 days, price
  history for sparklines, FIRSTNIGHT/AGRA100 coupons, demo accounts
  (`*@thirtyml.dev` / `ThirtyML-demo-1`).
- `src/lib/database.types.ts` generated from the real schema
  (`scripts/db-types.sh` regenerates; falls back to postgres-meta when
  Docker is unavailable).

### Phase 3 — Auth & accounts ✅
- Supabase clients: browser (`lib/supabase/client.ts`), request-scoped server
  client + service-role admin client (`lib/supabase/server.ts`, server-only).
- `src/middleware.ts` routes by session/role (customer, partner, admin) and
  refreshes auth cookies; `src/lib/auth.ts` provides the real guards
  (`requireUser`, `requireRole`, `requireClubRole`, `getMemberships`) used by
  every server action — middleware is never trusted alone.
- `/login`, `/signup`: phone OTP (primary), email+password, magic link,
  Google OAuth; `/reset-password` (request + update stages);
  `/auth/callback` code exchange. `/partner/login` (visually distinct) and
  `/partner/apply` (creates `partner_applications`).
- `/account`: profile form (name/DOB/gender/home city, zod-validated server
  action), verified-contacts panel, sign out all devices, DPDP data export
  (JSON download of own rows under RLS), soft account deletion (anonymise +
  auth ban via service role, audit-logged).
- Everything degrades gracefully without Supabase keys (explanatory notice
  instead of forms), so the app still runs with zero config.

### Phase 4 — Discovery ✅
- Data layer `src/lib/data/`: typed catalogue reads (cities, price board,
  clubs with filters/sort, club detail, events, event detail) backed by
  Supabase under RLS, with demo fixtures mirroring the seed when keys are
  absent. New migration adds `catalog_prices` and `city_price_board` RPCs so
  the UI always prices through `effective_price`.
- Live pricing: `useLivePrices` + `useLiveBoard` hooks subscribe to Realtime
  on products/price_overrides/nights and re-fetch via the RPCs (server stays
  the source of truth). `npm run simulate:prices` nudges prices every 20s.
- Pages: home (city-aware live board + rails + partner CTA), `/[city]`
  landing, `/[city]/clubs/[slug]` (gallery placeholder, date strip for 14
  nights, sticky live price panel with quantity steppers, sparkline,
  amenities/hours/rules, events, map, reviews, unclaimed badge + claim link,
  NightClub JSON-LD), `/[city]/events/[slug]` (lineup, phased tiers filtered
  by sales window, Event JSON-LD), `/clubs` (URL-synced filters + split
  Leaflet map with price-pill pins), `/events` (city chips), `/map`
  (full-screen dark map), `/search`, `/favorites` (RLS-scoped), `/offers`,
  `/for-clubs`, `/about`, `/contact`, `/help`, `/legal/*` baseline drafts
  (counsel review tracked for launch).
- Leaflet loads dynamically (client-only); price pins are sodium pills.
- Add-to-cart posts to `/api/cart` — implemented next in Phase 5.

### Phase 5 — Cart & checkout ✅
- `src/lib/cart.ts`: server-side cart. DB-backed (user carts + anonymous
  carts under a signed cookie token, merged on login; 24h/past-date expiry;
  live prices via `catalog_prices`; price-change detection with explicit
  acknowledgement) with a signed-cookie fallback against the demo catalogue
  when Supabase keys are absent. `/api/cart` POST/GET for the price panels.
- `/cart`: grouped by club+night, steppers, remove, save for later,
  price-change banners requiring "Okay, use the new prices" before checkout,
  estimated total.
- `src/lib/pricing.ts`: fee/tax settings from `platform_settings`,
  convenience fee (flat/percent/both with min/max), GST on fee, full coupon
  validation (dates, days, scope, limits, first-booking), wallet cap logic.
  Unit-tested.
- `/checkout`: review (locked lines), lead guest details (prefilled),
  coupon apply with live breakdown, wallet toggle, terms checkbox, light
  calm summary card, "Pay ₹X". `submitCheckout` → `createOrderFromCart`
  (service role): recomputes everything, snapshots order_items, places
  10-minute holds via `place_hold` (advisory-locked), aborts cleanly on
  sold-out. Redirects to `/orders/[id]/pay` (Phase 6).
- New migration revokes execute on state-changing/privileged functions from
  client roles (service-role only).

### Phase 6 — Payments ✅
- Real providers wired behind the interfaces: Razorpay over REST (orders
  with idempotency keys, HMAC payment + webhook signature verification with
  timing-safe compares, refunds, payment status) and Resend for email; mocks
  still cover keyless dev, including a simulated payment that exercises the
  full confirm path with a real HMAC.
- `src/lib/payments.ts`: `ensureGatewayOrder` (idempotent per order),
  `finalizeOrderPaid` — an atomic pending→paid claim, then bookings per
  club+night, lead guest, QR tickets (unguessable tokens), coupon
  redemption, wallet debit ledger row, per-FY sequential invoice, hold
  release, cart clear, and outbox notifications. Callback and webhook can
  arrive in any order; duplicates no-op. `reconcilePendingOrders` resolves
  stragglers.
- Routes: `/api/payments/create`, `/api/payments/confirm` (server-verified
  signature, no client-trusted amounts), `/api/webhooks/razorpay`
  (signature + unique event-id idempotency, 500 → gateway retry),
  `/api/jobs?task=reconcile|notifications|expire-holds` guarded by
  CRON_SECRET (timing-safe).
- `src/lib/notifications.ts`: outbox queueing + processor (email/WhatsApp/
  SMS via providers, attempts + failure capture; in-app rows read directly).
- Pages: `/orders/[id]/pay` (10-min countdown, Razorpay Checkout.js or
  simulated payment; expiry state with restart), `/orders/[id]/status`
  (polls; safe if the tab was closed mid-payment), `/orders/[id]`
  (confirmation with bookings, codes, payment summary, invoice link),
  `/orders/[id]/invoice` (print-friendly tax invoice).

## Current phase

### Phase 7 — Post-purchase (in progress)

## Open TODOs
- Real MSG91 provider (SMS/WhatsApp) — mock in use until DLT/WABA setup.
- Phone OTP delivery: Supabase Auth needs its "Send SMS" hook pointed at an
  MSG91 edge function in production (local Supabase logs OTPs). Document in
  LAUNCH.md.
- Profile-completion nudge after first sign-in (fields exist on /account;
  a forced redirect flow is still TODO).
- GST rates in `platform_settings` must be confirmed with a CA before launch.
- Sentry release tracking / source maps need `SENTRY_AUTH_TOKEN` at build
  (deferred to phase 9 deploy setup).

## Known issues
- Home page price board is static demo data until Phase 4 wires Realtime.

## Decisions needed from the user
- None yet. Supabase project keys are needed before Phase 3 can be verified
  end-to-end (local mocks cover development until then).
