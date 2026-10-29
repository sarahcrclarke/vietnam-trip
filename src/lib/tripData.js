import { TRIP_ID } from "./tripConfig";
import { newAccommodationId } from "./accommodation";
import { isStoragePath, resolveStoredImage } from "./imageStorage";

// READ-ONLY access layer: membership check, join, and fetching the trip's
// relational rows, plus an adapter that reshapes those rows into the
// itinerary-backup.json shape the UI already consumes (so Itinerary/TripPlanner
// keep working unchanged). Nothing here writes trip content.

export async function checkMembership(supabase) {
  const { data, error } = await supabase
    .from("trip_access")
    .select("trip_id")
    .eq("trip_id", TRIP_ID)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

// Only ever calls the join_trip RPC — the invite-code table is never queried.
export async function joinTrip(supabase, code) {
  const { error } = await supabase.rpc("join_trip", { trip_code: code });
  if (!error) return { ok: true };
  const invalid = /invalid trip code/i.test(error.message || "");
  return { ok: false, invalid };
}

export async function fetchTripRows(supabase) {
  const bySort = (q) => q.order("sort_order", { ascending: true });
  const [trip, travellers, stops, journey, activities, actVotes, accs, accVotes, extras] =
    await Promise.all([
      supabase.from("trips").select("*").eq("id", TRIP_ID).maybeSingle(),
      bySort(supabase.from("travellers").select("*").eq("trip_id", TRIP_ID)),
      bySort(supabase.from("stops").select("*").eq("trip_id", TRIP_ID)),
      bySort(supabase.from("journey_items").select("*")),
      bySort(supabase.from("activities").select("*")),
      supabase.from("activity_votes").select("*"),
      bySort(supabase.from("accommodations").select("*")),
      supabase.from("accommodation_votes").select("*"),
      bySort(supabase.from("extra_costs").select("*").eq("trip_id", TRIP_ID)),
    ]);
  for (const r of [trip, travellers, stops, journey, activities, actVotes, accs, accVotes, extras]) {
    if (r.error) throw r.error;
  }
  if (!trip.data) throw new Error("Trip not found");
  return {
    trip: trip.data,
    travellers: travellers.data,
    stops: stops.data,
    journey: journey.data,
    activities: activities.data,
    activityVotes: actVotes.data,
    accommodations: accs.data,
    accommodationVotes: accVotes.data,
    extraCosts: extras.data,
  };
}

const toVoteMap = (rows, key, id) => {
  const map = {};
  for (const v of rows) if (v[key] === id) map[v.traveller_id] = true;
  return map;
};

const hhmm = (t) => (t ? String(t).slice(0, 5) : "");

function toLeg(r) {
  return {
    id: r.id,
    type: "leg",
    mode: r.mode || "",
    dur: r.dur || "",
    cost: Number(r.cost) > 0 ? String(r.cost) : "",
    depDate: r.dep_date || "",
    depTime: hhmm(r.dep_time),
    depLoc: r.dep_loc || "",
    arrDate: r.arr_date || "",
    arrTime: hhmm(r.arr_time),
    arrLoc: r.arr_loc || "",
    bookingRef: r.booking_ref || "",
    serviceNumber: r.service_number || "",
    travellerIds: r.traveller_ids || [],
  };
}

// Every private Storage path currently held in an image column, for one
// batched signing request. Null / legacy values are ignored.
export function collectImagePaths(rows) {
  const values = [
    rows.trip.hero_photo_url,
    ...rows.stops.map((s) => s.photo_url),
    ...rows.activities.map((a) => a.image_url),
    ...rows.accommodations.map((a) => a.image_url),
  ];
  return [...new Set(values.filter(isStoragePath))];
}

// Image columns hold a Storage path (shown via its signed URL; `signedUrls` is
// path -> URL), a legacy URL (used as-is) or null. Where there's no usable
// stored image — null, or a path that couldn't be signed — images fall back to
// the bundled local JSON, matched by stop name (+ activity position within that
// stop). Temporary: the fallback goes away once every row has a verified path.
// The display value stays in `photo` / `image` (what components render); the
// stored path is kept alongside in `photoPath` / `imagePath` / `heroPhotoPath`.
export function buildItineraryFromRows(rows, localItinerary, signedUrls = new Map()) {
  const stored = (value) => resolveStoredImage(value, signedUrls);
  const localStops = new Map((localItinerary?.days || []).map((d) => [d.loc, d]));
  const localPhoto = (loc) => localStops.get(loc)?.photo ?? null;
  // Seeded activities have sort_order = their position in the bundled JSON
  // (supabase/seed-vietnam-trip.sql), so the position — not the name, which
  // is editable and persisted — finds the bundled image.
  // Activities added in the app are numbered from NEW_ACTIVITY_SORT_BASE up, so
  // they can never land on a bundled position and inherit a seeded image.
  const localImage = (loc, sortOrder) =>
    sortOrder < NEW_ACTIVITY_SORT_BASE ? localStops.get(loc)?.activities?.[sortOrder]?.image ?? null : null;

  const days = rows.stops.map((s) => ({
    id: s.id,
    loc: s.loc,
    date: s.date || "",
    desc: s.description || "",
    tag: "",
    photo: stored(s.photo_url).url || localPhoto(s.loc),
    photoPath: stored(s.photo_url).path,
    journey: rows.journey
      .filter((j) => j.stop_id === s.id)
      .map((j) =>
        j.item_type === "stopover"
          ? { id: j.id, type: "stopover", loc: j.loc || "", dur: j.dur || "" }
          : toLeg(j)
      ),
    activities: rows.activities
      .filter((a) => a.stop_id === s.id)
      .map((a) => ({
        id: a.id,
        name: a.name,
        link: a.link || "",
        cost: Number(a.cost),
        image: stored(a.image_url).url || localImage(s.loc, a.sort_order),
        imagePath: stored(a.image_url).path,
        travelTime: a.travel_time || "",
        readyToBook: Boolean(a.ready_to_book),
        sortOrder: a.sort_order,
        voteMap: toVoteMap(rows.activityVotes, "activity_id", a.id),
      })),
    accommodations: rows.accommodations
      .filter((a) => a.stop_id === s.id)
      .map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        location: a.location,
        image: stored(a.image_url).url,
        imagePath: stored(a.image_url).path,
        pricePerNight: a.price_per_night == null ? null : Number(a.price_per_night),
        totalPrice: a.total_price == null ? null : Number(a.total_price),
        rating: a.rating == null ? null : Number(a.rating),
        reviewCount: a.review_count,
        link: a.link || "",
        ...(a.source ? { source: a.source } : {}),
        votes: toVoteMap(rows.accommodationVotes, "accommodation_id", a.id),
      })),
    accommodationWishlistUrl: s.accommodation_wishlist_url || "",
    selectedAccommodationId: s.selected_accommodation_id || null,
  }));

  return {
    title: rows.trip.title,
    subtitle: rows.trip.subtitle,
    depart: rows.trip.depart,
    return: rows.trip.return_date,
    currency: rows.trip.currency,
    heroPhoto: stored(rows.trip.hero_photo_url).url || localItinerary?.heroPhoto || null,
    heroPhotoPath: stored(rows.trip.hero_photo_url).path,
    extraCosts: rows.extraCosts.map((e) => ({ id: e.id, label: e.label, cost: Number(e.amount) })),
    days,
  };
}

