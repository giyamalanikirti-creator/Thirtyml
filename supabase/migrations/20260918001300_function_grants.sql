-- Functions that mutate state or leak cross-user data must not be callable
-- through the public API roles; only server code (service role) may run
-- them. Read-only price/availability lookups stay public.

revoke execute on function public.place_hold(uuid, date, int, uuid, uuid, int)
  from public, anon, authenticated;
revoke execute on function public.expire_stale_holds() from public, anon, authenticated;
revoke execute on function public.apply_due_price_rules() from public, anon, authenticated;
revoke execute on function public.next_invoice_number() from public, anon, authenticated;
revoke execute on function public.wallet_balance(uuid) from public, anon, authenticated;
