-- Coupon redemptions, ledger-based wallet, referrals.
-- (Coupons themselves are created in the commerce migration because orders
-- reference them.)

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id),
  user_id uuid not null references auth.users (id),
  order_id uuid not null references public.orders (id),
  discount_applied bigint not null,
  created_at timestamptz not null default now(),
  unique (coupon_id, order_id)
);
create index coupon_redemptions_user_idx
  on public.coupon_redemptions (coupon_id, user_id);

-- Wallet is a ledger: balance = sum(amount) of unexpired entries. Never a
-- single balance column updated in place.
create table public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  amount bigint not null,        -- positive = credit, negative = debit (paise)
  type text not null check (type in (
    'refund_credit', 'referral_reward', 'goodwill', 'order_payment',
    'expiry', 'admin_adjustment'
  )),
  reference_type text,           -- 'order' | 'refund' | 'referral' | ...
  reference_id uuid,
  note text,
  expires_at timestamptz,        -- credits can expire; debits never do
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index wallet_ledger_user_idx on public.wallet_ledger (user_id, created_at desc);

create or replace function public.wallet_balance(uid uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(amount), 0)
  from public.wallet_ledger
  where user_id = uid
    and (amount < 0 or expires_at is null or expires_at > now());
$$;

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users (id),
  referee_id uuid not null unique references auth.users (id),
  status text not null default 'pending'
    check (status in ('pending', 'rewarded', 'void')),
  -- reward paid after the referee's first checked-in booking
  rewarded_booking_id uuid references public.bookings (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index referrals_referrer_idx on public.referrals (referrer_id);
create trigger referrals_updated_at before update on public.referrals
  for each row execute function public.set_updated_at();