export function buildTravellersFromRows(rows) {
  return rows.travellers.map((t) => ({
    id: t.id,
    initials: t.initials,
    name: t.name,
    voter: t.voter,
    included: t.included,
  }));
}

// WRITE: the only trip content persisted so far — activity votes. One row per
// (activity, traveller); present = voted. Writes for the same pair are chained
// so a quick vote/un-vote can't land out of order.
export function createActivityVoteWriter(supabase) {
  const chains = new Map();
  return (activityId, travellerId, selected) => {
    const key = `${activityId}:${travellerId}`;
    const run = async () => {
      if (selected) {
        const { error } = await supabase
          .from("activity_votes")
          .insert({ activity_id: activityId, traveller_id: travellerId });
        if (error && error.code !== "23505") throw error; // already voted = fine
      } else {
        const { error } = await supabase
          .from("activity_votes")
          .delete()
          .eq("activity_id", activityId)
          .eq("traveller_id", travellerId);
        if (error) throw error;
      }
    };
    const next = (chains.get(key) ?? Promise.resolve()).catch(() => {}).then(run);
    chains.set(key, next);
    return next;
  };
}

// New activities are numbered from here up (existing ones are 0..n from the
// seed), so a new row always sorts after every seeded one, stays in creation
// order, and never collides with a seeded position after deletes.
export const NEW_ACTIVITY_SORT_BASE = 1000;
export const nextActivitySortOrder = (activities) =>
  Math.max(NEW_ACTIVITY_SORT_BASE - 1, ...activities.map((a) => (Number.isInteger(a.sortOrder) ? a.sortOrder : -1))) + 1;
