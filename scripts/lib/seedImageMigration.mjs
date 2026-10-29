// One-off migration of the bundled (base64) trip images in
// src/data/itinerary-backup.json into the private `trip-photos` bucket, and
// into the existing DB image columns. The CLI is scripts/migrate-seed-images.mjs.
//
// Safety rules, enforced here:
//  - DRY RUN is the default. Every mutation (upload / DB update / delete) goes
//    through one guard that throws unless `apply` is true.
//  - A row whose image column already holds ANY value is protected: nothing is
//    uploaded for it and its column is never touched. The final write is a
//    conditional update (`... where id = X and <column> is null`), so a value
//    that appears after we looked can't be overwritten either.
//  - Rows are matched by database UUID (via the seed SQL's "old id" comments),
//    never by editable names. Rows that no longer exist are skipped, never
//    recreated.
//  - Seed objects use deterministic paths (…/seed.jpg), so re-running is safe.

import { createHash } from "node:crypto";

export const BUCKET = "trip-photos";
export const EXPECTED = { hero: 1, stop: 6, activity: 56 };
export const EXPECTED_UNIQUE_HASHES = 61; // reported, never enforced

export const ACTION = {
  MIGRATE: "MIGRATE",
  SKIP_EXISTING: "SKIP EXISTING",
  SKIP_MISSING: "SKIP MISSING",
  ERROR: "ERROR",
};

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const sqlText = (s) => s.replace(/''/g, "'");

// ---------------------------------------------------------------------------
// Seed mapping: old JSON id -> database UUID, from seed-vietnam-trip.sql.
// ---------------------------------------------------------------------------
function section(sql, startRe) {
  const start = sql.search(startRe);
  if (start < 0) throw new Error(`Seed SQL: section ${startRe} not found`);
  const rest = sql.slice(start);
  const end = rest.search(/\bon conflict\b/i);
  return end < 0 ? rest : rest.slice(0, end);
}

export function parseSeedMapping(sql) {
  const tripMatch = sql.match(new RegExp(`insert into public\\.trips[\\s\\S]*?values\\s*\\('(${UUID})'`, "i"));
  if (!tripMatch) throw new Error("Seed SQL: trip id not found");

  const stopRe = new RegExp(`^\\s*\\('(${UUID})',\\s*'(${UUID})',\\s*'((?:[^']|'')*)'.*,\\s*(\\d+)\\)\\s*,?\\s*--\\s*old id:\\s*(\\w+)\\s*$`);
  const actRe = new RegExp(`^\\s*\\('(${UUID})',\\s*'(${UUID})',\\s*'((?:[^']|'')*)',.*,\\s*(\\d+)\\)\\s*,?\\s*--\\s*old id:\\s*(\\w+)`);

  const stopsByOldId = new Map();
  for (const line of section(sql, /insert into public\.stops/i).split("\n")) {
    const m = line.match(stopRe);
    if (m) stopsByOldId.set(m[5], { id: m[1], loc: sqlText(m[3]), sortOrder: Number(m[4]) });
  }
  const activitiesByOldId = new Map();
  for (const line of section(sql, /insert into public\.activities/i).split("\n")) {
    const m = line.match(actRe);
    if (m) activitiesByOldId.set(m[5], { id: m[1], stopId: m[2], name: sqlText(m[3]), sortOrder: Number(m[4]) });
  }
  return { tripId: tripMatch[1], stopsByOldId, activitiesByOldId };
}

// ---------------------------------------------------------------------------
// Source inventory: decode the bundled JPEGs and attach each to its DB row.
// ---------------------------------------------------------------------------
function decodeJpeg(dataUrl, label) {
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) throw new Error(`${label}: not a base64 JPEG data URL`);
  const bytes = Buffer.from(m[1], "base64");
  if (bytes.length < 3 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    throw new Error(`${label}: bytes are not a JPEG`);
  }
  return bytes;
}

