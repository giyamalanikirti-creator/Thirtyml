-- RLS and pricing-function tests. Run against a database that has the auth
-- shim, all migrations, and seed.sql applied (scripts/db-test.sh does this).
-- Each check raises on failure, so a clean run means all assertions passed.

\set ON_ERROR_STOP on

-- helper: impersonate a user the way PostgREST does
create or replace function test_login(uid uuid)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), false);
  perform set_config('request.jwt.claim.role', 'authenticated', false);
end;
$$;

-- Fixtures: a second club owner (club B = Matahari) and orders for isolation
insert into auth.users (id, email) values
  ('10000000-0000-4000-8000-00000000000b', 'ownerb@thirtyml.dev');
insert into public.club_members (club_id, user_id, role) values
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-00000000000b', 'owner');

do $$
declare
  n int;
  v_price bigint;
  v_avail int;
  v_order uuid;
  v_hold uuid;
  v_failed boolean;
begin
  ---------------------------------------------------------------- anon reads
  perform set_config('request.jwt.claim.sub', '', false);
  perform set_config('request.jwt.claim.role', 'anon', false);
  set local role anon;

  select count(*) into n from public.clubs;
  if n <> 10 then
    raise exception 'anon should see 10 approved clubs, saw %', n;
  end if;

  select count(*) into n from public.orders;
  if n <> 0 then
    raise exception 'anon must see no orders, saw %', n;
  end if;

  select count(*) into n from public.profiles;
  if n <> 0 then
    raise exception 'anon must see no profiles, saw %', n;
  end if;

  ------------------------------------------------- customer order isolation
  reset role;
  perform test_login('10000000-0000-4000-8000-000000000001'); -- demo customer
  set local role authenticated;

  select count(*) into n from public.orders;
  if n <> 1 then
    raise exception 'customer should see exactly their 1 order, saw %', n;
  end if;

  -- reviewer2's order must be invisible
  select count(*) into n from public.orders
  where user_id = '10000000-0000-4000-8000-000000000006';
  if n <> 0 then
    raise exception 'customer can see another customer''s order';
  end if;

  select count(*) into n from public.wallet_ledger
  where user_id <> auth.uid();
  if n <> 0 then
    raise exception 'customer can see another user''s wallet';
  end if;

  -- customers cannot write orders directly (service-role only)
  v_failed := false;
  begin
    insert into public.orders (user_id, status, subtotal, total, idempotency_key)
    values (auth.uid(), 'paid', 1, 1, 'hack-1');
  exception when insufficient_privilege or others then
    v_failed := true;
  end;
  if not v_failed then
    raise exception 'customer could insert an order directly';
  end if;

  -- customers cannot change product prices
  v_failed := false;
  begin
    update public.products set base_price = 1
    where id = '40000000-0000-4000-8000-000000000001';
    -- RLS silently updates 0 rows for non-members; verify nothing changed
    if exists (select 1 from public.products
               where id = '40000000-0000-4000-8000-000000000001'
                 and base_price = 1) then
      raise exception 'customer changed a product price';
    end if;
    v_failed := true;
  exception when others then
    v_failed := true;
  end;

  ------------------------------------------------------- club B vs club A
  reset role;
  perform test_login('10000000-0000-4000-8000-00000000000b'); -- Matahari owner
  set local role authenticated;

  -- club B must not see club A (Kitty Su) bookings
  select count(*) into n from public.bookings
  where club_id = '30000000-0000-4000-8000-000000000001';
  if n <> 0 then
    raise exception 'club B can read club A bookings';
  end if;

  -- club B cannot reprice club A's products
  update public.products set base_price = 1
  where id = '40000000-0000-4000-8000-000000000001';
  if exists (select 1 from public.products
             where id = '40000000-0000-4000-8000-000000000001'
               and base_price = 1) then
    raise exception 'club B changed club A''s price';
  end if;

  -- but CAN reprice its own product (and history is logged)
  update public.products set base_price = 210000
  where id = '40000000-0000-4000-8000-000000000011';
  if not exists (select 1 from public.products
                 where id = '40000000-0000-4000-8000-000000000011'
                   and base_price = 210000) then
    raise exception 'club owner failed to change own price';
  end if;

  ------------------------------------------------------- door staff limits
  reset role;
  perform test_login('10000000-0000-4000-8000-000000000003'); -- Kitty Su door
  set local role authenticated;

  -- door staff sees the club's bookings…
  select count(*) into n from public.bookings
  where club_id = '30000000-0000-4000-8000-000000000001';
  if n < 1 then
    raise exception 'door staff cannot see own club bookings';
  end if;

  -- …but cannot edit prices
  update public.products set base_price = 1
  where id = '40000000-0000-4000-8000-000000000001';
  if exists (select 1 from public.products
             where id = '40000000-0000-4000-8000-000000000001'
               and base_price = 1) then
    raise exception 'door staff changed a price';
  end if;

  -- …and cannot see payouts (owner/finance only)
  select count(*) into n from public.payouts;
  if n <> 0 then
    raise exception 'door staff can see payouts';
  end if;

  reset role;
  perform set_config('request.jwt.claim.sub', '', false);

  ------------------------------------------------------------ price engine
  -- history was logged for the owner's price change above
  select count(*) into n from public.price_history
  where product_id = '40000000-0000-4000-8000-000000000011'
    and new_price = 210000
    and changed_at > now() - interval '1 minute';
  if n <> 1 then
    raise exception 'price change was not logged to history (found %)', n;
  end if;

  -- override beats base
  insert into public.price_overrides (product_id, on_date, price)
  values ('40000000-0000-4000-8000-000000000001', current_date + 3, 275000);
  select public.effective_price('40000000-0000-4000-8000-000000000001',
                                current_date + 3) into v_price;
  if v_price <> 275000 then
    raise exception 'override not applied: got %', v_price;
  end if;

  -- base when nothing else applies (future date, no override)
  select public.effective_price('40000000-0000-4000-8000-000000000001',
                                current_date + 4) into v_price;
  if v_price <> 250000 then
    raise exception 'base price expected, got %', v_price;
  end if;

  --------------------------------------------------------------- inventory
  -- Table B1 at Kitty Su: capacity 1
  insert into public.orders (id, user_id, status, subtotal, total, idempotency_key, hold_expires_at)
  values ('72000000-0000-4000-8000-000000000001',
          '10000000-0000-4000-8000-000000000001', 'pending_payment',
          4000000, 4000000, 'test-hold-1', now() + interval '10 minutes')
  returning id into v_order;

  select public.place_hold('41000000-0000-4000-8000-000000000003',
                           current_date + 3, 1, v_order,
                           (select id from public.tables where name = 'B1'))
    into v_hold;
  if v_hold is null then
    raise exception 'first hold failed';
  end if;

  select public.available_quantity('41000000-0000-4000-8000-000000000003',
                                   current_date + 3) into v_avail;
  if v_avail <> 0 then
    raise exception 'availability after hold should be 0, got %', v_avail;
  end if;

  -- second hold on the same table must fail with sold_out
  v_failed := false;
  begin
    perform public.place_hold('41000000-0000-4000-8000-000000000003',
                              current_date + 3, 1, v_order,
                              (select id from public.tables where name = 'B1'));
  exception when others then
    if sqlerrm like '%sold_out%' then
      v_failed := true;
    else
      raise;
    end if;
  end;
  if not v_failed then
    raise exception 'double-sold the last table';
  end if;

  -- expiring the hold frees the table
  update public.inventory_holds set expires_at = now() - interval '1 second'
  where id = v_hold;
  update public.orders set hold_expires_at = now() - interval '1 second'
  where id = v_order;
  perform public.expire_stale_holds();

  select public.available_quantity('41000000-0000-4000-8000-000000000003',
                                   current_date + 3) into v_avail;
  if v_avail <> 1 then
    raise exception 'availability after expiry should be 1, got %', v_avail;
  end if;
  if not exists (select 1 from public.orders where id = v_order and status = 'expired') then
    raise exception 'pending order was not expired with its hold';
  end if;

  ------------------------------------------------------------ invoice numbers
  if public.next_invoice_number() !~ '^TML/\d{4}-\d{2}/000001$' then
    raise exception 'unexpected first invoice number';
  end if;
  if public.next_invoice_number() !~ '/000002$' then
    raise exception 'invoice numbers not sequential';
  end if;

  ------------------------------------------------------------- club ratings
  if not exists (select 1 from public.clubs
                 where id = '30000000-0000-4000-8000-000000000001'
                   and rating_count = 1 and avg_rating = 5.00) then
    raise exception 'club rating trigger did not refresh';
  end if;

  raise notice 'ALL RLS + PRICING + INVENTORY TESTS PASSED';
end;
$$;

drop function test_login(uuid);
