-- Realtime on live-pricing tables + scheduled jobs. Both are written
-- defensively so the migration also applies on plain Postgres (tests, CI)
-- where the supabase_realtime publication and pg_cron may not exist.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.products;
    alter publication supabase_realtime add table public.price_overrides;
    alter publication supabase_realtime add table public.nights;
  end if;
end;
$$;

-- pg_cron jobs (Supabase: enable the pg_cron extension in the dashboard, or
-- this block schedules them when available).
do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron unavailable; skipping job scheduling (%: %)', sqlstate, sqlerrm;
    return;
  end;

  perform cron.schedule(
    'expire-stale-holds', '* * * * *',
    $job$ select public.expire_stale_holds(); $job$
  );
  perform cron.schedule(
    'apply-price-rules', '* * * * *',
    $job$ select public.apply_due_price_rules(); $job$
  );
end;
$$;
