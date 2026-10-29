// READ-ONLY helpers for images held in the private `trip-photos` bucket.
//
// The image columns (trips.hero_photo_url, stops.photo_url,
// activities.image_url, accommodations.image_url) hold a Storage OBJECT PATH
// of the form `<trip_id>/...`, never a URL. A private object can only be shown
// through a short-lived signed URL, so paths are signed in one batch when the
// trip loads (and again before they expire — see Itinerary). Nothing here
// uploads, replaces or deletes anything.
//
// Columns may also still hold (or be null for) legacy values; those keep
// working: data:image / blob: / http(s) values are used as the display URL
// as-is, and null falls back to the bundled local image (tripData.js).

export const IMAGE_BUCKET = "trip-photos";

// Signed URLs live for an hour; callers re-sign before then.
export const SIGNED_URL_TTL_SECONDS = 3600;
export const SIGNED_URL_REFRESH_MS = 45 * 60 * 1000;

// A storage path always starts with the trip's uuid folder (the segment the
// bucket's RLS policies check). Anything else is not treated as a path.
const STORAGE_PATH_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[^\s]+$/i;
const LEGACY_URL_RE = /^(data:image\/|blob:|https?:\/\/)/i;

export const isStoragePath = (value) => typeof value === "string" && STORAGE_PATH_RE.test(value);

// True for a URL this module signed (used to avoid overwriting a local
// replacement image with a refreshed URL).
export const isSignedStorageUrl = (value) =>
  typeof value === "string" && value.includes(`/object/sign/${IMAGE_BUCKET}/`);

// Split one stored column value into { path, url }:
//   storage path -> path set, url = its signed URL (null if not signed)
//   legacy URL   -> path null, url = the value itself
//   null / junk  -> both null (caller falls back to the bundled image)
export function resolveStoredImage(value, signedUrls) {
  if (isStoragePath(value)) return { path: value, url: signedUrls?.get(value) ?? null };
  if (typeof value === "string" && LEGACY_URL_RE.test(value)) return { path: null, url: value };
  return { path: null, url: null };
}

// One batched request for all paths. Never throws: on any failure the missing
// paths simply aren't in the map, and the caller falls back to the bundled
// image (so a signing problem can't blank the page or break loading).
export async function signStoragePaths(supabase, paths, expiresIn = SIGNED_URL_TTL_SECONDS) {
  const urls = new Map();
  const unique = [...new Set((paths || []).filter(isStoragePath))];
  if (!supabase || unique.length === 0) return urls;
  try {
    const { data, error } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrls(unique, expiresIn);
    if (error) throw error;
    for (const item of data || []) {
      if (item.path && item.signedUrl && !item.error) urls.set(item.path, item.signedUrl);
    }
  } catch (err) {
    console.error("Couldn't sign image URLs", err);
  }
  return urls;
}
