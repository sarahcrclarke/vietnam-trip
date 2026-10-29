// Accommodation pricing helpers.
//
// pricePerNight is reference/display information only. totalPrice is the
// single independently-editable figure the Trip Summary reads for a
// selected stay — it is never derived from pricePerNight or a fixed number
// of nights.
export function accommodationTotalPrice(accommodation) {
  const total = Number(accommodation?.totalPrice);
  if (!Number.isFinite(total) || total < 0) return 0;
  return total;
}

// Migrates a legacy accommodation (single `price` = per-night rate) into
// the current shape with independent `pricePerNight` and `totalPrice`
// fields, without inventing a total from the nightly rate.
export function migrateAccommodation(acc) {
  const { price, ...rest } = acc;
  return {
    ...rest,
    pricePerNight: acc.pricePerNight ?? price ?? null,
    totalPrice: acc.totalPrice ?? null,
    votes: acc.votes || {},
  };
}

// Matches airbnb.com and regional Airbnb domains (airbnb.co.uk, airbnb.de,
// airbnb.com.au, ...), with or without a "www." subdomain. Used only for a
// lightweight client-side sanity check on a pasted URL — never to fetch it.
const AIRBNB_HOST_RE = /(^|\.)airbnb\.[a-z]{2,}(\.[a-z]{2,})?$/i;

export function isAirbnbUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return AIRBNB_HOST_RE.test(url.hostname);
  } catch {
    return false;
  }
}

// Real UUID so a new accommodation has the same id in the UI and in the
// database (accommodations.id is a uuid).
export function newAccommodationId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === "x" ? r : (r & 3) | 8).toString(16);
  });
}

// --- Price calculation ------------------------------------------------------
// Nights for a stop = its own date through the NEXT stop's date (or the trip
// return date for the final stop) — the same date span the stop's duration
// label is derived from. Arrive on the 1st, next stop on the 4th = 3 nights.
// Returns null when the dates are missing/invalid or the span isn't positive.
export function accommodationNights(daysBetweenResult) {
  return Number.isInteger(daysBetweenResult) && daysBetweenResult > 0 ? daysBetweenResult : null;
}

import { formatMoney } from "@/lib/money";
export { formatMoney };

const parseAmount = (value) => {
  if (value == null || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

// total / nights -> per-night string, or null if it can't be derived.
export function derivePricePerNight(total, nights) {
  const t = parseAmount(total);
  if (t == null || !nights) return null;
  return formatMoney(t / nights);
}

// per-night x nights -> total string, or null if it can't be derived.
export function deriveTotalPrice(pricePerNight, nights) {
  const p = parseAmount(pricePerNight);
  if (p == null || !nights) return null;
  return formatMoney(p * nights);
}

// total / included travellers (one flat split — no adult/child pricing).
export function pricePerPerson(total, travellerCount) {
  const t = parseAmount(total);
  if (t == null || t === 0 || !travellerCount) return null;
  return formatMoney(t / travellerCount);
}
