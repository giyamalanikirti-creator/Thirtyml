-- Row Level Security. RLS is enabled on EVERY table. The service role
-- (server code only) bypasses RLS; admin writes happen through it after a
-- role check and are recorded in audit_logs. Tables with no policies below
-- are therefore service-role-only (payments, webhooks, payouts, settings…).

-- Enable everywhere ----------------------------------------------------------
do $$
declare
  t record;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end;
$$;

-- Public read: the browsable catalogue --------------------------------------
create policy cities_public_read on public.cities
  for select using (is_active);

create policy areas_public_read on public.areas
  for select using (true);

create policy amenities_public_read on public.amenities for select using (true);
create policy genres_public_read on public.genres for select using (true);

create policy clubs_public_read on public.clubs
  for select using (
    status = 'approved'
    or public.is_club_member(id)
    or public.is_super_admin()
  );

create policy club_hours_public_read on public.club_hours
  for select using (
    exists (select 1 from public.clubs c
            where c.id = club_id
              and (c.status = 'approved' or public.is_club_member(c.id)))
  );

create policy club_photos_public_read on public.club_photos
  for select using (
    exists (select 1 from public.clubs c
            where c.id = club_id
              and (c.status = 'approved' or public.is_club_member(c.id)))
  );

create policy club_amenities_public_read on public.club_amenities
  for select using (true);
create policy club_genres_public_read on public.club_genres
  for select using (true);

create policy events_public_read on public.events
  for select using (
    status = 'published'
    or public.is_club_member(club_id)
    or public.is_super_admin()
  );

create policy event_lineup_public_read on public.event_lineup
  for select using (
    exists (select 1 from public.events e
            where e.id = event_id
              and (e.status = 'published' or public.is_club_member(e.club_id)))
  );

create policy products_public_read on public.products
  for select using (
    (is_active and exists (select 1 from public.clubs c
                           where c.id = club_id and c.status = 'approved'))
    or public.is_club_member(club_id)
  );

create policy price_overrides_public_read on public.price_overrides
  for select using (
    exists (select 1 from public.products p
            join public.clubs c on c.id = p.club_id
            where p.id = product_id
              and (c.status = 'approved' or public.is_club_member(c.id)))
  );

create policy nights_public_read on public.nights
  for select using (
    exists (select 1 from public.clubs c
            where c.id = club_id
              and (c.status = 'approved' or public.is_club_member(c.id)))
  );

create policy floor_plans_public_read on public.floor_plans
  for select using (
    exists (select 1 from public.clubs c
            where c.id = club_id
              and (c.status = 'approved' or public.is_club_member(c.id)))
  );

create policy tables_public_read on public.tables
  for select using (
    exists (select 1 from public.floor_plans f
            join public.clubs c on c.id = f.club_id
            where f.id = floor_plan_id
              and (c.status = 'approved' or public.is_club_member(c.id)))
  );

create policy collections_public_read on public.collections
  for select using (is_active);
create policy collection_items_public_read on public.collection_items
  for select using (
    exists (select 1 from public.collections cl
            where cl.id = collection_id and cl.is_active)
  );
create policy banners_public_read on public.banners
  for select using (is_active);
create policy help_articles_public_read on public.help_articles
  for select using (is_published);

create policy reviews_public_read on public.reviews
  for select using (status = 'published' or user_id = auth.uid()
                    or public.is_club_member(club_id));
create policy review_photos_public_read on public.review_photos
  for select using (
    exists (select 1 from public.reviews r
            where r.id = review_id
              and (r.status = 'published' or r.user_id = auth.uid()))
  );
create policy review_replies_public_read on public.review_replies
  for select using (true);

-- Profiles: own row only -----------------------------------------------------
create policy profiles_own_read on public.profiles
  for select using (id = auth.uid());
create policy profiles_own_update on public.profiles
  for update using (id = auth.uid())
  -- role changes go through the service role only
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- Customer-owned data --------------------------------------------------------
create policy carts_own on public.carts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy cart_items_own on public.cart_items
  for all using (
    exists (select 1 from public.carts c
            where c.id = cart_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.carts c
            where c.id = cart_id and c.user_id = auth.uid())
  );

create policy orders_own_read on public.orders
  for select using (user_id = auth.uid());

create policy order_items_own_read on public.order_items
  for select using (
    exists (select 1 from public.orders o
            where o.id = order_id and o.user_id = auth.uid())
    or public.is_club_member(club_id)
  );

create policy bookings_read on public.bookings
  for select using (
    user_id = auth.uid()
    or public.is_club_member(club_id)
  );

create policy booking_guests_read on public.booking_guests
  for select using (
    exists (select 1 from public.bookings b
            where b.id = booking_id
              and (b.user_id = auth.uid() or public.is_club_member(b.club_id)))
  );

