-- Engagement: favourites, price alerts, waitlists, reviews, recently viewed.

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  club_id uuid references public.clubs (id) on delete cascade,
  event_id uuid references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorite_target check (
    (club_id is not null)::int + (event_id is not null)::int = 1
  ),
  unique (user_id, club_id, event_id)
);
create index favorites_user_idx on public.favorites (user_id);

create table public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  night_date date not null,
  threshold bigint not null check (threshold >= 0),  -- alert when price < this
  triggered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, product_id, night_date)
);
create index price_alerts_product_idx
  on public.price_alerts (product_id, night_date)
  where triggered_at is null;

create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  night_date date not null,
  quantity int not null default 1 check (quantity > 0),
  status text not null default 'waiting'
    check (status in ('waiting', 'notified', 'converted', 'expired')),
  -- 15-minute exclusive window once notified
  notified_at timestamptz,
  window_expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, product_id, night_date)
);
create index waitlist_product_night_idx
  on public.waitlist_entries (product_id, night_date, created_at);

-- reviews --------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id),
  user_id uuid not null references auth.users (id),
  club_id uuid not null references public.clubs (id),
  rating int not null check (rating between 1 and 5),
  rating_music int check (rating_music between 1 and 5),
  rating_crowd int check (rating_crowd between 1 and 5),
  rating_service int check (rating_service between 1 and 5),
  rating_value int check (rating_value between 1 and 5),
  body text,
  status text not null default 'published'
    check (status in ('published', 'flagged', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reviews_club_idx on public.reviews (club_id, created_at desc);
create index reviews_user_idx on public.reviews (user_id);
create trigger reviews_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

create table public.review_photos (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);
create index review_photos_review_idx on public.review_photos (review_id);

create table public.review_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null unique references public.reviews (id) on delete cascade,
  author_id uuid not null references auth.users (id),
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger review_replies_updated_at before update on public.review_replies
  for each row execute function public.set_updated_at();

-- Keep clubs.avg_rating / rating_count fresh.
create or replace function public.refresh_club_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.club_id, old.club_id);
begin
  update public.clubs c
  set avg_rating = sub.avg, rating_count = sub.cnt
  from (
    select round(avg(rating)::numeric, 2) as avg, count(*) as cnt
    from public.reviews
    where club_id = target and status = 'published'
  ) sub
  where c.id = target;
  return null;
end;
$$;

create trigger reviews_refresh_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_club_rating();

create table public.recently_viewed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  club_id uuid references public.clubs (id) on delete cascade,
  event_id uuid references public.events (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  constraint recently_viewed_target check (
    (club_id is not null)::int + (event_id is not null)::int = 1
  ),
  unique (user_id, club_id, event_id)
);
create index recently_viewed_user_idx
  on public.recently_viewed (user_id, viewed_at desc);
