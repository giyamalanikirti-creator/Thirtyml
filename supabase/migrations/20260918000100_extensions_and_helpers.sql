-- Extensions and shared helpers. One concern per migration; this one sets up
-- what every later migration relies on.

create extension if not exists pgcrypto;      -- gen_random_uuid, crypt (seed)
create extension if not exists pg_trgm;       -- search on names/areas

-- updated_at maintenance -----------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Role helpers used by RLS policies ------------------------------------------
-- profiles/club_members are created in later migrations; these are declared
-- here and referenced lazily (functions resolve tables at call time).

create or replace function public.current_role_is(target text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = target
  );
end;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_is('super_admin');
$$;

create or replace function public.is_support_agent()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_is('super_admin')
      or public.current_role_is('support_agent');
$$;

-- True when the signed-in user belongs to the club with one of the given
-- club-level roles (owner/manager/door_staff/finance). Empty array = any role.
create or replace function public.is_club_member(club uuid, roles text[] default '{}')
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.club_members m
    where m.club_id = club
      and m.user_id = auth.uid()
      and m.removed_at is null
      and (cardinality(roles) = 0 or m.role = any (roles))
  );
end;
$$;
