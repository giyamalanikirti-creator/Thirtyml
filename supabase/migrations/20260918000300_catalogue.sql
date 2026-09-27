-- Catalogue & pricing: events, products, live-price machinery, floor plans.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  poster_path text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'cancelled')),
  is_featured boolean not null default false,
  terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club_id, slug)
);
create index events_club_idx on public.events (club_id);
create index events_starts_idx on public.events (starts_at);
create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

create table public.event_lineup (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  artist_name text not null,
  genre text,
  sort_order int not null default 0
);
create index event_lineup_event_idx on public.event_lineup (event_id);

-- products: the three bookable kinds. Event ticket tiers are products with
-- event_id set — a tier's live price IS its base_price (plus overrides/rules).
create table public.products (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  event_id uuid references public.events (id) on delete cascade,
  type text not null check (type in ('entry', 'table', 'event_ticket')),
  name text not null,
  description text,
  base_price bigint not null check (base_price >= 0),   -- integer paise
  capacity_per_night int not null default 0 check (capacity_per_night >= 0),
  max_per_order int not null default 10 check (max_per_order > 0),
  min_age int,
  cover_redeemable boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  -- tier phase switching (event tickets): activate/deactivate by time
  sales_start_at timestamptz,
  sales_end_at timestamptz,
  price_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_ticket_has_event
    check (type <> 'event_ticket' or event_id is not null)
);
create index products_club_idx on public.products (club_id);
create index products_event_idx on public.products (event_id);
create index products_type_idx on public.products (type);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.price_overrides (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  on_date date not null,
  price bigint not null check (price >= 0),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (product_id, on_date)
);
create index price_overrides_product_idx on public.price_overrides (product_id);

-- Recurring rules: "Stag becomes ₹2,500 from 23:00 on Saturdays".
-- A rule applies on matching days from start_time (until a later rule or
-- close). Scheduled pg_cron applies them by writing price_history.
create table public.price_rules (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  days_of_week int[] not null default '{0,1,2,3,4,5,6}',
  start_time time not null,
  price bigint not null check (price >= 0),
  is_active boolean not null default true,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index price_rules_product_idx on public.price_rules (product_id);

create table public.price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  old_price bigint,
  new_price bigint not null,
  reason text not null default 'manual'
    check (reason in ('manual', 'rule', 'tier_switch')),
  changed_by uuid references auth.users (id),
  changed_at timestamptz not null default now()
);
create index price_history_product_idx
  on public.price_history (product_id, changed_at desc);

-- Log every base_price change automatically so the history can't be skipped.
create or replace function public.log_price_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.base_price is distinct from old.base_price then
    insert into public.price_history (product_id, old_price, new_price, reason, changed_by)
    values (
      new.id,
      old.base_price,
      new.base_price,
      coalesce(current_setting('thirtyml.price_change_reason', true), 'manual'),
      auth.uid()
    );
    new.price_updated_at := now();
  end if;
  return new;
end;
$$;

create trigger products_price_history
  before update on public.products
  for each row execute function public.log_price_change();

-- nights: whether a club is open/bookable on a given date
create table public.nights (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  on_date date not null,
  is_open boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  unique (club_id, on_date)
);
create index nights_club_date_idx on public.nights (club_id, on_date);

-- floor plans & tables -------------------------------------------------------
create table public.floor_plans (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  name text not null default 'Main floor',
  background_path text,
  width int not null default 1000,
  height int not null default 700,
  created_at timestamptz not null default now()
);
create index floor_plans_club_idx on public.floor_plans (club_id);

create table public.tables (
  id uuid primary key default gen_random_uuid(),
  floor_plan_id uuid not null references public.floor_plans (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  x double precision not null default 0,
  y double precision not null default 0,
  shape text not null default 'round' check (shape in ('round', 'rect', 'booth')),
  capacity int not null default 4 check (capacity > 0),
  min_spend bigint not null default 0,       -- integer paise
  deposit_bps int not null default 10000,    -- 10000 = full payment upfront
  zone text,
  created_at timestamptz not null default now(),
  unique (product_id)
);
create index tables_floor_plan_idx on public.tables (floor_plan_id);
