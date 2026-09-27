-- Core: profiles, cities/areas, clubs and their descriptive satellites.

-- profiles -------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer'
    check (role in ('customer', 'club_staff', 'super_admin', 'support_agent')),
  full_name text,
  phone text,
  email text,
  phone_verified_at timestamptz,
  email_verified_at timestamptz,
  date_of_birth date,
  gender text check (gender in ('woman', 'man', 'nonbinary', 'prefer_not_to_say')),
  home_city_id uuid,
  referral_code text unique default encode(gen_random_bytes(6), 'hex'),
  referred_by uuid references auth.users (id),
  -- soft delete: personal fields are anonymised, row kept for financial records
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Every new auth user gets a profile row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, phone, full_name)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- cities & areas -------------------------------------------------------------
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  state text not null,
  lat double precision not null,
  lng double precision not null,
  -- legal drinking age context differs by state; informational default
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger cities_updated_at before update on public.cities
  for each row execute function public.set_updated_at();

alter table public.profiles
  add constraint profiles_home_city_fk
  foreign key (home_city_id) references public.cities (id);

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete cascade,
  slug text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (city_id, slug)
);
create index areas_city_idx on public.areas (city_id);

-- clubs ----------------------------------------------------------------------
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id),
  area_id uuid references public.areas (id),
  slug text not null,
  name text not null,
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'pending_approval', 'approved', 'suspended')),
  -- demo listings created by admin before the club signs up
  is_claimed boolean not null default false,
  is_featured boolean not null default false,
  lat double precision,
  lng double precision,
  address text,
  website_url text,
  instagram_url text,
  phone text,
  dress_code text,
  min_age int not null default 21,
  house_rules text,
  -- cancellation policy defaults per product type, overridable in settings
  cancellation_policy jsonb not null default '{}'::jsonb,
  booking_cutoff_minutes int not null default 60,
  requires_guest_names boolean not null default false,
  commission_bps int,          -- per-club override of platform commission
  convenience_fee_override jsonb,
  avg_rating numeric(3, 2),
  rating_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_id, slug)
);
create index clubs_city_idx on public.clubs (city_id);
create index clubs_area_idx on public.clubs (area_id);
create index clubs_status_idx on public.clubs (status);
create index clubs_name_trgm_idx on public.clubs using gin (name gin_trgm_ops);
create trigger clubs_updated_at before update on public.clubs
  for each row execute function public.set_updated_at();

create table public.club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'door_staff', 'finance')),
  invited_by uuid references auth.users (id),
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (club_id, user_id)
);
create index club_members_user_idx on public.club_members (user_id);
create index club_members_club_idx on public.club_members (club_id);

create table public.club_hours (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0 = Sunday
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  unique (club_id, day_of_week)
);
create index club_hours_club_idx on public.club_hours (club_id);

create table public.club_photos (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  storage_path text not null,
  alt text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index club_photos_club_idx on public.club_photos (club_id);

create table public.amenities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon text
);

create table public.club_amenities (
  club_id uuid not null references public.clubs (id) on delete cascade,
  amenity_id uuid not null references public.amenities (id) on delete cascade,
  primary key (club_id, amenity_id)
);
create index club_amenities_amenity_idx on public.club_amenities (amenity_id);

create table public.genres (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null
);

create table public.club_genres (
  club_id uuid not null references public.clubs (id) on delete cascade,
  genre_id uuid not null references public.genres (id) on delete cascade,
  primary key (club_id, genre_id)
);
create index club_genres_genre_idx on public.club_genres (genre_id);
