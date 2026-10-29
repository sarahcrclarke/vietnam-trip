-- ============================================================================
-- Vietnam Trip — initial data seed
-- ============================================================================
--
-- WHAT THIS IS
-- A ONE-TIME seed of the CURRENT trip content (as loaded today from
-- src/data/itinerary-backup.json + src/lib/travellers.js) into the schema
-- created by supabase/schema.sql. Run this once, after schema.sql, in the
-- Supabase SQL Editor. It does not touch the running app in any way.
--
-- SOURCE OF TRUTH
-- src/lib/itinerary.js reads itinerary-backup.json directly — there is no
-- other seed source. Itinerary.js's own migration helpers
-- (transitToJourney / migrateVotes / migrateAccommodation) were used as the
-- reference for exactly how this raw JSON becomes the app's in-memory
-- shape, so this seed reproduces the SAME effective data a fresh page load
-- produces today — nothing invented, nothing extrapolated.
--
-- STABLE IDS
-- Every id below is a NEW uuid, generated once here and then reused
-- consistently everywhere that row is referenced in this file (a stop's
-- uuid appears identically in its own INSERT and in every activity/
-- journey_item that belongs to it, etc.) — never derived from a name or
-- array position. The mapping from each OLD short JSON id to its NEW uuid
-- is recorded in the comments beside each row for full traceability.
--
-- WHAT IS DELIBERATELY NOT INSERTED HERE (confirmed absent from the
-- current data — not an oversight):
--   - accommodations / accommodation_votes: the current JSON has NO
--     `accommodations` or `accommodationWishlistUrl` key on ANY of the 8
--     stops. There is nothing to migrate; these tables are seeded empty.
--   - stops.selected_accommodation_id: left null for every stop, for the
--     same reason (nothing is currently selected — nothing exists to
--     select).
--   - stops.accommodation_wishlist_url: left null for every stop.
--   - trip_access: membership rows are created ONLY by real travellers
--     calling join_trip() — never inserted directly here.
--
-- IMAGES
-- The current JSON embeds every photo as a base64 data: URI directly in
-- the file (hero photo, every stop photo, almost every activity image).
-- NONE of that is inserted here — no base64, no blob: URLs, nothing that
-- isn't a real, permanent URL. Every *_url column below is left NULL for
-- an image that only exists as base64 today; seed-images-plan.md (written
-- alongside this file) lists exactly which row needs which image uploaded
-- to Supabase Storage, and in what order, once that's approved as a
-- separate step. Nothing is uploaded by this file.
--
-- IDEMPOTENCY / SAFETY
-- Every insert below uses `on conflict (id) do nothing` (or the matching
-- composite key for the two vote tables). Because every id here is a
-- fixed, pre-generated uuid, running this file twice is safe: the second
-- run finds every row already present and changes nothing. Critically,
-- `do nothing` (not `do update`) means this file can NEVER overwrite an
-- edit a family member makes through the app after the initial seed —
-- it only ever fills in rows that don't exist yet. There is no
-- DELETE/TRUNCATE anywhere in this file.
--
-- INVITE CODE
-- The trip_invite_codes row below hashes the placeholder string
-- REPLACE_WITH_PRIVATE_TRIP_CODE. Replace that placeholder with the real
-- family passphrase LOCALLY, immediately before running this in the SQL
-- Editor, then discard your edited copy — never commit the real code.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- trips (1 row)
-- ----------------------------------------------------------------------------
-- trip id: cb2a7994-4560-4118-9bb2-100d371785cf
insert into public.trips (id, title, subtitle, depart, return_date, currency, hero_photo_url)
values ('cb2a7994-4560-4118-9bb2-100d371785cf', 'Việt Nam', 'A journey from the mist of the north to the deltas of the south.', '2027-03-31', '2027-04-18', '£', null)
on conflict (id) do nothing;

-- Hero photo is currently a base64 data: URI only (120,043 chars) — see
-- seed-images-plan.md. hero_photo_url is left null until it's uploaded to
-- Storage and this row is updated with the resulting URL.


