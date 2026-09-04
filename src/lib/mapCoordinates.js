// Static coordinate lookup for known trip destinations, used ONLY to place
// pins on the illustrated MAP view. This is presentation metadata — the stop
// objects (name, dates, description, photo, journey) remain the single
// source of truth; nothing here is itinerary data. No runtime geocoding: a
// destination not in this table simply has no pin (handled gracefully by the
// caller), never an invented location.
//
// Coordinates are well-known public city centroids (approximate, for a
// small-scale illustrative map — not survey-grade).
const DESTINATION_COORDS = {
  "Hanoi": [21.0285, 105.8542],
  "Hanoi (return)": [21.0285, 105.8542],
  "Sapa": [22.3364, 103.8438],
  "Ninh Binh": [20.2506, 105.9744],
  "Ha Long Bay": [20.9101, 107.1839],
  "Da Nang": [16.0544, 108.2022],
  "Hoi An": [15.8801, 108.3380],
  "Hue": [16.4637, 107.5909],
  "Ho Chi Minh City": [10.8231, 106.6297],
  "Phu Quoc": [10.2899, 103.984],
};

// Looks up a destination's [lat, lng] by its exact stop `loc` string.
// Returns null when unknown — callers must handle that gracefully, never
// fabricate a fallback position.
export function getCoordinates(loc) {
  if (!loc) return null;
  return DESTINATION_COORDS[loc] ?? null;
}

// A fixed bounding box — not derived from the current stop list, so the map
// never divides by zero with a single stop, and never shifts as stops are
// added/removed/reordered. Calibrated (not purely mathematical) against the
// specific illustrated artwork in src/assets/map/vietnam-map.webp: fitted so
// known reference points (the northern mountains near Sapa, Phu Quoc, Da
// Nang's coastal bulge) land in the same place in the painting as they sit
// in reality. This is the ONE shared calibration for every pin — real
// destination lat/lng data (above) is never adjusted per-stop to compensate.
const BOUNDS = { latMin: 8.4, latMax: 23.9, lngMin: 100.8, lngMax: 112.5 };

// Simple linear (equirectangular) projection — adequate at this scale for a
// small illustrative country map, not a precision GIS projection. Returns
// {xPct, yPct} in 0–100, suitable for absolute-positioning within a
// same-aspect-ratio container.
export function projectToPercent([lat, lng]) {
  const xPct = ((lng - BOUNDS.lngMin) / (BOUNDS.lngMax - BOUNDS.lngMin)) * 100;
  const yPct = (1 - (lat - BOUNDS.latMin) / (BOUNDS.latMax - BOUNDS.latMin)) * 100;
  return { xPct, yPct };
}