create policy tickets_read on public.tickets
  for select using (
    exists (select 1 from public.bookings b
            where b.id = booking_id
              and (b.user_id = auth.uid() or public.is_club_member(b.club_id)))
  );

create policy check_ins_read on public.check_ins
  for select using (
    exists (select 1 from public.tickets t
            join public.bookings b on b.id = t.booking_id
            where t.id = ticket_id
              and (b.user_id = auth.uid() or public.is_club_member(b.club_id)))
  );

create policy payments_own_read on public.payments
  for select using (
    exists (select 1 from public.orders o
            where o.id = order_id and o.user_id = auth.uid())
  );

create policy refunds_own_read on public.refunds
  for select using (
    exists (select 1 from public.orders o
            where o.id = order_id and o.user_id = auth.uid())
  );

create policy invoices_own_read on public.invoices
  for select using (
    exists (select 1 from public.orders o
            where o.id = order_id and o.user_id = auth.uid())
  );

create policy wallet_own_read on public.wallet_ledger
  for select using (user_id = auth.uid());

create policy coupon_redemptions_own_read on public.coupon_redemptions
  for select using (user_id = auth.uid());

create policy coupons_public_read on public.coupons
  for select using (is_active or public.is_super_admin()
                    or (club_id is not null and public.is_club_member(club_id)));

create policy referrals_own_read on public.referrals
  for select using (referrer_id = auth.uid() or referee_id = auth.uid());

create policy favorites_own on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy price_alerts_own on public.price_alerts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy waitlist_own on public.waitlist_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy recently_viewed_own on public.recently_viewed
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Reviews: only the author writes; eligibility (checked-in booking) is
-- enforced here too so the client cannot bypass it.
create policy reviews_insert_own on public.reviews
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.user_id = auth.uid()
        and b.status = 'checked_in'
        and b.club_id = reviews.club_id
    )
  );
create policy reviews_update_own on public.reviews
  for update using (user_id = auth.uid() and status <> 'hidden')
  with check (user_id = auth.uid());

create policy review_photos_insert_own on public.review_photos
  for insert with check (
    exists (select 1 from public.reviews r
            where r.id = review_id and r.user_id = auth.uid())
  );

-- Club replies: owner or manager
create policy review_replies_club_write on public.review_replies
  for insert with check (
    exists (select 1 from public.reviews r
            where r.id = review_id
              and public.is_club_member(r.club_id, array['owner', 'manager']))
  );
create policy review_replies_club_update on public.review_replies
  for update using (
    exists (select 1 from public.reviews r
            where r.id = review_id
              and public.is_club_member(r.club_id, array['owner', 'manager']))
  );

-- Notifications: recipient reads/marks read
create policy notifications_own_read on public.notifications
  for select using (user_id = auth.uid());
create policy notifications_own_mark_read on public.notifications
  for update using (user_id = auth.uid() and channel = 'in_app')
  with check (user_id = auth.uid());

create policy notification_prefs_own on public.notification_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Support: own tickets + support agents
create policy support_tickets_own on public.support_tickets
  for select using (user_id = auth.uid() or public.is_support_agent());
create policy support_tickets_insert on public.support_tickets
  for insert with check (user_id = auth.uid() or user_id is null);
create policy support_messages_own on public.support_messages
  for select using (
    exists (select 1 from public.support_tickets t
            where t.id = ticket_id
              and (t.user_id = auth.uid() or public.is_support_agent()))
  );
create policy support_messages_insert on public.support_messages
  for insert with check (
    exists (select 1 from public.support_tickets t
            where t.id = ticket_id
              and (t.user_id = auth.uid() or public.is_support_agent()))
  );

-- Partner applications & claims ----------------------------------------------
create policy partner_applications_own on public.partner_applications
  for select using (applicant_id = auth.uid() or public.is_super_admin());
create policy partner_applications_insert on public.partner_applications
  for insert with check (applicant_id = auth.uid() or applicant_id is null);

create policy club_claims_own on public.club_claims
  for select using (claimant_id = auth.uid() or public.is_super_admin());
create policy club_claims_insert on public.club_claims
  for insert with check (claimant_id = auth.uid());

-- Club member management: owners/managers manage their own club -------------
create policy club_members_read on public.club_members
  for select using (
    user_id = auth.uid() or public.is_club_member(club_id)
  );
create policy club_members_owner_write on public.club_members
  for insert with check (public.is_club_member(club_id, array['owner']));
create policy club_members_owner_update on public.club_members
  for update using (public.is_club_member(club_id, array['owner']));