-- ----------------------------------------------------------------------------
-- trip_invite_codes (1 row) — REPLACE THE PLACEHOLDER BEFORE RUNNING
-- ----------------------------------------------------------------------------
insert into public.trip_invite_codes (trip_id, code_hash)
values ('cb2a7994-4560-4118-9bb2-100d371785cf', crypt('REPLACE_WITH_PRIVATE_TRIP_CODE', gen_salt('bf')))
on conflict (trip_id) do nothing;


-- ----------------------------------------------------------------------------
-- travellers (6 rows) — from src/lib/travellers.js INITIAL_TRAVELLERS
-- ----------------------------------------------------------------------------
insert into public.travellers (id, trip_id, name, initials, included, voter, sort_order)
values
  ('b9fd2c21-a9ce-43db-a84e-a193aea13021', 'cb2a7994-4560-4118-9bb2-100d371785cf', 'Sarah', 'SCC', true, true, 0), -- old id: scc
  ('9ef303af-254f-4a7b-b385-7e9d14db9255', 'cb2a7994-4560-4118-9bb2-100d371785cf', 'Dom', 'DC', true, true, 1), -- old id: dc
  ('ec90d9d3-e60e-4845-aee6-5817aa96d578', 'cb2a7994-4560-4118-9bb2-100d371785cf', 'Steph', 'SR', true, true, 2), -- old id: sr
  ('f2d0a943-0d6c-4e33-a077-f6b878abb2c5', 'cb2a7994-4560-4118-9bb2-100d371785cf', 'Noah', 'NCC', true, false, 3), -- old id: ncc
  ('e9de9048-fc7c-4b58-bd81-5a351d9d856a', 'cb2a7994-4560-4118-9bb2-100d371785cf', 'Tilly', 'TCC', true, false, 4), -- old id: tcc
  ('9c46773a-4cfa-488d-ad8b-80f8d3bed8f4', 'cb2a7994-4560-4118-9bb2-100d371785cf', 'Cooper', 'CBR', true, false, 5) -- old id: cbr
on conflict (id) do nothing;


-- ----------------------------------------------------------------------------
-- stops (8 rows)
-- ----------------------------------------------------------------------------
-- photo_url is null for every stop with only a base64 photo today (see
-- seed-images-plan.md); Ho Chi Minh City and Hanoi (return) genuinely have
-- no photo at all in the current data (photo: null in the JSON) — that is
-- not a migration gap, it's the actual current state.
insert into public.stops (id, trip_id, loc, date, description, cost, photo_url, sort_order)
values
  ('03626c17-7523-4a65-a01b-a76383a9819e', 'cb2a7994-4560-4118-9bb2-100d371785cf', 'Hanoi', '2027-03-31', 'Land in Hanoi and spend the day wandering around before heading out. Hanoi acts as a travel hub for the first half of the trip. Loads of things to do - but don''t have to do all of them! ', 220, null, 0), -- old id: idp0mix79k4zn8
  ('c65ba83b-2162-4ebd-a0aa-03a1b437f908', 'cb2a7994-4560-4118-9bb2-100d371785cf', 'Sapa', '2027-04-02', 'Trek through terraced rice fields, meet local Hmong and Dao communities, and detour out to Love/Fairy Waterfall below Fansipan.', 240, null, 1), -- old id: idiasyygmo4zn8
  ('503bc2cd-f027-40b2-94af-906ef8c47b81', 'cb2a7994-4560-4118-9bb2-100d371785cf', 'Ninh Binh', '2027-04-05', 'Row through Trang An''s flooded caves and climb Hang Mua for the rice-paddy panorama.', 170, null, 2), -- old id: idk2vw8eid4zn8
  ('502516a5-bd2f-498e-94e9-9adf0ae65f57', 'cb2a7994-4560-4118-9bb2-100d371785cf', 'Ha Long Bay', '2027-04-07', 'Consider: Capella Cruise (waterslide, on-board cinema, poker room, kayaking etc) - £835 for 1 night 2 days family room(!!!!), £493 for 2 person room. All inclusive. ', 260, null, 3), -- old id: id3jej4b144zn8
  ('221dac4d-efb5-49e7-87a6-0ab9f949848d', 'cb2a7994-4560-4118-9bb2-100d371785cf', 'Da Nang', '2027-04-09', 'Base by the beach with a Hai Van Pass ride and time in Hoi An''s lantern-lit old town. Flight lands in Hue; short transfer on to Da Nang.', 320, null, 4), -- old id: idii1xa5714zn8
  ('417460c9-dbbb-4d3e-9148-ad1a009ac7de', 'cb2a7994-4560-4118-9bb2-100d371785cf', 'Ho Chi Minh City', '2027-04-12', 'War Remnants Museum by day, rooftop bars and bánh mì carts by night.', 190, null, 5), -- old id: idytyfufbu4zn8
  ('9938b60d-0ee4-45e3-85b1-8392b0c25133', 'cb2a7994-4560-4118-9bb2-100d371785cf', 'Phu Quoc', '2027-04-14', 'White-sand beaches, snorkelling the coral reefs, and sunset at the night market.', 340, null, 6), -- old id: idxenl7e8y4zn8
  ('143db267-afb2-43e9-9356-32ceabcb0728', 'cb2a7994-4560-4118-9bb2-100d371785cf', 'Hanoi (return)', '2027-04-18', 'Fly back into Hanoi to connect onward — one last bowl of phở before heading home.', 0, null, 7) -- old id: idgwmdjdme4zn8
