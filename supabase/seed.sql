-- ThirtyML seed data — DEV AND STAGING ONLY, never production.
--
-- Demo listings: addresses and coordinates are approximate and must be
-- verified; website/instagram left NULL for clubs to fill in after claiming.
-- Clubs are unclaimed (is_claimed = false) and show an "Unclaimed listing"
-- badge until a real club completes onboarding.
--
-- Demo accounts (password for all: ThirtyML-demo-1):
--   customer@thirtyml.dev  — customer
--   owner@thirtyml.dev     — club owner (Kitty Su)
--   door@thirtyml.dev      — door staff (Kitty Su)
--   admin@thirtyml.dev     — super_admin
--   support@thirtyml.dev   — support_agent

begin;

-- demo users ------------------------------------------------------------------
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000001',
   'authenticated', 'authenticated', 'customer@thirtyml.dev',
   crypt('ThirtyML-demo-1', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Customer"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000002',
   'authenticated', 'authenticated', 'owner@thirtyml.dev',
   crypt('ThirtyML-demo-1', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Owner"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000003',
   'authenticated', 'authenticated', 'door@thirtyml.dev',
   crypt('ThirtyML-demo-1', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Door Staff"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000004',
   'authenticated', 'authenticated', 'admin@thirtyml.dev',
   crypt('ThirtyML-demo-1', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Admin"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000005',
   'authenticated', 'authenticated', 'support@thirtyml.dev',
   crypt('ThirtyML-demo-1', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Support"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000006',
   'authenticated', 'authenticated', 'reviewer2@thirtyml.dev',
   crypt('ThirtyML-demo-1', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Ria K"}', now(), now());

update public.profiles set role = 'super_admin'
  where id = '10000000-0000-4000-8000-000000000004';
update public.profiles set role = 'support_agent'
  where id = '10000000-0000-4000-8000-000000000005';
update public.profiles set role = 'club_staff'
  where id in ('10000000-0000-4000-8000-000000000002',
               '10000000-0000-4000-8000-000000000003');
update public.profiles
  set date_of_birth = '1998-04-12', phone_verified_at = now(), email_verified_at = now()
  where id = '10000000-0000-4000-8000-000000000001';

-- cities & areas --------------------------------------------------------------
insert into public.cities (id, slug, name, state, lat, lng, sort_order) values
  ('20000000-0000-4000-8000-000000000001', 'mumbai', 'Mumbai', 'Maharashtra', 19.0760, 72.8777, 1),
  ('20000000-0000-4000-8000-000000000002', 'pune', 'Pune', 'Maharashtra', 18.5204, 73.8567, 2),
  ('20000000-0000-4000-8000-000000000003', 'agra', 'Agra', 'Uttar Pradesh', 27.1767, 78.0081, 3);

insert into public.areas (id, city_id, slug, name) values
  ('21000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'andheri-east', 'Andheri East'),
  ('21000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'worli', 'Worli'),
  ('21000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'khar-west', 'Khar West'),
  ('21000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', 'colaba', 'Colaba'),
  ('21000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000002', 'baner', 'Baner'),
  ('21000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000002', 'senapati-bapat-road', 'Senapati Bapat Road'),
  ('21000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000002', 'koregaon-park', 'Koregaon Park'),
  ('21000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000003', 'baluganj', 'Baluganj'),
  ('21000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000003', 'agra-central', 'Agra Central');

insert into public.amenities (slug, name, icon) values
  ('smoking-area', 'Smoking area', 'cigarette'),
  ('valet', 'Valet parking', 'car'),
  ('rooftop', 'Rooftop', 'sun'),
  ('live-music', 'Live music', 'music'),
  ('food', 'Kitchen open late', 'utensils'),
  ('couples-friendly', 'Couples friendly', 'heart');

insert into public.genres (slug, name) values
  ('bollywood', 'Bollywood'),
  ('techno', 'Techno'),
  ('edm', 'EDM'),
  ('hip-hop', 'Hip-hop'),
  ('commercial', 'Commercial'),
  ('house', 'House');

-- clubs (approximate coordinates; unclaimed demo listings) --------------------
insert into public.clubs
  (id, city_id, area_id, slug, name, description, status, is_claimed, lat, lng,
   address, min_age, dress_code) values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001',
   '21000000-0000-4000-8000-000000000001', 'kitty-su', 'Kitty Su',
   'The Lalit''s flagship club — international DJs, a serious sound system and Mumbai''s most eclectic crowd.',
   'approved', false, 19.1086, 72.8665, 'The Lalit, Andheri East, Mumbai', 21, 'Smart casual'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001',
   '21000000-0000-4000-8000-000000000002', 'matahari', 'Matahari',
   'Worli''s big-room club at Atria Mall — commercial and Bollywood nights with a large dance floor.',
   'approved', false, 18.9986, 72.8166, 'Atria Mall, Worli, Mumbai', 21, 'Smart casual'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001',
   '21000000-0000-4000-8000-000000000003', 'antisocial', 'AntiSocial',
   'Khar''s underground favourite — hip-hop, techno and live acts in a raw basement space.',
   'approved', false, 19.0700, 72.8360, 'Khar West, Mumbai', 21, 'Come as you are'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001',
   '21000000-0000-4000-8000-000000000004', 'polly-esthers', 'Polly Esther''s',
   'Retro-themed Colaba institution — disco balls, 80s and 90s classics, dance floor lit like a jukebox.',
   'approved', false, 18.9225, 72.8318, 'Colaba, Mumbai', 21, 'Casual'),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000002',
   '21000000-0000-4000-8000-000000000005', 'area-51', 'Area 51',
   'Baner''s warehouse-scale EDM and techno venue — big lineups, bigger drops.',
   'approved', false, 18.5640, 73.7870, 'Baner, Pune', 21, 'Smart casual'),
  ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000002',
   '21000000-0000-4000-8000-000000000006', 'mi-a-mi', 'Mi-A-Mi',
   'JW Marriott''s glossy rooftop club — house music, skyline views, dressed-up crowd.',
   'approved', false, 18.5323, 73.8298, 'JW Marriott, Senapati Bapat Road, Pune', 21, 'Dress to impress'),
  ('30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000002',
   '21000000-0000-4000-8000-000000000007', 'mix-at-36', 'Mix@36',
   'The Westin''s late-night lounge in Koregaon Park — commercial hits and cocktails.',
   'approved', false, 18.5390, 73.9030, 'The Westin, Koregaon Park, Pune', 21, 'Smart casual'),
  ('30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000003',
   '21000000-0000-4000-8000-000000000008', 'mansion-tapas-club', 'Mansion Tapas & Club',
   'Agra''s club-and-kitchen hybrid on Gwalior Road — tapas till late, Bollywood after dark.',
   'approved', false, 27.1720, 78.0120, 'Gwalior Road, Baluganj, Agra', 21, 'Casual'),
  -- TODO: verify address & coordinates for Beep and Molecule (placeholders)
  ('30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000003',
   '21000000-0000-4000-8000-000000000009', 'beep', 'Beep',
   'High-energy commercial nights in central Agra.',
   'approved', false, 27.1767, 78.0081, 'Agra (address to be verified)', 21, 'Casual'),
  ('30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000003',
   '21000000-0000-4000-8000-000000000009', 'molecule', 'Molecule',
   'Brewpub-style venue with weekend DJ nights.',
   'approved', false, 27.1767, 78.0081, 'Agra (address to be verified)', 21, 'Casual');

-- demo team at Kitty Su
insert into public.club_members (club_id, user_id, role) values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'owner'),
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'door_staff');

-- hours: Wed–Sun 21:00–01:30 for everyone (Mon/Tue closed)
insert into public.club_hours (club_id, day_of_week, opens_at, closes_at, is_closed)
select c.id, d, case when d in (1, 2) then null else time '21:00' end,
       case when d in (1, 2) then null else time '01:30' end,
       d in (1, 2)
from public.clubs c, generate_series(0, 6) d;

-- genres & amenities (rough)
insert into public.club_genres (club_id, genre_id)
select c.id, g.id from public.clubs c
join public.genres g on (
  (c.slug = 'kitty-su' and g.slug in ('techno', 'edm', 'house')) or
  (c.slug = 'matahari' and g.slug in ('bollywood', 'commercial')) or
  (c.slug = 'antisocial' and g.slug in ('hip-hop', 'techno')) or
  (c.slug = 'polly-esthers' and g.slug in ('commercial')) or
  (c.slug = 'area-51' and g.slug in ('edm', 'techno')) or
  (c.slug = 'mi-a-mi' and g.slug in ('house', 'commercial')) or
  (c.slug = 'mix-at-36' and g.slug in ('commercial', 'bollywood')) or
  (c.slug = 'mansion-tapas-club' and g.slug in ('bollywood', 'commercial')) or
  (c.slug = 'beep' and g.slug in ('commercial')) or
  (c.slug = 'molecule' and g.slug in ('commercial', 'edm'))
);

insert into public.club_amenities (club_id, amenity_id)
select c.id, a.id from public.clubs c
join public.amenities a on a.slug in ('smoking-area', 'couples-friendly')
where c.slug in ('kitty-su', 'matahari', 'area-51', 'mi-a-mi', 'mansion-tapas-club');

-- entry products --------------------------------------------------------------
-- Mumbai/Pune pricier than Agra. Early bird products model "before 10 pm".
insert into public.products
  (id, club_id, type, name, description, base_price, capacity_per_night,
   max_per_order, cover_redeemable, sort_order)
select * from (values
  -- Kitty Su
  ('40000000-0000-4000-8000-000000000001'::uuid, '30000000-0000-4000-8000-000000000001'::uuid,
   'entry', 'Stag entry', 'Full cover redeemable against food & drinks', 250000::bigint, 150, 6, true, 1),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001',
   'entry', 'Couple entry', null, 350000, 80, 4, true, 2),
  ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001',
   'entry', 'Ladies entry', null, 50000, 100, 6, false, 3),
  ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000001',
   'entry', 'Early bird (before 10 pm)', '35% off, entry before 10 pm', 160000, 50, 6, false, 4),
  -- Matahari
  ('40000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000002',
   'entry', 'Stag entry', null, 200000, 120, 6, true, 1),
  ('40000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000002',
   'entry', 'Couple entry', null, 300000, 70, 4, true, 2),
  ('40000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000002',
   'entry', 'Ladies entry', null, 0, 80, 6, false, 3),
  -- AntiSocial
  ('40000000-0000-4000-8000-000000000021', '30000000-0000-4000-8000-000000000003',
   'entry', 'Stag entry', null, 150000, 200, 8, false, 1),
  ('40000000-0000-4000-8000-000000000022', '30000000-0000-4000-8000-000000000003',
   'entry', 'Couple entry', null, 250000, 100, 4, false, 2),
  ('40000000-0000-4000-8000-000000000023', '30000000-0000-4000-8000-000000000003',
   'entry', 'Early bird (before 10 pm)', null, 90000, 60, 8, false, 3),
  -- Polly Esther's
  ('40000000-0000-4000-8000-000000000031', '30000000-0000-4000-8000-000000000004',
   'entry', 'Stag entry', null, 180000, 100, 6, true, 1),
  ('40000000-0000-4000-8000-000000000032', '30000000-0000-4000-8000-000000000004',
   'entry', 'Couple entry', null, 280000, 60, 4, true, 2),
  ('40000000-0000-4000-8000-000000000033', '30000000-0000-4000-8000-000000000004',
   'entry', 'Ladies entry', null, 0, 80, 6, false, 3),
  -- Area 51
  ('40000000-0000-4000-8000-000000000041', '30000000-0000-4000-8000-000000000005',
   'entry', 'Stag entry', null, 220000, 250, 8, true, 1),
  ('40000000-0000-4000-8000-000000000042', '30000000-0000-4000-8000-000000000005',
   'entry', 'Couple entry', null, 320000, 120, 4, true, 2),
  ('40000000-0000-4000-8000-000000000043', '30000000-0000-4000-8000-000000000005',
   'entry', 'Ladies entry', null, 60000, 120, 6, false, 3),
  ('40000000-0000-4000-8000-000000000044', '30000000-0000-4000-8000-000000000005',
   'entry', 'Early bird (before 10 pm)', null, 130000, 80, 8, false, 4),
  -- Mi-A-Mi
  ('40000000-0000-4000-8000-000000000051', '30000000-0000-4000-8000-000000000006',
   'entry', 'Stag entry', null, 280000, 100, 6, true, 1),
  ('40000000-0000-4000-8000-000000000052', '30000000-0000-4000-8000-000000000006',
   'entry', 'Couple entry', null, 400000, 60, 4, true, 2),
  ('40000000-0000-4000-8000-000000000053', '30000000-0000-4000-8000-000000000006',
   'entry', 'Ladies entry', null, 80000, 80, 6, false, 3),
  -- Mix@36
  ('40000000-0000-4000-8000-000000000061', '30000000-0000-4000-8000-000000000007',
   'entry', 'Stag entry', null, 200000, 90, 6, true, 1),
  ('40000000-0000-4000-8000-000000000062', '30000000-0000-4000-8000-000000000007',
   'entry', 'Couple entry', null, 300000, 50, 4, true, 2),
  -- Mansion Tapas & Club (Agra — lower)
  ('40000000-0000-4000-8000-000000000071', '30000000-0000-4000-8000-000000000008',
   'entry', 'Stag entry', null, 100000, 100, 6, true, 1),
  ('40000000-0000-4000-8000-000000000072', '30000000-0000-4000-8000-000000000008',
   'entry', 'Couple entry', null, 150000, 60, 4, true, 2),
  ('40000000-0000-4000-8000-000000000073', '30000000-0000-4000-8000-000000000008',
   'entry', 'Ladies entry', null, 0, 60, 6, false, 3),
  -- Beep
  ('40000000-0000-4000-8000-000000000081', '30000000-0000-4000-8000-000000000009',
   'entry', 'Stag entry', null, 80000, 80, 6, false, 1),
  ('40000000-0000-4000-8000-000000000082', '30000000-0000-4000-8000-000000000009',
   'entry', 'Couple entry', null, 120000, 50, 4, false, 2),
  -- Molecule
  ('40000000-0000-4000-8000-000000000091', '30000000-0000-4000-8000-000000000010',
   'entry', 'Stag entry', null, 90000, 80, 6, false, 1),
  ('40000000-0000-4000-8000-000000000092', '30000000-0000-4000-8000-000000000010',
   'entry', 'Couple entry', null, 140000, 50, 4, false, 2)
) as v(id, club_id, type, name, description, base_price, capacity_per_night,
       max_per_order, cover_redeemable, sort_order);

-- floor plans and tables for the larger clubs ---------------------------------
insert into public.floor_plans (id, club_id, name) values
  ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Main floor'),
  ('50000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000005', 'Warehouse floor'),
  ('50000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000006', 'Rooftop');

-- table products (capacity_per_night 1: a table sells once per night)
insert into public.products
  (id, club_id, type, name, base_price, capacity_per_night, max_per_order, sort_order)
values
  ('41000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001',
   'table', 'Table T1 (4 guests)', 1500000, 1, 1, 10),
  ('41000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001',
   'table', 'Table T2 (4 guests)', 1500000, 1, 1, 11),
  ('41000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001',
   'table', 'VIP booth B1 (8 guests)', 4000000, 1, 1, 12),
  ('41000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000005',
   'table', 'Table A1 (4 guests)', 1200000, 1, 1, 10),
  ('41000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000005',
   'table', 'VIP booth V1 (10 guests)', 3000000, 1, 1, 11),
  ('41000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000006',
   'table', 'Skyline table S1 (6 guests)', 2500000, 1, 1, 10);

insert into public.tables
  (floor_plan_id, product_id, name, x, y, shape, capacity, min_spend, deposit_bps, zone)
values
  ('50000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000001',
   'T1', 200, 150, 'round', 4, 1500000, 5000, 'dance floor'),
  ('50000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000002',
   'T2', 350, 150, 'round', 4, 1500000, 5000, 'dance floor'),
  ('50000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000003',
   'B1', 650, 120, 'booth', 8, 4000000, 5000, 'VIP'),
  ('50000000-0000-4000-8000-000000000002', '41000000-0000-4000-8000-000000000004',
   'A1', 250, 200, 'rect', 4, 1200000, 10000, 'main'),
  ('50000000-0000-4000-8000-000000000002', '41000000-0000-4000-8000-000000000005',
   'V1', 700, 150, 'booth', 10, 3000000, 5000, 'VIP'),
  ('50000000-0000-4000-8000-000000000003', '41000000-0000-4000-8000-000000000006',
   'S1', 400, 100, 'booth', 6, 2500000, 10000, 'terrace');

-- nights: open the next 14 nights for every club (respecting Mon/Tue closed)
insert into public.nights (club_id, on_date, is_open)
select c.id, d::date, extract(dow from d) not in (1, 2)
from public.clubs c,
     generate_series(current_date, current_date + 13, interval '1 day') d;

-- events with tiered tickets --------------------------------------------------
insert into public.events
  (id, club_id, slug, name, description, starts_at, ends_at, status) values
  ('60000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001',
   'warehouse-techno-night', 'Warehouse Techno Night',
   'A night of pounding techno with an international headliner.',
   (current_date + 9) + time '21:00', (current_date + 10) + time '01:30', 'published'),
  ('60000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003',
   'hip-hop-cypher', 'Hip-Hop Cypher',
   'Live cyphers, open decks and the city''s best hip-hop DJs.',
   (current_date + 5) + time '21:00', (current_date + 6) + time '01:00', 'published'),
  ('60000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000005',
   'bass-drop-festival', 'Bass Drop Festival',
   'Area 51''s biggest EDM night of the season.',
   (current_date + 11) + time '20:00', (current_date + 12) + time '01:30', 'published'),
  ('60000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000008',
   'bollywood-blockbuster-night', 'Bollywood Blockbuster Night',
   'All the hits, all night.',
   (current_date + 7) + time '21:00', (current_date + 8) + time '00:30', 'published');

insert into public.event_lineup (event_id, artist_name, genre, sort_order) values
  ('60000000-0000-4000-8000-000000000001', 'DJ Aurora', 'Techno', 1),
  ('60000000-0000-4000-8000-000000000001', 'Karan B2B Zeph', 'Techno', 2),
  ('60000000-0000-4000-8000-000000000002', 'MC Static', 'Hip-hop', 1),
  ('60000000-0000-4000-8000-000000000003', 'Voltage', 'EDM', 1),
  ('60000000-0000-4000-8000-000000000004', 'DJ Mannat', 'Bollywood', 1);

-- ticket tiers are products with event_id; phases via sales windows
insert into public.products
  (id, club_id, event_id, type, name, base_price, capacity_per_night,
   max_per_order, sales_start_at, sales_end_at, sort_order)
values
  ('42000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001',
   '60000000-0000-4000-8000-000000000001', 'event_ticket', 'Early bird', 99900, 100,
   6, now(), (current_date + 4)::timestamp, 1),
  ('42000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001',
   '60000000-0000-4000-8000-000000000001', 'event_ticket', 'Phase 1', 149900, 200,
   6, (current_date + 4)::timestamp, (current_date + 8)::timestamp, 2),
  ('42000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001',
   '60000000-0000-4000-8000-000000000001', 'event_ticket', 'VIP', 349900, 50,
   4, now(), (current_date + 9)::timestamp, 3),
  ('42000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000003',
   '60000000-0000-4000-8000-000000000002', 'event_ticket', 'General', 79900, 250,
   8, now(), (current_date + 5)::timestamp, 1),
  ('42000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000005',
   '60000000-0000-4000-8000-000000000003', 'event_ticket', 'Phase 1', 129900, 300,
   6, now(), (current_date + 6)::timestamp, 1),
  ('42000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000005',
   '60000000-0000-4000-8000-000000000003', 'event_ticket', 'Group of 4', 399900, 100,
   2, now(), (current_date + 6)::timestamp, 2),
  ('42000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000008',
   '60000000-0000-4000-8000-000000000004', 'event_ticket', 'General', 49900, 150,
   6, now(), (current_date + 7)::timestamp, 1);

-- a scheduled price rule example: Kitty Su Stag rises to ₹3,000 at 23:00 Sat
insert into public.price_rules (product_id, days_of_week, start_time, price)
values ('40000000-0000-4000-8000-000000000001', '{6}', '23:00', 300000);

-- price history for sparklines (7 daily points per entry product)
insert into public.price_history (product_id, old_price, new_price, reason, changed_at)
select p.id,
       p.base_price,
       greatest(0, p.base_price + (((d * 37) % 5) - 2) * 10000),
       'manual',
       now() - make_interval(days => 7 - d)
from public.products p, generate_series(1, 7) d
where p.type = 'entry';

-- coupons ---------------------------------------------------------------------
insert into public.coupons
  (code, description, discount_type, discount_value, max_discount,
   min_cart_value, per_user_limit, first_booking_only, city_id, is_active) values
  ('FIRSTNIGHT', '20% off your first night, up to ₹300', 'percent', 2000, 30000,
   50000, 1, true, null, true),
  ('AGRA100', 'Flat ₹100 off in Agra', 'flat', 10000, null,
   50000, 3, false, '20000000-0000-4000-8000-000000000003', true);

-- sample paid orders + checked-in bookings so reviews are legit ---------------
insert into public.orders
  (id, user_id, status, subtotal, discount, convenience_fee, tax, total,
   idempotency_key)
values
  ('70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   'paid', 500000, 0, 17500, 3150, 520650, 'seed-order-1'),
  ('70000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000006',
   'paid', 150000, 0, 5250, 945, 156195, 'seed-order-2');

insert into public.bookings
  (id, order_id, user_id, club_id, night_date, status, guest_count) values
  ('71000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001',
   current_date - 7, 'checked_in', 2),
  ('71000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000003',
   current_date - 3, 'checked_in', 1);

insert into public.reviews
  (booking_id, user_id, club_id, rating, rating_music, rating_crowd,
   rating_service, rating_value, body) values
  ('71000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   '30000000-0000-4000-8000-000000000001', 5, 5, 4, 4, 4,
   'Sound system is unreal. Cover was fully redeemable, service quick even at peak.'),
  ('71000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000006',
   '30000000-0000-4000-8000-000000000003', 4, 5, 4, 3, 5,
   'Great lineup and crowd. Gets packed after 11, go early.');

commit;
