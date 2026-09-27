-- Commerce: carts, orders, bookings, tickets, check-ins, inventory holds.

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  -- anonymous carts: signed cookie carries this token; merged on login
  anonymous_token uuid unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index carts_user_idx on public.carts (user_id)
  where user_id is not null;
create trigger carts_updated_at before update on public.carts
  for each row execute function public.set_updated_at();

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  table_id uuid references public.tables (id) on delete cascade,
  night_date date not null,
  quantity int not null default 1 check (quantity > 0),
  -- price when added, so the UI can highlight live-price changes
  price_when_added bigint not null,
  price_change_acknowledged_at timestamptz,
  saved_for_later boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id, night_date, table_id)
);
create index cart_items_cart_idx on public.cart_items (cart_id);
create index cart_items_product_idx on public.cart_items (product_id);
create trigger cart_items_updated_at before update on public.cart_items
  for each row execute function public.set_updated_at();

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('flat', 'percent')),
  discount_value bigint not null check (discount_value > 0), -- paise or bps
  max_discount bigint,             -- paise cap for percent coupons
  min_cart_value bigint not null default 0,
  valid_from timestamptz,
  valid_until timestamptz,
  days_of_week int[],
  total_limit int,
  per_user_limit int not null default 1,
  first_booking_only boolean not null default false,
  new_users_only boolean not null default false,
  funded_by text not null default 'platform'
    check (funded_by in ('platform', 'club')),
  club_id uuid references public.clubs (id) on delete cascade,
  city_id uuid references public.cities (id),
  event_id uuid references public.events (id),
  product_type text check (product_type in ('entry', 'table', 'event_ticket')),
  auto_apply boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index coupons_club_idx on public.coupons (club_id);
create trigger coupons_updated_at before update on public.coupons
  for each row execute function public.set_updated_at();

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  status text not null default 'pending_payment'
    check (status in (
      'pending_payment', 'paid', 'failed', 'expired', 'cancelled', 'refunded',
      'partially_refunded'
    )),
  subtotal bigint not null check (subtotal >= 0),
  discount bigint not null default 0 check (discount >= 0),
  convenience_fee bigint not null default 0 check (convenience_fee >= 0),
  tax bigint not null default 0 check (tax >= 0),
  wallet_used bigint not null default 0 check (wallet_used >= 0),
  total bigint not null check (total >= 0),
  coupon_id uuid references public.coupons (id),
  hold_expires_at timestamptz,
  idempotency_key text not null unique,
  lead_guest_name text,
  lead_guest_phone text,
  lead_guest_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status)
  where status = 'pending_payment';
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  table_id uuid references public.tables (id),
  night_date date not null,
  quantity int not null check (quantity > 0),
  -- snapshots: the customer pays exactly this whatever prices do later
  unit_price bigint not null check (unit_price >= 0),
  product_name text not null,
  product_type text not null,
  club_id uuid not null references public.clubs (id),
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_night_idx
  on public.order_items (product_id, night_date);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id),
  user_id uuid not null references auth.users (id),
  club_id uuid not null references public.clubs (id),
  night_date date not null,
  booking_code text not null unique
    default upper(encode(gen_random_bytes(4), 'hex')),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'checked_in', 'no_show')),
  guest_count int not null default 1,
  cancellation_reason text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bookings_order_idx on public.bookings (order_id);
create index bookings_user_idx on public.bookings (user_id, night_date desc);
create index bookings_club_night_idx on public.bookings (club_id, night_date);
create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

create table public.booking_guests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  full_name text not null,
  is_lead boolean not null default false,
  created_at timestamptz not null default now()
);
create index booking_guests_booking_idx on public.booking_guests (booking_id);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  -- signed, unguessable token embedded in the QR; never the booking id
  qr_token text not null unique default encode(gen_random_bytes(24), 'base64url'),
  status text not null default 'valid'
    check (status in ('valid', 'used', 'partially_used', 'void')),
  guests_total int not null default 1,
  guests_admitted int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tickets_booking_idx on public.tickets (booking_id);
create trigger tickets_updated_at before update on public.tickets
  for each row execute function public.set_updated_at();

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id),
  staff_id uuid not null references auth.users (id),
  guests_admitted int not null check (guests_admitted > 0),
  at timestamptz not null default now()
);
create index check_ins_ticket_idx on public.check_ins (ticket_id);

-- inventory holds ------------------------------------------------------------
create table public.inventory_holds (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  night_date date not null,
  table_id uuid references public.tables (id) on delete cascade,
  quantity int not null check (quantity > 0),
  order_id uuid not null references public.orders (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index inventory_holds_product_night_idx
  on public.inventory_holds (product_id, night_date);
create index inventory_holds_expiry_idx on public.inventory_holds (expires_at);
create index inventory_holds_order_idx on public.inventory_holds (order_id);
