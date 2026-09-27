# Playwright acceptance tests

These cover the ten acceptance tests in section 17 of the brief:

1. Live price flip on the club page.
2. Cart price change requires acknowledgement.
3. Price lock during checkout.
4. No overselling under concurrent checkout.
5. Hold expiry frees inventory and notifies the waitlist.
6. Payment success (+ duplicate webhook + closed-tab recovery).
7. Coupon eligibility rules.
8. Cancellation refund math and full-refund on club cancellation.
9. Check-in: valid / already used / wrong club / wrong date / cancelled.
10. Permissions: customer vs partner vs admin routes and cross-account
    isolation.

Two are covered here as smoke tests today; the remaining eight need a
staging Supabase project with the seed data applied. The stubs live in
`tests/e2e/acceptance/` — implement them against the preview URL once the
staging environment is up.

Run: `npm run test:e2e` (locally, boots `npm run start` at :3000).