// Throws (abort, no guessing) if the source counts or the seed mapping don't
// line up exactly. Duplicate image bytes are fine and only reported.
export function buildInventory(itinerary, seed) {
  const { tripId } = seed;
  const items = [];
  const problems = [];
  const add = (item) => {
    const bytes = decodeJpeg(item.dataUrl, item.label);
    items.push({ ...item, dataUrl: undefined, bytes, hash: createHash("sha256").update(bytes).digest("hex") });
  };

  if (itinerary.heroPhoto) {
    add({ type: "hero", table: "trips", column: "hero_photo_url", id: tripId, label: "Trip hero", path: `${tripId}/hero/seed.jpg`, dataUrl: itinerary.heroPhoto });
  }

  (itinerary.days || []).forEach((day, dayIndex) => {
    const stop = seed.stopsByOldId.get(day.id);
    if (!stop) {
      problems.push(`Stop "${day.loc}" (${day.id}) has no seed mapping`);
      return;
    }
    if (stop.loc !== day.loc || stop.sortOrder !== dayIndex) {
      problems.push(`Stop "${day.loc}" (${day.id}) doesn't match its seed row ("${stop.loc}", sort ${stop.sortOrder} vs position ${dayIndex})`);
      return;
    }
    if (day.photo) {
      add({ type: "stop", table: "stops", column: "photo_url", id: stop.id, label: day.loc, path: `${tripId}/stops/${stop.id}/seed.jpg`, dataUrl: day.photo });
    }
    (day.activities || []).forEach((act, actIndex) => {
      const row = seed.activitiesByOldId.get(act.id);
      if (!row) {
        problems.push(`Activity "${act.name}" (${act.id}) in ${day.loc} has no seed mapping`);
        return;
      }
      if (row.stopId !== stop.id || row.name !== act.name || row.sortOrder !== actIndex) {
        problems.push(`Activity "${act.name}" (${act.id}) doesn't match its seed row ("${row.name}", sort ${row.sortOrder} vs position ${actIndex})`);
        return;
      }
      if (act.image) {
        add({ type: "activity", table: "activities", column: "image_url", id: row.id, label: `${day.loc} › ${act.name}`, path: `${tripId}/activities/${row.id}/seed.jpg`, dataUrl: act.image });
      }
    });
  });

  const counts = { hero: 0, stop: 0, activity: 0 };
  for (const it of items) counts[it.type] += 1;
  const total = items.length;
  const uniqueHashes = new Set(items.map((i) => i.hash)).size;

  if (problems.length) throw new Error(`Seed mapping problems — aborting:\n  - ${problems.join("\n  - ")}`);
  if (counts.hero !== EXPECTED.hero || counts.stop !== EXPECTED.stop || counts.activity !== EXPECTED.activity) {
    throw new Error(
      `Source inventory mismatch — aborting. Expected hero/stop/activity = ${EXPECTED.hero}/${EXPECTED.stop}/${EXPECTED.activity}, found ${counts.hero}/${counts.stop}/${counts.activity}.`
    );
  }
  const ids = new Set(items.map((i) => `${i.table}:${i.id}`));
  if (ids.size !== total) throw new Error("Source inventory maps two images to one database row — aborting.");
  return { items, counts, total, uniqueHashes };
}

// ---------------------------------------------------------------------------
// Live inspection + plan (read-only).
// ---------------------------------------------------------------------------
async function readColumn(supabase, item) {
  const { data, error } = await supabase.from(item.table).select(`id, ${item.column}`).eq("id", item.id).maybeSingle();
  if (error) throw error;
  return data; // null = row missing
}

async function liveName(supabase, item) {
  if (item.type === "hero") return null;
  const col = item.type === "stop" ? "loc" : "name";
  const { data } = await supabase.from(item.table).select(col).eq("id", item.id).maybeSingle();
  return data ? data[col] : null;
}

export async function seedObjectExists(supabase, path) {
  const slash = path.lastIndexOf("/");
  const { data, error } = await supabase.storage.from(BUCKET).list(path.slice(0, slash), { limit: 100, search: path.slice(slash + 1) });
  if (error) throw error;
  return (data || []).some((o) => o.name === path.slice(slash + 1));
}

const describeState = (value) => (value === null || value === undefined ? "null" : value === "" || String(value).trim() === "" ? "empty string" : "has image");

export async function planMigration(supabase, items) {
  const plan = [];
  for (const item of items) {
    const entry = { item, action: ACTION.MIGRATE, state: "null", note: "", seedObject: null, liveLabel: null };
    try {
      const row = await readColumn(supabase, item);
      if (!row) {
        entry.action = ACTION.SKIP_MISSING;
        entry.state = "row missing";
      } else {
        const value = row[item.column];
        entry.state = describeState(value);
        entry.liveLabel = await liveName(supabase, item);
        if (value === null || value === undefined) {
          entry.seedObject = await seedObjectExists(supabase, item.path);
          entry.note = entry.seedObject ? "seed.jpg already in Storage" : "";
        } else if (entry.state === "empty string") {
          entry.action = ACTION.ERROR;
          entry.note = "image column is an empty string — needs a human look; not touched";
        } else {
          entry.action = ACTION.SKIP_EXISTING;
          entry.note = "existing image protected";
        }
      }
    } catch (err) {
      entry.action = ACTION.ERROR;
      entry.note = `inspection failed: ${err.message || err}`;
    }
    plan.push(entry);
  }
  return plan;
}

