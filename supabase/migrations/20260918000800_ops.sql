-- Ops: notification outbox, support, CMS, applications, settings, audit log.

-- Outbox: rows are written in the same transaction as the event that caused
-- them; a cron/edge function delivers and marks them, so sending never
-- blocks a request.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  club_id uuid references public.clubs (id) on delete cascade,
  category text not null,          -- booking_confirmed | payment_failed | ...
  channel text not null check (channel in ('email', 'sms', 'whatsapp', 'in_app')),
  payload jsonb not null default '{}'::jsonb,
  title text,
  body text,
  read_at timestamptz,             -- in_app only
  send_after timestamptz not null default now(),
  sent_at timestamptz,
  failed_at timestamptz,
  error text,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
create index notifications_unsent_idx on public.notifications (send_after)
  where sent_at is null and failed_at is null;
create index notifications_user_idx
  on public.notifications (user_id, created_at desc)
  where channel = 'in_app';

create table public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- {"marketing": {"email": false, "whatsapp": true}, ...}
  -- transactional categories cannot be disabled (enforced in app code)
  prefs jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id),
  email text,
  subject text not null,
  status text not null default 'open'
    check (status in ('open', 'pending', 'resolved', 'closed')),
  assigned_to uuid references auth.users (id),
  booking_id uuid references public.bookings (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index support_tickets_user_idx on public.support_tickets (user_id);
create index support_tickets_status_idx on public.support_tickets (status);
create trigger support_tickets_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  author_id uuid references auth.users (id),
  is_staff boolean not null default false,
  body text not null,
  created_at timestamptz not null default now()
);
create index support_messages_ticket_idx on public.support_messages (ticket_id);

create table public.help_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null,
  title text not null,
  body text not null,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger help_articles_updated_at before update on public.help_articles
  for each row execute function public.set_updated_at();

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references public.cities (id) on delete cascade,
  title text not null,
  subtitle text,
  image_path text,
  link_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  city_id uuid references public.cities (id) on delete cascade,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger collections_updated_at before update on public.collections
  for each row execute function public.set_updated_at();

create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  club_id uuid references public.clubs (id) on delete cascade,
  event_id uuid references public.events (id) on delete cascade,
  sort_order int not null default 0,
  constraint collection_item_target check (
    (club_id is not null)::int + (event_id is not null)::int = 1
  )
);
create index collection_items_collection_idx
  on public.collection_items (collection_id);

create table public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid references auth.users (id),
  club_name text not null,
  city text not null,
  contact_name text not null,
  contact_phone text not null,
  contact_email text not null,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'needs_info', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger partner_applications_updated_at
  before update on public.partner_applications
  for each row execute function public.set_updated_at();

create table public.club_claims (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  claimant_id uuid not null references auth.users (id),
  proof text,
  status text not null default 'pending'
    check (status in ('pending', 'needs_info', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club_id, claimant_id)
);
create trigger club_claims_updated_at before update on public.club_claims
  for each row execute function public.set_updated_at();

-- Singleton-ish settings store, editable from admin only.
create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now()
);

-- Defaults; NOTE: GST rates must be confirmed with a chartered accountant
-- before launch — these are configuration, not tax advice.
insert into public.platform_settings (key, value) values
  ('convenience_fee', '{"type": "percent", "bps": 350, "min_paise": 2000, "max_paise": 20000}'),
  ('gst', '{"on_convenience_fee_bps": 1800, "on_tickets_bps": 0, "note": "confirm with CA before launch"}'),
  ('commission_default_bps', '1000'),
  ('payout_delay_days', '2'),
  ('maintenance_mode', 'false'),
  ('seller_gstin', '""');

create table public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  note text,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id),
  action text not null,
  entity_type text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  reason text,
  created_at timestamptz not null default now()
);
create index audit_logs_entity_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
