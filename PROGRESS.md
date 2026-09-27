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

## Current phase

### Phase 2 — Database (in progress)

## Open TODOs
- Real Razorpay / Resend / MSG91 providers behind the interfaces (phases 3/6).
- GST rates in `platform_settings` must be confirmed with a CA before launch.
- Sentry release tracking / source maps need `SENTRY_AUTH_TOKEN` at build
  (deferred to phase 9 deploy setup).

## Known issues
- Home page price board is static demo data until Phase 4 wires Realtime.

## Decisions needed from the user
- None yet. Supabase project keys are needed before Phase 3 can be verified
  end-to-end (local mocks cover development until then).
