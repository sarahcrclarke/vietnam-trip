import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  ACTION,
  applyOne,
  buildInventory,
  createMutator,
  parseSeedMapping,
  planMigration,
  runMigration,
} from "../../scripts/lib/seedImageMigration.mjs";

const itinerary = () => JSON.parse(readFileSync("src/data/itinerary-backup.json", "utf8"));
const seed = parseSeedMapping(readFileSync("supabase/seed-vietnam-trip.sql", "utf8"));

// In-memory Supabase: tables keyed by id, a Storage bucket of paths, and a
// mutation log. `afterRead` lets a test change a row between the plan's read
// and the conditional update (a race).
function fakeSupabase({ rows = {}, objects = [], onUpload } = {}) {
  const db = { trips: {}, stops: {}, activities: {}, ...rows };
  const storage = new Set(objects);
  const log = [];
  const supabase = {
    from: (table) => ({
      select: (cols) => ({
        eq: (_c, id) => ({
          maybeSingle: async () => {
            const row = db[table][id];
            if (!row) return { data: null, error: null };
            const out = { id };
            for (const c of cols.split(",").map((s) => s.trim())) if (c !== "id") out[c] = row[c] ?? null;
            return { data: out, error: null };
          },
        }),
      }),
      update: (patch) => ({
        eq: (_c, id) => ({
          is: (col, _null) => ({
            select: async () => {
              log.push(`update ${table} ${id} ${JSON.stringify(patch)}`);
              const row = db[table][id];
              if (!row || (row[col] ?? null) !== null) return { data: [], error: null };
              Object.assign(row, patch);
              return { data: [{ id }], error: null };
            },
          }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        list: async (folder, { search }) => ({
          data: [...storage].filter((p) => p === `${folder}/${search}`).map((p) => ({ name: p.split("/").pop() })),
          error: null,
        }),
        upload: async (path) => {
          log.push(`upload ${path}`);
          if (storage.has(path)) return { error: { statusCode: "409", message: "The resource already exists" } };
          storage.add(path);
          onUpload?.(db, path);
          return { error: null };
        },
        remove: async (paths) => {
          log.push(`remove ${paths.join(",")}`);
          paths.forEach((p) => storage.delete(p));
          return { error: null };
        },
      }),
    },
  };
  return { supabase, db, storage, log };
}

// A DB where every seeded row exists with null images.
function seededRows() {
  const inv = buildInventory(itinerary(), seed);
  const rows = { trips: { [seed.tripId]: { hero_photo_url: null } }, stops: {}, activities: {} };
  for (const s of seed.stopsByOldId.values()) rows.stops[s.id] = { loc: s.loc, photo_url: null };
  for (const a of seed.activitiesByOldId.values()) rows.activities[a.id] = { name: a.name, image_url: null };
  return { rows, inv };
}
const mutations = (log) => log.filter((l) => /^(upload|update|remove)/.test(l));

test("source inventory is exactly 1/6/56 = 63, 61 unique hashes, duplicates map fine", () => {
  const inv = buildInventory(itinerary(), seed);
  expect(inv.counts).toEqual({ hero: 1, stop: 6, activity: 56 });
  expect(inv.total).toBe(63);
  expect(inv.uniqueHashes).toBe(61);
  expect(new Set(inv.items.map((i) => `${i.table}:${i.id}`)).size).toBe(63); // one row each
  expect(new Set(inv.items.map((i) => i.path)).size).toBe(63); // separate object each
  expect(inv.items.every((i) => i.bytes[0] === 0xff && i.bytes[1] === 0xd8)).toBe(true);
  // no photo -> no item: HCMC, Hanoi (return), Bat Trang
  const ids = new Set(inv.items.map((i) => i.id));
  expect(ids.has("417460c9-dbbb-4d3e-9148-ad1a009ac7de")).toBe(false);
  expect(ids.has("143db267-afb2-43e9-9356-32ceabcb0728")).toBe(false);
  expect(ids.has("c4f11802-2b47-48b1-a9a7-d75e88396522")).toBe(false);
});

test("source count mismatch aborts", () => {
  const it = itinerary();
  it.days[0].activities[0].image = null;
  expect(() => buildInventory(it, seed)).toThrow(/inventory mismatch/i);
  const it2 = itinerary();
  delete it2.heroPhoto;
  expect(() => buildInventory(it2, seed)).toThrow(/inventory mismatch/i);
});

test("mapping that doesn't line up with the seed aborts instead of guessing", () => {
  const it = itinerary();
  it.days[1].activities[0].id = "idnotinseed";
  expect(() => buildInventory(it, seed)).toThrow(/no seed mapping/i);
});

test("dry run performs zero mutations and plans every eligible row", async () => {
  const { rows, inv } = seededRows();
  const { supabase, log } = fakeSupabase({ rows });
  const { plan, results } = await runMigration(supabase, inv.items, { apply: false });
  expect(mutations(log)).toEqual([]);
  expect(results).toEqual([]);
  expect(plan.filter((p) => p.action === ACTION.MIGRATE)).toHaveLength(63);
});

test("mutator refuses every mutation unless apply is true", async () => {
  const { supabase, log } = fakeSupabase();
  const m = createMutator(supabase, false);
  const item = { table: "activities", column: "image_url", id: "x", path: "p/seed.jpg", bytes: Buffer.from("x") };
  await expect(m.upload("p", Buffer.from("x"))).rejects.toThrow(/--apply/);
  await expect(m.updateIfNull(item)).rejects.toThrow(/--apply/);
  await expect(m.remove("p")).rejects.toThrow(/--apply/);
  expect(log).toEqual([]);
});

test("existing image (user upload) is protected, missing row skipped, in plan and apply", async () => {
  const { rows, inv } = seededRows();
  const protectedId = inv.items.find((i) => i.type === "activity").id;
  const missingId = inv.items.filter((i) => i.type === "activity")[1].id;
  const userPath = `${seed.tripId}/activities/${protectedId}/user-upload.jpg`;
  rows.activities[protectedId].image_url = userPath;
  delete rows.activities[missingId];
  const { supabase, db, storage, log } = fakeSupabase({ rows });

  const dry = await runMigration(supabase, inv.items, { apply: false });
  const byAction = (a) => dry.plan.filter((p) => p.action === a).length;
  expect(byAction(ACTION.MIGRATE)).toBe(61);
  expect(byAction(ACTION.SKIP_EXISTING)).toBe(1);
  expect(byAction(ACTION.SKIP_MISSING)).toBe(1);
  expect(mutations(log)).toEqual([]);

  const live = await runMigration(supabase, inv.items, { apply: true });
  expect(live.results.filter((r) => r.outcome === "MIGRATED")).toHaveLength(61);
  expect(db.activities[protectedId].image_url).toBe(userPath); // untouched
  expect(storage.has(`${seed.tripId}/activities/${protectedId}/seed.jpg`)).toBe(false); // nothing uploaded
  expect(storage.has(`${seed.tripId}/activities/${missingId}/seed.jpg`)).toBe(false);
  expect(db.activities[missingId]).toBeUndefined(); // not recreated
  expect(db.trips[seed.tripId].hero_photo_url).toBe(`${seed.tripId}/hero/seed.jpg`);
});

test("re-running is idempotent", async () => {
  const { rows, inv } = seededRows();
  const { supabase, log } = fakeSupabase({ rows });
  await runMigration(supabase, inv.items, { apply: true });
  log.length = 0;
  const again = await runMigration(supabase, inv.items, { apply: true });
  expect(again.plan.every((p) => p.action === ACTION.SKIP_EXISTING)).toBe(true);
  expect(mutations(log)).toEqual([]);
});

test("seed object already in Storage + null column completes without re-upload", async () => {
  const { rows, inv } = seededRows();
  const item = inv.items.find((i) => i.type === "stop");
  const { supabase, db, log } = fakeSupabase({ rows, objects: [item.path] });
  const plan = await planMigration(supabase, [item]);
  expect(plan[0].seedObject).toBe(true);
  const out = await applyOne(supabase, createMutator(supabase, true), plan[0]);
  expect(out.outcome).toBe("MIGRATED");
  expect(log.some((l) => l.startsWith("upload"))).toBe(false);
  expect(db.stops[item.id].photo_url).toBe(item.path);
});

test("a user image that appears mid-run is never overwritten; our fresh seed object is cleaned up", async () => {
  const { rows, inv } = seededRows();
  const item = inv.items.find((i) => i.type === "activity");
  const userPath = `${seed.tripId}/activities/${item.id}/user-upload.jpg`;
  // the user's image lands while our seed upload is in flight
  const { supabase, db, storage, log } = fakeSupabase({
    rows,
    onUpload: (d) => (d.activities[item.id].image_url = userPath),
  });
  const plan = await planMigration(supabase, [item]);
  expect(plan[0].action).toBe(ACTION.MIGRATE);
  const out = await applyOne(supabase, createMutator(supabase, true), plan[0]);
  expect(out.outcome).toMatch(/SKIPPED — existing image protected/);
  expect(db.activities[item.id].image_url).toBe(userPath);
  expect(storage.has(item.path)).toBe(false); // our seed object removed
  expect(log.filter((l) => l.startsWith("remove"))).toEqual([`remove ${item.path}`]);
});

test("an existing seed.jpg we didn't upload is never deleted on a lost race", async () => {
  const { rows, inv } = seededRows();
  const item = inv.items.find((i) => i.type === "activity");
  const { supabase, db, storage } = fakeSupabase({ rows, objects: [item.path] });
  const plan = await planMigration(supabase, [item]);
  db.activities[item.id].image_url = "someone/else.jpg"; // changes after the plan, before apply
  const out = await applyOne(supabase, createMutator(supabase, true), plan[0]);
  expect(out.outcome).toMatch(/protected/);
  expect(storage.has(item.path)).toBe(true);
  expect(db.activities[item.id].image_url).toBe("someone/else.jpg");
});

test("CLI: unknown flag and missing env refuse before doing anything", () => {
  const env = { PATH: process.env.PATH };
  const bad = spawnSync("node", ["scripts/migrate-seed-images.mjs", "--aply"], { env, encoding: "utf8" });
  expect(bad.status).toBe(2);
  const noEnv = spawnSync("node", ["scripts/migrate-seed-images.mjs"], { env, encoding: "utf8" });
  expect(noEnv.status).toBe(2);
  expect(noEnv.stderr).toMatch(/Missing SUPABASE_URL/);
});