-- Club data writes: owner/manager (door_staff and finance are read-only via
-- the read policies above; check-in writes go through the service role after
-- QR verification).
create policy clubs_member_update on public.clubs
  for update using (public.is_club_member(id, array['owner', 'manager']))
  with check (public.is_club_member(id, array['owner', 'manager']));

create policy club_hours_member_write on public.club_hours
  for all using (public.is_club_member(club_id, array['owner', 'manager']))
  with check (public.is_club_member(club_id, array['owner', 'manager']));

create policy club_photos_member_write on public.club_photos
  for all using (public.is_club_member(club_id, array['owner', 'manager']))
  with check (public.is_club_member(club_id, array['owner', 'manager']));

create policy club_amenities_member_write on public.club_amenities
  for all using (public.is_club_member(club_id, array['owner', 'manager']))
  with check (public.is_club_member(club_id, array['owner', 'manager']));

create policy club_genres_member_write on public.club_genres
  for all using (public.is_club_member(club_id, array['owner', 'manager']))
  with check (public.is_club_member(club_id, array['owner', 'manager']));

create policy products_member_write on public.products
  for all using (public.is_club_member(club_id, array['owner', 'manager']))
  with check (public.is_club_member(club_id, array['owner', 'manager']));

create policy price_overrides_member_write on public.price_overrides
  for all using (
    exists (select 1 from public.products p where p.id = product_id
            and public.is_club_member(p.club_id, array['owner', 'manager']))
  ) with check (
    exists (select 1 from public.products p where p.id = product_id
            and public.is_club_member(p.club_id, array['owner', 'manager']))
  );

create policy price_rules_member_all on public.price_rules
  for all using (
    exists (select 1 from public.products p where p.id = product_id
            and public.is_club_member(p.club_id, array['owner', 'manager']))
  ) with check (
    exists (select 1 from public.products p where p.id = product_id
            and public.is_club_member(p.club_id, array['owner', 'manager']))
  );

create policy price_rules_public_read on public.price_rules
  for select using (
    exists (select 1 from public.products p
            join public.clubs c on c.id = p.club_id
            where p.id = product_id and c.status = 'approved')
  );

create policy price_history_member_read on public.price_history
  for select using (
    exists (select 1 from public.products p where p.id = product_id
            and public.is_club_member(p.club_id))
  );

create policy nights_member_write on public.nights
  for all using (public.is_club_member(club_id, array['owner', 'manager']))
  with check (public.is_club_member(club_id, array['owner', 'manager']));

create policy floor_plans_member_write on public.floor_plans
  for all using (public.is_club_member(club_id, array['owner', 'manager']))
  with check (public.is_club_member(club_id, array['owner', 'manager']));

create policy tables_member_write on public.tables
  for all using (
    exists (select 1 from public.floor_plans f where f.id = floor_plan_id
            and public.is_club_member(f.club_id, array['owner', 'manager']))
  ) with check (
    exists (select 1 from public.floor_plans f where f.id = floor_plan_id
            and public.is_club_member(f.club_id, array['owner', 'manager']))
  );

create policy events_member_write on public.events
  for all using (public.is_club_member(club_id, array['owner', 'manager']))
  with check (public.is_club_member(club_id, array['owner', 'manager']));

create policy event_lineup_member_write on public.event_lineup
  for all using (
    exists (select 1 from public.events e where e.id = event_id
            and public.is_club_member(e.club_id, array['owner', 'manager']))
  ) with check (
    exists (select 1 from public.events e where e.id = event_id
            and public.is_club_member(e.club_id, array['owner', 'manager']))
  );

-- Club coupons: owner/manager create within admin limits (enforced in app)
create policy coupons_club_write on public.coupons
  for insert with check (
    funded_by = 'club' and club_id is not null
    and public.is_club_member(club_id, array['owner', 'manager'])
  );
create policy coupons_club_update on public.coupons
  for update using (
    funded_by = 'club' and club_id is not null
    and public.is_club_member(club_id, array['owner', 'manager'])
  );

-- Payout visibility: owner + finance only
create policy payout_accounts_member_read on public.payout_accounts
  for select using (public.is_club_member(club_id, array['owner', 'finance']));
create policy payouts_member_read on public.payouts
  for select using (public.is_club_member(club_id, array['owner', 'finance']));
create policy settlement_lines_member_read on public.settlement_lines
  for select using (
    exists (select 1 from public.payouts p where p.id = payout_id
            and public.is_club_member(p.club_id, array['owner', 'finance']))
  );

-- No policies (service-role only): orders/bookings/tickets writes, payments,
-- webhook_events, refunds writes, invoices writes, invoice_counters,
-- inventory_holds, wallet_ledger writes, referrals writes, audit_logs,
-- platform_settings, feature_flags, notifications writes.
