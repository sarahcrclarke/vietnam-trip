#!/usr/bin/env node
// One-off: move the bundled trip images (src/data/itinerary-backup.json) into
// the private `trip-photos` bucket and the existing DB image columns.
//
//   DRY RUN (default, changes nothing):  node scripts/migrate-seed-images.mjs
//   LIVE (explicit):                     node scripts/migrate-seed-images.mjs --apply
//
// Signs in as a normal anonymous trip member (no service-role key). Environment:
//   SUPABASE_URL | NEXT_PUBLIC_SUPABASE_URL            project URL
//   SUPABASE_ANON_KEY | NEXT_PUBLIC_SUPABASE_ANON_KEY  publishable/anon key
//   TRIP_INVITE_CODE                                   the family trip code
// The code is read from the environment only — never from a file, never logged,
// never written anywhere. The auth session is kept in memory only.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { buildInventory, formatReport, parseSeedMapping, runMigration } from "./lib/seedImageMigration.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const unknown = args.filter((a) => a !== "--apply");
if (unknown.length) {
  console.error(`Unknown argument(s): ${unknown.join(" ")}\nThe only option is --apply (omit it for a dry run).`);
  process.exit(2);
}
const apply = args.includes("--apply");

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const code = process.env.TRIP_INVITE_CODE;
if (!url || !anonKey) {
  console.error("Missing SUPABASE_URL / SUPABASE_ANON_KEY (or the NEXT_PUBLIC_ equivalents).");
  process.exit(2);
}

async function main() {
  // Source first: abort before touching the network if the inventory is wrong.
  const itinerary = JSON.parse(readFileSync(join(root, "src/data/itinerary-backup.json"), "utf8"));
  const seed = parseSeedMapping(readFileSync(join(root, "supabase/seed-vietnam-trip.sql"), "utf8"));
  const inventory = buildInventory(itinerary, seed);

  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { error: authError } = await supabase.auth.signInAnonymously();
  if (authError) throw new Error(`Anonymous sign-in failed: ${authError.message}`);

  // Membership (the only side effect of a dry run: this anonymous user joins the trip).
  const { data: member, error: memberError } = await supabase.from("trip_access").select("trip_id").eq("trip_id", seed.tripId).maybeSingle();
  if (memberError) throw memberError;
  if (!member) {
    if (!code) throw new Error("Not a trip member yet and TRIP_INVITE_CODE is not set.");
    const { error } = await supabase.rpc("join_trip", { trip_code: code });
    if (error) throw new Error(/invalid trip code/i.test(error.message || "") ? "The trip code was rejected." : `join_trip failed: ${error.message}`);
  }

  const { plan, results } = await runMigration(supabase, inventory.items, { apply });
  console.log(formatReport({ inventory, plan, results, apply }));
  if (results.some((r) => r.outcome === "FAILED") || plan.some((p) => p.action === "ERROR")) process.exitCode = 1;
}

main().catch((err) => {
  console.error(`ABORTED: ${err.message || err}`);
  process.exit(1);
});