export const newActivityId = newAccommodationId; // activities.id is a uuid too

// Per-activity write ordering shared by every write that targets one
// activity row (insert, ready flag, field edits, delete): run(id, fn) chains fn
// after whatever is already pending for that id, and ready(id) resolves
// (never rejects) once everything queued so far has finished — so a vote, a
// ready toggle or an edit made straight after adding an activity waits for its
// INSERT, and a delete waits for any write still in flight.
export function createActivityQueue() {
  const chains = new Map();
  return {
    run(id, fn) {
      const next = (chains.get(id) ?? Promise.resolve()).catch(() => {}).then(fn);
      chains.set(id, next);
      return next;
    },
    ready: (id) => (chains.get(id) ?? Promise.resolve()).catch(() => {}),
  };
}

// WRITE: adding / deleting an activity row in public.activities. Insert writes
// only the columns granted for INSERT (image_url is never written); delete
// treats a zero-row result as a failure. The activity_votes rows of a deleted
// activity go with it (ON DELETE CASCADE).
export function createActivityWriter(supabase, queue = createActivityQueue()) {
  return {
    insert: (stopId, activity) =>
      queue.run(activity.id, async () => {
        const { error } = await supabase.from("activities").insert({
          id: activity.id,
          stop_id: stopId,
          name: activity.name || "",
          link: activity.link && activity.link.trim() ? activity.link : null,
          cost: activityCostColumn(activity.cost),
          travel_time: activity.travelTime && activity.travelTime.trim() ? activity.travelTime : null,
          sort_order: activity.sortOrder,
          ready_to_book: Boolean(activity.readyToBook),
        });
        if (error) throw error;
      }),
    remove: (id) =>
      queue.run(id, async () => {
        const { data, error } = await supabase.from("activities").delete().eq("id", id).select("id");
        if (error) throw error;
        if (!data?.length) throw new Error("Activity not deleted"); // RLS filtered it out / already gone
      }),
  };
}

// WRITE: an activity's Ready to book flag — the only column the app may update
// on public.activities (column-level grant). Several activities per stop can be
// ready, so unlike the selected stay there is no per-stop state: writes are
// chained per activity so rapid on/off clicks land in order. A zero-row update
// (RLS filtered it out, or the row doesn't exist) is a failure.
export function createActivityReadyWriter(supabase, queue = createActivityQueue()) {
  return (activityId, ready) =>
    queue.run(activityId, async () => {
      const { data, error } = await supabase
        .from("activities")
        .update({ ready_to_book: Boolean(ready) })
        .eq("id", activityId)
        .select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Activity not updated");
    });
}

