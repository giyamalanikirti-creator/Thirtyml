# Working on ThirtyML

Read these first, in order:
1. `PROGRESS.md` — what phase we're on, what works, what's next.
2. `DESIGN.md` — colours, type, motion, layout sketches.
3. The original brief in the initial user message of this session/thread.

## Rules that don't move

- Money is integer paise everywhere. Display only through `formatPaise` in `src/lib/utils.ts`.
- Prices come from `effective_price` / `catalog_prices` on the server — never trust client-sent prices.
- RLS is on for every table. Finance-sensitive tables (orders/payments/payouts/wallet writes/webhook_events/invoices/audit_logs) have no client policies — service-role only, from server code, after an explicit auth check.
- Every server action and route handler re-checks authorisation itself. Middleware alone is never the guard.
- Providers (payments/email/SMS) sit behind interfaces in `src/lib/providers/`. Fall back to the console/mock implementation whenever real keys are absent; the app must run with zero keys.
- Timezone for display and business dates is `Asia/Kolkata`. Nights are keyed by their local date.
- Commit messages end with the attribution footer given in the session reminder.

## Common commands

```
npm run dev             # Next.js dev server
npm run typecheck       # tsc --noEmit
npm run lint            # ESLint
npm run test            # Vitest unit tests
npm run build           # production build
npm run db:test         # apply migrations + seed + RLS/pricing/inventory tests
npm run db:types        # regenerate src/lib/database.types.ts
npm run simulate:prices # nudge prices every 20s (dev only, needs service role)
```
