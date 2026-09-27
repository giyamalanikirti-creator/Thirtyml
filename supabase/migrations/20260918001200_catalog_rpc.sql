-- Read-side RPCs for the storefront. All prices come from effective_price so
-- the UI and checkout can never disagree.

-- Live prices + availability for a set of products on a date. Used by the
-- club page, event page, cart and the realtime price hook.
create or replace function public.catalog_prices(
  p_product_ids uuid[],
  p_date date
)
returns table (
  product_id uuid,
  price bigint,
  price_updated_at timestamptz,
  available int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    public.effective_price(p.id, p_date),
    p.price_updated_at,
    public.available_quantity(p.id, p_date)
  from public.products p
  where p.id = any (p_product_ids);
$$;

-- The city price board: per approved club, tonight's headline entry prices
-- (lowest-priced stag-ish and couple-ish products) for the home page/map.
create or replace function public.city_price_board(
  p_city_slug text,
  p_date date
)
returns table (
  club_id uuid,
  club_slug text,
  club_name text,
  area_name text,
  lat double precision,
  lng double precision,
  min_price bigint,
  price_updated_at timestamptz,
  is_open boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.slug,
    c.name,
    a.name,
    c.lat,
    c.lng,
    min(public.effective_price(p.id, p_date)),
    max(p.price_updated_at),
    coalesce(
      (select n.is_open from public.nights n
       where n.club_id = c.id and n.on_date = p_date),
      true
    )
  from public.clubs c
  join public.cities ci on ci.id = c.city_id
  left join public.areas a on a.id = c.area_id
  join public.products p on p.club_id = c.id
    and p.type = 'entry' and p.is_active
  where ci.slug = p_city_slug
    and c.status = 'approved'
  group by c.id, c.slug, c.name, a.name, c.lat, c.lng
  order by min(public.effective_price(p.id, p_date));
$$;