// WRITE: an existing activity's own fields — name, link, cost, travel_time
// (the only activities columns besides ready_to_book that the app may update;
// column-level grant). Like the stop fields, these inputs fire on every
// keystroke, so edits are coalesced: save(activityId, columns) merges into one
// pending patch per activity and writes it after a short pause. Writes for the
// same activity are chained, so a later patch can never land before an earlier
// one. save() returns a promise that settles when the batch holding that edit
// has been written (rejects if it failed; a zero-row update is a failure).
export function createActivityFieldWriter(supabase, delayMs = 600, queue = createActivityQueue()) {
  const pending = new Map();

  const flush = (activityId) => {
    const entry = pending.get(activityId);
    if (!entry) return;
    pending.delete(activityId);
    clearTimeout(entry.timer);
    const next = queue.run(activityId, async () => {
      const { data, error } = await supabase.from("activities").update(entry.patch).eq("id", activityId).select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Activity not updated"); // RLS filtered it out
    });
    next.then(
      () => entry.waiters.forEach((w) => w.resolve()),
      (err) => entry.waiters.forEach((w) => w.reject(err))
    );
  };

  const flushAll = () => [...pending.keys()].forEach(flush);
  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", flushAll);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushAll();
    });
  }

  const save = (activityId, columns) =>
    new Promise((resolve, reject) => {
      const entry = pending.get(activityId) ?? { patch: {}, waiters: [], timer: null };
      Object.assign(entry.patch, columns);
      entry.waiters.push({ resolve, reject });
      clearTimeout(entry.timer);
      entry.timer = setTimeout(() => flush(activityId), delayMs);
      pending.set(activityId, entry);
    });
  // The activity is being deleted: drop its not-yet-written edits (they would
  // only hit a row that no longer exists).
  save.discard = (activityId) => {
    const entry = pending.get(activityId);
    if (!entry) return;
    pending.delete(activityId);
    clearTimeout(entry.timer);
    entry.waiters.forEach((w) => w.resolve());
  };
  return save;
}

