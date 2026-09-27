# ThirtyML launch checklist

Everything on this page has to be true — or waived and documented — before
we accept a real customer's real money. Split into technical (Claude / eng
can do) and business (only you can do). Keep this file current; don't tick
anything until it's actually done.

## Technical

### Environments and secrets
- [ ] Production Supabase project (Pro plan; **Point-in-time recovery** on;
  daily backups tested by a restore drill in staging).
- [ ] Staging + preview environments have their own separate Supabase
  projects; no production data ever copied down.
- [ ] Vercel production env vars set (`.env.example` is the source of
  truth). Every secret rotated fresh — nothing from Slack, chats, or
  screenshots.
- [ ] `NEXT_PUBLIC_APP_ENV=production`, `PAYMENTS_MODE=live` on
  production; `NEXT_PUBLIC_SITE_URL` set to the real domain.
- [ ] Supabase Auth: production redirect URLs are the real domain plus
  `/auth/callback`; test-only ones removed.
- [ ] Custom domain live on Vercel with valid SSL and HSTS accepted by
  hstspreload.org (or the plan to submit).

### Payments (Razorpay)
- [ ] Razorpay live account KYC complete; **Razorpay Route** activated
  under our account.
- [ ] Live keys in production env only; webhooks pointed at
  `https://<domain>/api/webhooks/razorpay` with `RAZORPAY_WEBHOOK_SECRET`.
- [ ] Webhook signature verified end-to-end from a Razorpay test event.
- [ ] Refund tested end-to-end (partial + full) on a real live rupee.
- [ ] Every partner club has a linked account with completed KYC and a
  first-payout test on a small amount.

### Messaging & templates
- [ ] Resend domain DNS: SPF, DKIM and DMARC records verified; test
  send lands inbox in Gmail and Outlook.
- [ ] `EMAIL_FROM` matches the verified sending identity.
- [ ] MSG91 DLT registration filed and templates approved for OTP,
  booking-confirmed, price-alert, reminder, waitlist-open,
  night-cancelled categories.
- [ ] WhatsApp Business API templates approved (same categories); the
  `MSG91_WHATSAPP_NUMBER` matches the WABA sender.
- [ ] `notifications` outbox cron is firing every minute in production
  (see `/api/jobs?task=notifications`).

### Security & privacy
- [ ] `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` set. Turnstile widget
  live on `/signup`, `/verify-otp`, `/partner/apply` and the payment-order
  create endpoint.
- [ ] Upstash Redis reachable; the rate limits in `src/lib/rate-limit.ts`
  are applied to OTP, login, coupon apply, checkout create, search.
- [ ] `securityheaders.com` grade A on the production domain.
- [ ] Every secret is out of git history (double-check with `gitleaks`).
- [ ] DPDP Act 2023: grievance officer named on `/legal/grievance`;
  privacy policy reviewed by counsel; account-deletion and data-export
  flows tested in production.
- [ ] Cookie consent banner gates PostHog and any other analytics.

### Observability
- [ ] Sentry DSN set; a real client error is captured; release tracking
  wired via `SENTRY_AUTH_TOKEN` in CI.
- [ ] Uptime pinger on `/api/health` alerting to a channel that is
  actually monitored.
- [ ] PostHog project created; funnel `view_club → add_to_cart →
  checkout → paid` verified in staging.
- [ ] Cron schedule confirmed: `expire-holds` every minute,
  `notifications` every minute, `reconcile` every 15 minutes.

### SEO / PWA / performance
- [ ] `sitemap.xml` and `robots.txt` accessible from the production
  domain. `sitemap` submitted to Google Search Console.
- [ ] Open Graph images generated for at least one club and event.
- [ ] `manifest.webmanifest` + icon delivered; PWA installs on Android.
- [ ] Lighthouse (mobile) on a mid-tier device over 4G: LCP < 2.5s, CLS
  < 0.1, TBT < 300ms for `/`, `/[city]/clubs/[slug]`, `/cart`,
  `/checkout` — logged in this file.

### Testing
- [ ] `npm run test`, `npm run typecheck`, `npm run lint`, `npm run
  build` all green in CI on `main`.
- [ ] `scripts/db-test.sh` green in CI.
- [ ] Playwright suite covering the ten acceptance tests in section 17
  of the brief passes against a preview deployment.
- [ ] Manual smoke: sign up, buy, receive email + WhatsApp, check in via
  the scanner, cancel and get refunded.

### Data
- [ ] Seed data is NEVER applied to production (verified: production
  Supabase migration workflow does not include `supabase/seed.sql`).
- [ ] Demo `*@thirtyml.dev` accounts do not exist in production.
- [ ] Only clubs that have signed the partner agreement are `status =
  approved`; the rest stay `draft`/`pending_approval`.

## Business (you)

- [ ] Registered Indian business entity with PAN.
- [ ] GST registration complete; GSTIN filled into
  `platform_settings.seller_gstin`.
- [ ] Razorpay account KYC verified; **Route** feature activated for
  our account.
- [ ] GST rates confirmed with a chartered accountant, and the numbers
  in `platform_settings.gst` match.
- [ ] Convenience-fee structure approved (`platform_settings.convenience_fee`).
- [ ] Terms of use, Privacy policy, Refund & cancellation policy,
  Cookie policy and Partner terms reviewed and signed off by a
  practising Indian lawyer. The pages under `/legal/*` mirror the
  approved copy.
- [ ] Grievance officer appointed (name, email, response SLA on
  `/legal/grievance`).
- [ ] Signed partner agreement on file for **every** club that will be
  bookable at launch. Demo clubs stay unclaimed / draft until then.
- [ ] Support email (`support@thirtyml.in`) and phone line active and
  staffed to the SLA the FAQ promises.
- [ ] Explicit "we launched" retro after week one: refunds, drop-off,
  door incidents, price-change complaints.
