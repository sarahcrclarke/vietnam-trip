-- 16 — Activity cost: distinguish "no price" (NULL) from "free" (0)
--
-- RUN ONCE, in the Supabase SQL Editor, BEFORE the app build that writes NULL
-- for an empty cost is deployed. Until this runs, clearing a cost would fail
-- against the NOT NULL column.
--
-- Decision: every existing activity cost of 0 becomes NULL ("no price"),
-- because the database could not tell typed-in zeros from unpriced activities.
-- A genuinely free activity can be re-entered as 0 afterwards, which then
-- shows "Free activity". Do NOT re-run the UPDATE later: it would wipe any
-- deliberate 0 entered after this migration.

alter table public.activities alter column cost drop not null;
alter table public.activities alter column cost set default null;

update public.activities set cost = null where cost = 0;