on conflict (id) do nothing;


-- ----------------------------------------------------------------------------
-- journey_items (7 rows — one migrated leg per stop that had a
-- non-null `transit` in the JSON; Hanoi is the only stop with none, matching
-- Journey.js's own "first stop has no inbound journey" behaviour)
-- ----------------------------------------------------------------------------
-- Every migrated leg defaults to ALL currently-included travellers, exactly
-- as transitToJourney()/includedIds() do today (all 6 seed travellers are
-- included:true).
insert into public.journey_items (id, stop_id, item_type, sort_order, mode, dur, cost, traveller_ids)
values
  ('e7c9afca-268e-4ba8-8748-bb475d1a3418', 'c65ba83b-2162-4ebd-a0aa-03a1b437f908', 'leg', 0, 'train', '8h overnight train', 25, array['b9fd2c21-a9ce-43db-a84e-a193aea13021'::uuid,'9ef303af-254f-4a7b-b385-7e9d14db9255'::uuid,'ec90d9d3-e60e-4845-aee6-5817aa96d578'::uuid,'f2d0a943-0d6c-4e33-a077-f6b878abb2c5'::uuid,'e9de9048-fc7c-4b58-bd81-5a351d9d856a'::uuid,'9c46773a-4cfa-488d-ad8b-80f8d3bed8f4'::uuid]), -- into stop old id: idiasyygmo4zn8 (Sapa)
  ('48dc6fcc-ed93-462e-919c-6a41bd1dadc1', '503bc2cd-f027-40b2-94af-906ef8c47b81', 'leg', 0, 'bus', '7.5h transfer via Hanoi', 35, array['b9fd2c21-a9ce-43db-a84e-a193aea13021'::uuid,'9ef303af-254f-4a7b-b385-7e9d14db9255'::uuid,'ec90d9d3-e60e-4845-aee6-5817aa96d578'::uuid,'f2d0a943-0d6c-4e33-a077-f6b878abb2c5'::uuid,'e9de9048-fc7c-4b58-bd81-5a351d9d856a'::uuid,'9c46773a-4cfa-488d-ad8b-80f8d3bed8f4'::uuid]), -- into stop old id: idk2vw8eid4zn8 (Ninh Binh)
  ('a1c0f51f-6970-4dc3-861f-1a7e9e2b0e7e', '502516a5-bd2f-498e-94e9-9adf0ae65f57', 'leg', 0, 'car', '4h drive', 30, array['b9fd2c21-a9ce-43db-a84e-a193aea13021'::uuid,'9ef303af-254f-4a7b-b385-7e9d14db9255'::uuid,'ec90d9d3-e60e-4845-aee6-5817aa96d578'::uuid,'f2d0a943-0d6c-4e33-a077-f6b878abb2c5'::uuid,'e9de9048-fc7c-4b58-bd81-5a351d9d856a'::uuid,'9c46773a-4cfa-488d-ad8b-80f8d3bed8f4'::uuid]), -- into stop old id: id3jej4b144zn8 (Ha Long Bay)
  ('08afdb68-b8de-4cf6-9001-8335d393b195', '221dac4d-efb5-49e7-87a6-0ab9f949848d', 'leg', 0, 'flight', '1.3h flight to Hue + 1h drive', 70, array['b9fd2c21-a9ce-43db-a84e-a193aea13021'::uuid,'9ef303af-254f-4a7b-b385-7e9d14db9255'::uuid,'ec90d9d3-e60e-4845-aee6-5817aa96d578'::uuid,'f2d0a943-0d6c-4e33-a077-f6b878abb2c5'::uuid,'e9de9048-fc7c-4b58-bd81-5a351d9d856a'::uuid,'9c46773a-4cfa-488d-ad8b-80f8d3bed8f4'::uuid]), -- into stop old id: idii1xa5714zn8 (Da Nang)
  ('f6755eb4-79ff-4426-a6f6-3c2907497923', '417460c9-dbbb-4d3e-9148-ad1a009ac7de', 'leg', 0, 'flight', '1.5h flight', 60, array['b9fd2c21-a9ce-43db-a84e-a193aea13021'::uuid,'9ef303af-254f-4a7b-b385-7e9d14db9255'::uuid,'ec90d9d3-e60e-4845-aee6-5817aa96d578'::uuid,'f2d0a943-0d6c-4e33-a077-f6b878abb2c5'::uuid,'e9de9048-fc7c-4b58-bd81-5a351d9d856a'::uuid,'9c46773a-4cfa-488d-ad8b-80f8d3bed8f4'::uuid]), -- into stop old id: idytyfufbu4zn8 (Ho Chi Minh City)
  ('1b9915e0-83db-4750-9fc7-fac2c805f5ea', '9938b60d-0ee4-45e3-85b1-8392b0c25133', 'leg', 0, 'flight', '1h flight', 50, array['b9fd2c21-a9ce-43db-a84e-a193aea13021'::uuid,'9ef303af-254f-4a7b-b385-7e9d14db9255'::uuid,'ec90d9d3-e60e-4845-aee6-5817aa96d578'::uuid,'f2d0a943-0d6c-4e33-a077-f6b878abb2c5'::uuid,'e9de9048-fc7c-4b58-bd81-5a351d9d856a'::uuid,'9c46773a-4cfa-488d-ad8b-80f8d3bed8f4'::uuid]), -- into stop old id: idxenl7e8y4zn8 (Phu Quoc)
  ('28350863-471a-4ef2-95e6-1e459349c3a5', '143db267-afb2-43e9-9356-32ceabcb0728', 'leg', 0, 'flight', '2h flight, return', 65, array['b9fd2c21-a9ce-43db-a84e-a193aea13021'::uuid,'9ef303af-254f-4a7b-b385-7e9d14db9255'::uuid,'ec90d9d3-e60e-4845-aee6-5817aa96d578'::uuid,'f2d0a943-0d6c-4e33-a077-f6b878abb2c5'::uuid,'e9de9048-fc7c-4b58-bd81-5a351d9d856a'::uuid,'9c46773a-4cfa-488d-ad8b-80f8d3bed8f4'::uuid]) -- into stop old id: idgwmdjdme4zn8 (Hanoi (return))
on conflict (id) do nothing;


-- ----------------------------------------------------------------------------
-- activities (57 rows)
-- ----------------------------------------------------------------------------
-- travel_time is left null for every row: the current JSON has no
-- `travelTime` key on any activity at all (confirmed by inspecting every
-- activity's keys — only id/name/link/cost/image/votes exist), so there is
-- genuinely nothing to migrate, not a gap.
insert into public.activities (id, stop_id, name, link, cost, image_url, travel_time, sort_order)
values
  ('a931d935-2aa9-4773-9e6d-1f91f4b16d0f', '03626c17-7523-4a65-a01b-a76383a9819e', 'Train Street', null, null, null, null, 0), -- old id: idaheo2eqh9i06 (Hanoi)
  ('2fe55038-ffaa-4fa5-b7f7-18e8e8d0846d', '03626c17-7523-4a65-a01b-a76383a9819e', 'Incense Village', null, null, null, null, 1), -- old id: idbc8lqadoamm3 (Hanoi)
  ('93db6dc8-4304-46b4-988a-7f083bab13d7', '03626c17-7523-4a65-a01b-a76383a9819e', 'Old Quater', null, null, null, null, 2), -- old id: idvlri3ycqg459 (Hanoi)
  ('8b85cbce-e49f-4bee-8faa-f0da3b2770d6', '03626c17-7523-4a65-a01b-a76383a9819e', 'X Space Immersive', null, null, null, null, 3), -- old id: idv4m2dztzg7p3 (Hanoi)
  ('5cb137a4-8af5-495c-8a77-9396248c92ec', '03626c17-7523-4a65-a01b-a76383a9819e', 'Tran Quoc Pagoda', null, null, null, null, 4), -- old id: idry9spl10gxjb (Hanoi)
  ('8472484f-d41a-4509-a006-35a3b2756daa', '03626c17-7523-4a65-a01b-a76383a9819e', 'St Joseph''s Cathedral', null, null, null, null, 5), -- old id: idmabckphjhhel (Hanoi)
  ('083abba4-b86a-40d1-84c6-54040bbdedfa', '03626c17-7523-4a65-a01b-a76383a9819e', 'Silk Street', null, null, null, null, 6), -- old id: id0t6332gchlto (Hanoi)
  ('8adf8643-f7dd-4780-bbfe-3d9094d90359', '03626c17-7523-4a65-a01b-a76383a9819e', 'Rainbow Slide', null, null, null, null, 7), -- old id: idr2rsvh9lmf91 (Hanoi)
  ('28115104-15a8-4b7a-8cf8-c7dc0f1458f2', '03626c17-7523-4a65-a01b-a76383a9819e', 'Note Coffee', null, null, null, null, 8), -- old id: idlny8j3b4qq3z (Hanoi)
  ('37b3ba6a-071c-44b0-81bf-ff2b1a2787e6', '03626c17-7523-4a65-a01b-a76383a9819e', '"Walking Street" (beer from $1)', null, null, null, null, 9), -- old id: idgpg657013wdj (Hanoi)
  ('ccf72943-a320-47bf-9d09-f73bf5d7ea05', '03626c17-7523-4a65-a01b-a76383a9819e', 'City Sightseeing Bus Tour', null, 5, null, null, 10), -- old id: idtodeoq1vahmm (Hanoi)
  ('1f30b913-4cbe-4d01-8ccf-8a30477703f4', '03626c17-7523-4a65-a01b-a76383a9819e', 'Infinity Beach Quang Lang', null, null, null, null, 11), -- old id: id1gkcat1tdxsk (Hanoi)
  ('047df64c-dbbb-4b2b-be58-6edc362f3287', '03626c17-7523-4a65-a01b-a76383a9819e', 'Mega Grand World', null, null, null, null, 12), -- old id: id78x89cm1x1t0 (Hanoi)
  ('9775aa16-eb7b-4ac8-b001-3b408bdc0f17', '03626c17-7523-4a65-a01b-a76383a9819e', 'Chuong Conical Hat Village', null, null, null, null, 13), -- old id: idint48qnqg42r (Hanoi)
  ('31c3055e-caba-4446-8129-dfc6f8fcf0c3', '03626c17-7523-4a65-a01b-a76383a9819e', 'Van Phuc Silk Village', null, null, null, null, 14), -- old id: idnqxqqhx9h2l7 (Hanoi)
  ('c4f11802-2b47-48b1-a9a7-d75e88396522', '03626c17-7523-4a65-a01b-a76383a9819e', 'Bat Trang Pottery Village', null, null, null, null, 15), -- old id: idde9mlbnujaua (Hanoi)
  ('1856ef2b-c845-40f0-bf1d-a3f539211ea2', '03626c17-7523-4a65-a01b-a76383a9819e', 'Thai Cooking Classes for Kids', 'https://rosekitchen.com.vn/book-a-class/cooking-workshop-for-kid/', 0, null, null, 16), -- old id: idgniex57wmcyp (Hanoi)
  ('139065c1-6095-4c46-96b9-14a66f311db7', 'c65ba83b-2162-4ebd-a0aa-03a1b437f908', 'Rong May Glass Bridge', null, null, null, null, 0), -- old id: idrpklwpzmb5ps (Sapa)
  ('8d4541f5-bf11-4052-9136-6f8001b0568a', 'c65ba83b-2162-4ebd-a0aa-03a1b437f908', 'Fansipan Peak', null, null, null, null, 1), -- old id: id985x3a6je4x7 (Sapa)
  ('d4f202a2-af18-4ee0-b7d9-f5a34812f8c0', 'c65ba83b-2162-4ebd-a0aa-03a1b437f908', 'Muong Hoa Funicular', null, 6, null, null, 2), -- old id: ida8a8zdkwexur (Sapa)
  ('60f0ffaf-6e7a-4202-afd6-84e0f21b9027', 'c65ba83b-2162-4ebd-a0aa-03a1b437f908', 'CatCat Village', null, null, null, null, 3), -- old id: idspixhewmf0n4 (Sapa)
  ('c4fc9fbf-3eef-41f8-a0e9-a51d2d96a57e', 'c65ba83b-2162-4ebd-a0aa-03a1b437f908', 'Rainbow Slide', null, null, null, null, 4), -- old id: idrcsc9qf7f3s6 (Sapa)
  ('77f0b100-edca-4e54-9fba-33ec6b27c838', 'c65ba83b-2162-4ebd-a0aa-03a1b437f908', 'Alpine Coaster', null, 5, null, null, 5), -- old id: idq4k4r64lf6v4 (Sapa)
  ('714d3830-fc04-4408-aebb-adf20ff76076', 'c65ba83b-2162-4ebd-a0aa-03a1b437f908', 'Moana', null, null, null, null, 6), -- old id: idmtj0dptcfbsm (Sapa)
  ('d3fdd1c2-9687-4532-b396-4979572c3f15', 'c65ba83b-2162-4ebd-a0aa-03a1b437f908', 'Infinity Hand', null, null, null, null, 7), -- old id: idcf83nl3rfgat (Sapa)
  ('6560058a-ab1f-46e2-94e4-66ea880a9fea', 'c65ba83b-2162-4ebd-a0aa-03a1b437f908', 'Fansipan Cable Car', null, null, null, null, 8), -- old id: idu7avr11d8x9a (Sapa)
  ('cb22b215-0b80-4757-8685-8bae84413bfb', 'c65ba83b-2162-4ebd-a0aa-03a1b437f908', 'Love Waterfall', null, null, null, null, 9), -- old id: idm5r8bm6lw3im (Sapa)
  ('4078e00b-980e-4dbd-a8f0-7f3fa233c01d', 'c65ba83b-2162-4ebd-a0aa-03a1b437f908', 'Mario Kart O Quy Ho Fairy Valley', null, null, null, null, 10), -- old id: idluqrewn9t45d (Sapa)
  ('68f066a3-4b46-4f5e-8cc5-94a7e272e4a6', '503bc2cd-f027-40b2-94af-906ef8c47b81', 'Tam Coc Boat Tour', null, null, null, null, 0), -- old id: idvhvky6ojdvns (Ninh Binh)
  ('90a29cb6-cf91-4e19-a4ba-55188d96bb36', '503bc2cd-f027-40b2-94af-906ef8c47b81', 'Bich Dong Pagoda', null, null, null, null, 1), -- old id: idjmfpoxz4pc55 (Ninh Binh)
  ('82eeacc3-28fd-4ef6-90cd-0dbcf1f70fe8', '221dac4d-efb5-49e7-87a6-0ab9f949848d', 'Ba Na Hills', null, null, null, null, 0), -- old id: id4sl38ambcvqd (Da Nang)
  ('3dc9fa54-fc53-455f-a895-333499844767', '221dac4d-efb5-49e7-87a6-0ab9f949848d', 'Dragon Bridge (weekend fire)', null, null, null, null, 1), -- old id: id48qq77h1d1te (Da Nang)
  ('5be83d4d-3438-4d82-923a-f8f9df47e824', '221dac4d-efb5-49e7-87a6-0ab9f949848d', 'Hoi An Lanterns', null, null, null, null, 2), -- old id: id7ffkxl9gd64r (Da Nang)
  ('fdf85654-b323-4d08-bc00-9cd635ce0b44', '221dac4d-efb5-49e7-87a6-0ab9f949848d', 'Marble Mountains', null, null, null, null, 3), -- old id: idzxgtnaugd9jv (Da Nang)
  ('96fdd3f6-18ce-4e72-bf2c-6e14afc17f47', '221dac4d-efb5-49e7-87a6-0ab9f949848d', 'Son Tra Night Market', null, null, null, null, 4), -- old id: idp3dqh3apdd74 (Da Nang)
  ('68d0607a-9768-41b0-b8c4-411936891768', '221dac4d-efb5-49e7-87a6-0ab9f949848d', 'Market Shopping', null, null, null, null, 5), -- old id: idgbt2lj0adnxy (Da Nang)
  ('2002ece3-7890-4050-9cfb-eb6ddefb0c30', '221dac4d-efb5-49e7-87a6-0ab9f949848d', 'Coconut Boat', null, null, null, null, 6), -- old id: idbct1uwjxi845 (Da Nang)
  ('0017698d-6dfc-4f7f-a901-04a8d1d39f32', '221dac4d-efb5-49e7-87a6-0ab9f949848d', 'VinWonders Amusement Park', null, null, null, null, 7), -- old id: id13lwlnisuepb (Da Nang)
  ('53f4a82f-4335-43f3-94b4-c1573f973564', '221dac4d-efb5-49e7-87a6-0ab9f949848d', 'Sunrise Paddle Boarding', null, null, null, null, 8), -- old id: id8ufh8hz4hec7 (Da Nang)
  ('fc88efa9-8dbd-423d-a605-41861808b751', '221dac4d-efb5-49e7-87a6-0ab9f949848d', 'Hoi An Memories Show', null, null, null, null, 9), -- old id: idl6281s6uiq3t (Da Nang)
  ('055ea83a-06e1-4e02-a0b0-ce1cfc5be6ab', '221dac4d-efb5-49e7-87a6-0ab9f949848d', 'Alpine Coaster Ba Na Hills', null, null, null, null, 10), -- old id: id8co7f1zukhxs (Da Nang)
  ('d38ef7a0-a35a-4d14-935b-710de1e7ad85', '417460c9-dbbb-4d3e-9148-ad1a009ac7de', 'Suoi Tien Theme Park', null, null, null, null, 0), -- old id: id323pbll0bzmh (Ho Chi Minh City)
  ('8ac30054-cd55-4d82-99ec-030c716402ae', '417460c9-dbbb-4d3e-9148-ad1a009ac7de', 'Saigon Central Post Office', null, null, null, null, 1), -- old id: idr80wwmeqcm1b (Ho Chi Minh City)
  ('ddacd7f6-7921-474c-9a4c-8350f0fb51d0', '417460c9-dbbb-4d3e-9148-ad1a009ac7de', 'Golden Dragon Water Puppet Theatre', null, null, null, null, 2), -- old id: idrm4b6kodcpu7 (Ho Chi Minh City)
  ('327bd949-21e1-46c5-8710-fb398a796318', '417460c9-dbbb-4d3e-9148-ad1a009ac7de', 'Aimbox: Human Claw Machine', null, null, null, null, 3), -- old id: idutxvuzyyiygd (Ho Chi Minh City)
  ('ee6303bb-faa0-4fe0-b5ab-0efa7942a185', '417460c9-dbbb-4d3e-9148-ad1a009ac7de', 'Paddleboarding on Siagon River', null, null, null, null, 4), -- old id: idqvmedqf9kcmi (Ho Chi Minh City)
  ('b752d606-33a4-436c-a208-0089a7dda255', '417460c9-dbbb-4d3e-9148-ad1a009ac7de', 'Cafe Apartments', null, null, null, null, 5), -- old id: idyhdztrvxrlfq (Ho Chi Minh City)
  ('05750c09-c328-4fbc-8a89-d8bd950fb8e3', '417460c9-dbbb-4d3e-9148-ad1a009ac7de', 'Vuon Thien Gioi Coffee', null, null, null, null, 6), -- old id: id8eqe6ki316t3 (Ho Chi Minh City)
  ('43cebb18-c8eb-4c2e-ba72-11bd16505992', '417460c9-dbbb-4d3e-9148-ad1a009ac7de', 'Wagwel Adoption Cafe', null, null, null, null, 7), -- old id: id5p0i6agacxsa (Ho Chi Minh City)
  ('b9935019-1f0d-485e-8401-43b544fbfa8d', '9938b60d-0ee4-45e3-85b1-8392b0c25133', 'Phu Quoc Aquarium', null, 30, null, null, 0), -- old id: id0sniws46as2o (Phu Quoc)
  ('63c1ca68-264f-42aa-b03e-b4063f170f33', '9938b60d-0ee4-45e3-85b1-8392b0c25133', 'Hon Thom Cablecar', null, 30, null, null, 1), -- old id: idq35s7c29ayzg (Phu Quoc)
  ('f2a67f9c-8294-4ac8-b252-a66fe690b88c', '9938b60d-0ee4-45e3-85b1-8392b0c25133', 'Grand World Phu Quoc', null, null, null, null, 2), -- old id: iduhz7d3l5b4o5 (Phu Quoc)
  ('355d655d-8931-4586-b65e-9feb865660e5', '9938b60d-0ee4-45e3-85b1-8392b0c25133', 'Kissing Bridge', null, null, null, null, 3), -- old id: id5k06ieppb8qd (Phu Quoc)
  ('d9661a56-5ade-4b01-981b-7d48b119d91a', '9938b60d-0ee4-45e3-85b1-8392b0c25133', 'Teddy Bear Museum', null, 310, null, null, 4), -- old id: id0vasbb2obe1a (Phu Quoc)
  ('368cb2cf-cd4e-44fa-84e4-e0b774e36d3c', '9938b60d-0ee4-45e3-85b1-8392b0c25133', 'VinPearl Safari', null, 26, null, null, 5), -- old id: id1oppytoybj1a (Phu Quoc)
  ('8a2fc51b-cf18-4b34-a670-e71ae5a651ff', '9938b60d-0ee4-45e3-85b1-8392b0c25133', 'Sao Beach (starfish beach)', null, null, null, null, 6), -- old id: id4l970ynoy5nb (Phu Quoc)
  ('323cd840-8416-4f42-a2c8-ca1c189a52d2', '9938b60d-0ee4-45e3-85b1-8392b0c25133', 'Phu Quoc Night Market', null, null, null, null, 7) -- old id: idp1wsgpjq2oh5 (Phu Quoc)
on conflict (id) do nothing;


-- ----------------------------------------------------------------------------
-- activity_votes (1 row)
-- ----------------------------------------------------------------------------
-- migrateVotes() only ever converts a `true` value into a vote row — false
-- and null both mean "not selected" and are correctly dropped, exactly as
-- the running app already treats them.
insert into public.activity_votes (activity_id, traveller_id)
values
  ('139065c1-6095-4c46-96b9-14a66f311db7', 'b9fd2c21-a9ce-43db-a84e-a193aea13021') -- Sarah voted for "Rong May Glass Bridge" (Sapa)
on conflict (activity_id, traveller_id) do nothing;


-- ----------------------------------------------------------------------------
-- accommodations (0 rows) / accommodation_votes (0 rows)
-- ----------------------------------------------------------------------------
-- Confirmed by inspecting every one of the 8 stops in the current JSON:
-- none has an `accommodations` or `accommodationWishlistUrl` key. There is
-- no accommodation data anywhere in the current trip to migrate. Nothing
-- is inserted into either table, and no stop's selected_accommodation_id
-- is set (all remain null, their default).


-- ----------------------------------------------------------------------------
-- extra_costs (2 rows)
-- ----------------------------------------------------------------------------
insert into public.extra_costs (id, trip_id, label, amount, sort_order)
values
  ('fe43b45f-4f2f-4733-a85a-30914adf2cc2', 'cb2a7994-4560-4118-9bb2-100d371785cf', 'International flights', 0, 0), -- old id: idrhvwo4u04zn8
  ('f8639a23-b8e4-4ecb-b057-58d33e607fe2', 'cb2a7994-4560-4118-9bb2-100d371785cf', 'Visa & insurance', 0, 1) -- old id: idu3f4ncsj4zn8
on conflict (id) do nothing;


-- ============================================================================
-- End of seed.
-- ============================================================================
