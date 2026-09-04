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
