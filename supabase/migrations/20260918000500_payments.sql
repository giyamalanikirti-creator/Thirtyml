-- Payments: gateway records, webhooks, refunds, invoices, payouts.
-- These tables are written only by server code using the service role.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id),
  razorpay_order_id text not null,
  razorpay_payment_id text unique,
  method text,
  status text not null default 'created'
    check (status in ('created', 'authorized', 'captured', 'refunded', 'failed')),
  amount bigint not null,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_idx on public.payments (order_id);
create index payments_rzp_order_idx on public.payments (razorpay_order_id);
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- Idempotent webhook processing: event ids are unique, replays no-op.
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id),
  booking_id uuid references public.bookings (id),
  payment_id uuid references public.payments (id),
  razorpay_refund_id text unique,
  amount bigint not null check (amount > 0),
  method text not null default 'original'
    check (method in ('original', 'wallet')),
  status text not null default 'pending'
    check (status in ('pending', 'processed', 'failed')),
  reason text not null,
  initiated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index refunds_order_idx on public.refunds (order_id);
create trigger refunds_updated_at before update on public.refunds
  for each row execute function public.set_updated_at();

-- Sequential invoice numbers per Indian financial year (Apr–Mar).
create table public.invoice_counters (
  financial_year text primary key,   -- e.g. '2026-27'
  last_number bigint not null default 0
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id),
  invoice_number text not null unique,
  financial_year text not null,
  pdf_path text,
  seller_gstin text,
  club_gstin text,
  totals jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function public.next_invoice_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  fy text;
  n bigint;
begin
  -- Indian financial year: April to March, in IST.
  if extract(month from (now() at time zone 'Asia/Kolkata')) >= 4 then
    fy := to_char(now() at time zone 'Asia/Kolkata', 'YYYY') || '-' ||
          to_char((now() at time zone 'Asia/Kolkata') + interval '1 year', 'YY');
  else
    fy := to_char((now() at time zone 'Asia/Kolkata') - interval '1 year', 'YYYY') ||
          '-' || to_char(now() at time zone 'Asia/Kolkata', 'YY');
  end if;

  insert into public.invoice_counters as c (financial_year, last_number)
  values (fy, 1)
  on conflict (financial_year)
  do update set last_number = c.last_number + 1
  returning last_number into n;

  return 'TML/' || fy || '/' || lpad(n::text, 6, '0');
end;
$$;

-- payouts to clubs -----------------------------------------------------------
create table public.payout_accounts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null unique references public.clubs (id) on delete cascade,
  razorpay_linked_account_id text unique,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'needs_info', 'suspended')),
  -- we never store raw bank details; only the gateway reference + last 4
  bank_last4 text,
  pan_last4 text,
  gstin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger payout_accounts_updated_at before update on public.payout_accounts
  for each row execute function public.set_updated_at();

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id),
  night_date date not null,
  gross bigint not null default 0,
  commission bigint not null default 0,
  refunds_deducted bigint not null default 0,
  net bigint not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'held', 'processing', 'processed', 'failed')),
  razorpay_transfer_id text unique,
  hold_reason text,
  scheduled_for date,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club_id, night_date)
);
create index payouts_club_idx on public.payouts (club_id, night_date desc);
create trigger payouts_updated_at before update on public.payouts
  for each row execute function public.set_updated_at();

create table public.settlement_lines (
  id uuid primary key default gen_random_uuid(),
  payout_id uuid not null references public.payouts (id) on delete cascade,
  booking_id uuid not null references public.bookings (id),
  description text not null,
  amount bigint not null,
  created_at timestamptz not null default now()
);
create index settlement_lines_payout_idx on public.settlement_lines (payout_id);
