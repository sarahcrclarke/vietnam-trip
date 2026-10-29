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

// ---------------------------------------------------------------------------
// WRITE side: client-side processing + object paths (used by the image writers
// in tripData.js). Uploads always go to a NEW unique path; nothing is ever
// overwritten in place.
// ---------------------------------------------------------------------------

export const MAX_SOURCE_BYTES = 25 * 1024 * 1024; // phone-photo source limit
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // the bucket's own file_size_limit
export const IMAGE_MAX_EDGE = 1000;
export const IMAGE_JPEG_QUALITY = 0.8;

// An error whose message is safe to show to the user as-is.
export class ImageUploadError extends Error {}

const ACCEPTED_NAME_RE = /\.(jpe?g|png|webp|gif|heic|heif)$/i;

function loadElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode failed"));
    };
    img.src = url;
  });
}

// Orientation-correct decode. createImageBitmap is told to honour EXIF
// orientation; browsers without it fall back to an <img>, which does so by
// default.
async function decodeImage(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* fall through to <img> */
    }
  }
  return loadElement(file);
}

// Any phone photo -> a JPEG blob, longest edge <= IMAGE_MAX_EDGE, quality 0.8.
// Re-encoding through a canvas drops EXIF (including GPS). Throws
// ImageUploadError with a friendly message for anything unusable.
export async function processImageFile(file) {
  const looksLikeImage = file && ((file.type && file.type.startsWith("image/")) || ACCEPTED_NAME_RE.test(file.name || ""));
  if (!looksLikeImage) throw new ImageUploadError("That file isn't a photo we can use.");
  if (file.size > MAX_SOURCE_BYTES) throw new ImageUploadError("That photo is too large (25 MB max).");

  let source;
  try {
    source = await decodeImage(file);
  } catch {
    throw new ImageUploadError("Couldn't read that photo. Try a JPEG or PNG.");
  }
  try {
    const width = source.width;
    const height = source.height;
    if (!width || !height) throw new ImageUploadError("Couldn't read that photo. Try a JPEG or PNG.");
    const scale = Math.min(1, IMAGE_MAX_EDGE / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; // JPEG has no alpha: flatten transparent PNGs onto white
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", IMAGE_JPEG_QUALITY));
    if (!blob || blob.type !== "image/jpeg") throw new ImageUploadError("Couldn't prepare that photo. Please try another.");
    if (blob.size > MAX_UPLOAD_BYTES) throw new ImageUploadError("That photo is still too large after resizing.");
    return blob;
  } finally {
    source.close?.();
  }
}

// <trip_id>/activities/<activity_id>/<unique-file-id>.jpg — the first segment
// is what the bucket's membership policies check.
export const newActivityImagePath = (tripId, activityId) =>
  `${tripId}/activities/${activityId}/${crypto.randomUUID()}.jpg`;
