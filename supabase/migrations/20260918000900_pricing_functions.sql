-- The single source of truth for prices and availability. Both the UI and
-- checkout call these; they can never disagree.

-- Effective price resolution, highest priority first:
--   1. date-specific override (price_overrides)
--   2. day-of-week + time rule (price_rules), latest start_time that has
--      passed for that date wins
--   3. base_price
-- Event tiers are products themselves, so a tier's base_price is priority 1
-- for that tier (tier switching updates base_price via reason 'tier_switch').
create or replace function public.effective_price(
  p_product_id uuid,
  p_date date,
  p_at timestamptz default now()
)
returns bigint
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_price bigint;
  v_dow int := extract(dow from p_date)::int;
  v_time time := (p_at at time zone 'Asia/Kolkata')::time;
begin
  select price into v_price
  from public.price_overrides
  where product_id = p_product_id and on_date = p_date;
  if found then
    return v_price;
  end if;

  -- Rules only apply to "tonight": for future dates the rule set can't know
  -- the clock yet, so time-of-day rules kick in on the night itself.
  if p_date = (p_at at time zone 'Asia/Kolkata')::date then
    select price into v_price
    from public.price_rules
    where product_id = p_product_id
      and is_active
      and v_dow = any (days_of_week)
      and start_time <= v_time
    order by start_time desc
    limit 1;
    if found then
      return v_price;
    end if;
  end if;

  select base_price into v_price
  from public.products
  where id = p_product_id;
  return v_price;
end;
$$;

-- Available quantity = capacity − confirmed order items − unexpired holds.
create or replace function public.available_quantity(
  p_product_id uuid,
  p_date date
)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    0,
    (select capacity_per_night from public.products where id = p_product_id)
    - coalesce((
        select sum(oi.quantity)
        from public.order_items oi
        join public.orders o on o.id = oi.order_id
        where oi.product_id = p_product_id
          and oi.night_date = p_date
          and o.status in ('paid', 'partially_refunded')
      ), 0)
    - coalesce((
        select sum(h.quantity)
        from public.inventory_holds h
        where h.product_id = p_product_id
          and h.night_date = p_date
          and h.expires_at > now()
      ), 0)
  )::int;
$$;

-- Atomically place a hold, preventing overselling under concurrency.
-- Serialises per product+night via advisory xact lock, re-checks
-- availability inside the lock, then inserts the hold. Returns the hold id
-- or raises 'sold_out'.
create or replace function public.place_hold(
  p_product_id uuid,
  p_date date,
  p_quantity int,
  p_order_id uuid,
  p_table_id uuid default null,
  p_hold_minutes int default 10
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available int;
  v_hold_id uuid;
begin
  if p_quantity <= 0 then
    raise exception 'invalid_quantity';
  end if;

  -- One lock per product+night: concurrent checkouts for the same inventory
  -- queue here instead of double-selling the last ticket.
  perform pg_advisory_xact_lock(
    hashtext(p_product_id::text || ':' || p_date::text)
  );

  -- Tables are exclusive: any active hold or paid booking blocks the table.
  if p_table_id is not null then
    if exists (
      select 1 from public.inventory_holds h
      where h.table_id = p_table_id
        and h.night_date = p_date
        and h.expires_at > now()
    ) or exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.table_id = p_table_id
        and oi.night_date = p_date
        and o.status in ('paid', 'partially_refunded')
    ) then
      raise exception 'sold_out';
    end if;
  end if;

  v_available := public.available_quantity(p_product_id, p_date);
  if v_available < p_quantity then
    raise exception 'sold_out';
  end if;

  insert into public.inventory_holds
    (product_id, night_date, table_id, quantity, order_id, expires_at)
  values
    (p_product_id, p_date, p_table_id, p_quantity,
     p_order_id, now() + make_interval(mins => p_hold_minutes))
  returning id into v_hold_id;

  return v_hold_id;
end;
$$;

-- Called by pg_cron every minute: expire stale holds and their orders.
create or replace function public.expire_stale_holds()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  update public.orders o
  set status = 'expired'
  where o.status = 'pending_payment'
    and o.hold_expires_at is not null
    and o.hold_expires_at < now();

  delete from public.inventory_holds where expires_at < now();
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Called by pg_cron each minute: apply due scheduled price rules by writing
-- base_price (history reason 'rule' recorded by the products trigger).
create or replace function public.apply_due_price_rules()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n int := 0;
  v_now_ist timestamptz := now();
  v_dow int := extract(dow from (now() at time zone 'Asia/Kolkata'))::int;
  v_time time := (now() at time zone 'Asia/Kolkata')::time;
begin
  for r in
    select pr.product_id, pr.price
    from public.price_rules pr
    join public.products p on p.id = pr.product_id
    where pr.is_active
      and v_dow = any (pr.days_of_week)
      -- fire in the minute the rule starts
      and pr.start_time <= v_time
      and pr.start_time > v_time - interval '1 minute'
      and p.base_price <> pr.price
  loop
    perform set_config('thirtyml.price_change_reason', 'rule', true);
    update public.products set base_price = r.price where id = r.product_id;
    n := n + 1;
  end loop;
  return n;
end;
$$;