// ---------------------------------------------------------------------------
// Apply (mutations). Everything that writes goes through guard().
// ---------------------------------------------------------------------------
export function createMutator(supabase, apply) {
  const guard = (what) => {
    if (apply !== true) throw new Error(`Refusing to ${what}: not in --apply mode`);
  };
  const bucket = () => supabase.storage.from(BUCKET);
  return {
    async upload(path, bytes) {
      guard("upload");
      return bucket().upload(path, bytes, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
    },
    async updateIfNull(item) {
      guard("update the database");
      // Conditional on the column still being null: can never overwrite an image.
      return supabase.from(item.table).update({ [item.column]: item.path }).eq("id", item.id).is(item.column, null).select("id");
    },
    async remove(path) {
      guard("delete");
      return bucket().remove([path]);
    },
  };
}

const isAlreadyExists = (error) =>
  error && (String(error.statusCode) === "409" || /already exists|duplicate/i.test(error.message || ""));

// Apply one planned MIGRATE entry. Never throws; returns { outcome, detail }.
export async function applyOne(supabase, mutator, entry) {
  const { item } = entry;
  try {
    // A. the field must still be null right now
    const row = await readColumn(supabase, item);
    if (!row) return { outcome: "SKIPPED — row missing", detail: "deleted since the plan" };
    if (row[item.column] !== null && row[item.column] !== undefined) {
      return { outcome: "SKIPPED — existing image protected", detail: "an image appeared since the plan" };
    }

    // B. upload seed.jpg if it isn't already there
    let uploadedHere = false;
    const existed = await seedObjectExists(supabase, item.path);
    if (!existed) {
      const { error } = await mutator.upload(item.path, item.bytes);
      if (error && !isAlreadyExists(error)) throw error;
      uploadedHere = !error;
    }

    // C. conditional update — only if still null
    const { data, error } = await mutator.updateIfNull(item);
    if (error) {
      if (uploadedHere) await removeQuietly(mutator, item.path);
      throw error;
    }
    if (data?.length) return { outcome: "MIGRATED", detail: existed ? "seed.jpg already existed; DB pointer set" : "uploaded and DB pointer set" };

    // D. zero rows: someone populated it (or deleted the row) meanwhile — leave it alone
    if (uploadedHere) await removeQuietly(mutator, item.path);
    return { outcome: "SKIPPED — existing image protected", detail: `lost a race to a newer value; ${uploadedHere ? "our seed object was removed" : "nothing of ours to clean up"}` };
  } catch (err) {
    return { outcome: "FAILED", detail: err.message || String(err) };
  }
}

async function removeQuietly(mutator, path) {
  try {
    await mutator.remove(path);
  } catch {
    /* best-effort: a leftover seed.jpg is harmless and private */
  }
}

export async function runMigration(supabase, items, { apply = false } = {}) {
  const mutator = createMutator(supabase, apply);
  const plan = await planMigration(supabase, items);
  const results = [];
  if (apply) {
    for (const entry of plan) {
      if (entry.action === ACTION.MIGRATE) results.push({ entry, ...(await applyOne(supabase, mutator, entry)) });
    }
  }
  return { plan, results };
}

// ---------------------------------------------------------------------------
// Report (no secrets, no image bytes).
// ---------------------------------------------------------------------------
export function formatReport({ inventory, plan, results, apply }) {
  const lines = [];
  const count = (a) => plan.filter((p) => p.action === a).length;
  lines.push(`MODE: ${apply ? "APPLY (live changes)" : "DRY RUN (no uploads, no DB writes, no deletes)"}`, "");
  lines.push("SOURCE (src/data/itinerary-backup.json)");
  lines.push(`  hero found:          ${inventory.counts.hero}`);
  lines.push(`  stop images found:   ${inventory.counts.stop}`);
  lines.push(`  activity images:     ${inventory.counts.activity}`);
  lines.push(`  total:               ${inventory.total}`);
  lines.push(`  unique image hashes: ${inventory.uniqueHashes} (previously found: ${EXPECTED_UNIQUE_HASHES})`, "");
  lines.push("LIVE DATABASE");
  lines.push(`  eligible for migration:                 ${count(ACTION.MIGRATE)}`);
  lines.push(`  protected (image already exists):       ${count(ACTION.SKIP_EXISTING)}`);
  lines.push(`  missing / deleted rows:                 ${count(ACTION.SKIP_MISSING)}`);
  lines.push(`  errors:                                 ${count(ACTION.ERROR)}`, "");
  lines.push("PLANNED OPERATIONS");
  for (const p of plan) {
    const { item } = p;
    const name = p.liveLabel && !item.label.endsWith(p.liveLabel) ? `${item.label}  (live name: "${p.liveLabel}")` : item.label;
    lines.push(`  ${p.action.padEnd(13)} ${item.type.padEnd(8)} ${item.id}  ${name}`);
    lines.push(`                 current DB image: ${p.state}   path: ${item.path}${p.note ? `   [${p.note}]` : ""}`);
  }
  if (apply) {
    lines.push("", "RESULTS");
    for (const r of results) lines.push(`  ${r.outcome.padEnd(36)} ${r.entry.item.type.padEnd(8)} ${r.entry.item.id}  ${r.entry.item.label}  — ${r.detail}`);
    const failed = results.filter((r) => r.outcome === "FAILED");
    const migrated = results.filter((r) => r.outcome === "MIGRATED").length;
    lines.push("", `FINAL: ${migrated} migrated, ${results.length - migrated - failed.length} skipped at apply time, ${failed.length} failed`);
    if (failed.length) lines.push("FAILURES (safe to re-run; successful entities were kept):", ...failed.map((f) => `  - ${f.entry.item.label}: ${f.detail}`));
  } else {
    lines.push("", "Dry run only — nothing was changed.");
  }
  return lines.join("\n");
}