// The typed cost string -> the numeric(10,2) column. Empty or incomplete input
// ("", ".") is written as 0 — only the database copy; the input itself keeps
// whatever is being typed. Out-of-range values are left for the database to
// reject (the edit then rolls back with the usual message).
export function activityCostColumn(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

// WRITE: accommodation cards (add / edit / remove) in public.accommodations.
// Only the card's own fields are written — votes, the selected stay, the
// wishlist URL and images (image_url stays null until the Storage migration)
// are not. Writes for the same accommodation are chained so an add followed
// quickly by an edit or remove can't land out of order.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value) => typeof value === "string" && UUID_RE.test(value);

const num = (v) => (v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

function toAccommodationColumns(a) {
  return {
    name: a.name || "",
    type: a.type || "",
    location: a.location || "",
    price_per_night: num(a.pricePerNight),
    total_price: num(a.totalPrice),
    rating: num(a.rating),
    review_count: num(a.reviewCount),
    link: a.link || null,
  };
}

export function createAccommodationWriter(supabase) {
  const chains = new Map();
  const queue = (id, run) => {
    const next = (chains.get(id) ?? Promise.resolve()).catch(() => {}).then(run);
    chains.set(id, next);
    return next;
  };
  return {
    // Resolves once any pending add/edit/remove for this accommodation has
    // finished (never rejects) — lets a vote wait for its card's row to exist.
    ready: (id) => (chains.get(id) ?? Promise.resolve()).catch(() => {}),
    insert: (stopId, accommodation, sortOrder) =>
      queue(accommodation.id, async () => {
        const { error } = await supabase.from("accommodations").insert({
          id: accommodation.id,
          stop_id: stopId,
          ...toAccommodationColumns(accommodation),
          source: accommodation.source || null,
          sort_order: sortOrder,
        });
        if (error) throw error;
      }),
    update: (accommodation) =>
      queue(accommodation.id, async () => {
        const { error } = await supabase
          .from("accommodations")
          .update(toAccommodationColumns(accommodation))
          .eq("id", accommodation.id);
        if (error) throw error;
      }),
    remove: (id) =>
      queue(id, async () => {
        const { error } = await supabase.from("accommodations").delete().eq("id", id);
        if (error) throw error;
      }),
  };
}

// WRITE: accommodation votes — same insert / delete pattern as activity votes,
// into public.accommodation_votes. One row per (accommodation, traveller);
// present = voted. The traveller is the pill that was clicked (no auth.uid()
// mapping). Writes for the same pair are chained so a quick vote/un-vote
// can't land out of order.
export function createAccommodationVoteWriter(supabase) {
  const chains = new Map();
  return (accommodationId, travellerId, selected) => {
    const key = `${accommodationId}:${travellerId}`;
    const run = async () => {
      if (selected) {
        const { error } = await supabase
          .from("accommodation_votes")
          .insert({ accommodation_id: accommodationId, traveller_id: travellerId });
        if (error && error.code !== "23505") throw error; // already voted = fine
      } else {
        const { error } = await supabase
          .from("accommodation_votes")
          .delete()
          .eq("accommodation_id", accommodationId)
          .eq("traveller_id", travellerId);
        if (error) throw error;
      }
    };
    const next = (chains.get(key) ?? Promise.resolve()).catch(() => {}).then(run);
    chains.set(key, next);
    return next;
  };
}

// WRITE: a stop's selected stay — the only column the app may update on
// public.stops (column-level grant). null clears the selection. Writes for the
// same stop are chained so rapid select/deselect clicks land in order. The
// database (composite FK) rejects an accommodation from a different stop.
export function createSelectedAccommodationWriter(supabase) {
  const chains = new Map();
  return (stopId, accommodationId) => {
    const run = async () => {
      const { data, error } = await supabase
        .from("stops")
        .update({ selected_accommodation_id: accommodationId ?? null })
        .eq("id", stopId)
        .select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Stop not updated"); // RLS filtered it out
    };
    const next = (chains.get(stopId) ?? Promise.resolve()).catch(() => {}).then(run);
    chains.set(stopId, next);
    return next;
  };
}

// WRITE: a stop's own text fields — loc, description, date and
// accommodation_wishlist_url (the only stop columns besides the selected stay
// that the app may update; column-level grant). These inputs fire on every
// keystroke, so edits are coalesced: save(stopId, columns) merges into one
// pending patch per stop and writes it after a short pause. Writes for the
// same stop are chained, so a later patch can never land before an earlier
// one. save() returns a promise that settles when the batch holding that edit
// has been written (rejects if it failed).
export function createStopFieldWriter(supabase, delayMs = 600) {
  const chains = new Map();
  const pending = new Map();

  const flush = (stopId) => {
    const entry = pending.get(stopId);
    if (!entry) return;
    pending.delete(stopId);
    clearTimeout(entry.timer);
    const run = async () => {
      const { data, error } = await supabase.from("stops").update(entry.patch).eq("id", stopId).select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Stop not updated"); // RLS filtered it out
    };
    const next = (chains.get(stopId) ?? Promise.resolve()).catch(() => {}).then(run);
    chains.set(stopId, next);
    next.then(
      () => entry.waiters.forEach((w) => w.resolve()),
      (err) => entry.waiters.forEach((w) => w.reject(err))
    );
  };

  const flushAll = () => [...pending.keys()].forEach(flush);
  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", flushAll);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushAll();
    });
  }

  return (stopId, columns) =>
    new Promise((resolve, reject) => {
      const entry = pending.get(stopId) ?? { patch: {}, waiters: [], timer: null };
      Object.assign(entry.patch, columns);
      entry.waiters.push({ resolve, reject });
      clearTimeout(entry.timer);
      entry.timer = setTimeout(() => flush(stopId), delayMs);
      pending.set(stopId, entry);
    });
}
