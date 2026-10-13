import { TRIP_ID } from "./tripConfig";

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

// Database image URLs are intentionally null until the Storage migration, so
// images fall back to the bundled local JSON, matched by stop name (+ activity
// name within that stop). Temporary: goes away once photo_url/image_url are set.
export function buildItineraryFromRows(rows, localItinerary) {
  const localStops = new Map((localItinerary?.days || []).map((d) => [d.loc, d]));
  const localPhoto = (loc) => localStops.get(loc)?.photo ?? null;
  const localImage = (loc, name) =>
    localStops.get(loc)?.activities?.find((a) => a.name === name)?.image ?? null;

  const days = rows.stops.map((s) => ({
    id: s.id,
    loc: s.loc,
    date: s.date || "",
    desc: s.description || "",
    tag: "",
    cost: Number(s.cost),
    photo: s.photo_url || localPhoto(s.loc),
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
        image: a.image_url || localImage(s.loc, a.name),
        travelTime: a.travel_time || "",
        voteMap: toVoteMap(rows.activityVotes, "activity_id", a.id),
      })),
    accommodations: rows.accommodations
      .filter((a) => a.stop_id === s.id)
      .map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        location: a.location,
        image: a.image_url || null,
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
    heroPhoto: rows.trip.hero_photo_url || localItinerary?.heroPhoto || null,
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
