// Derives a destination's stay length from adjacent dates (this stop's date
// through the next stop's date, or the trip's return date for the final
// stop) instead of a manually maintained "X days" tag.

export function daysBetween(fromISO, toISO) {
  if (!fromISO || !toISO) return null;
  const from = new Date(`${fromISO}T00:00:00`);
  const to = new Date(`${toISO}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

// Fails gracefully: missing/invalid dates or a non-positive span (e.g. the
// final return-day stop compared against its own date) render nothing rather
// than a misleading duration.
export function formatDuration(days) {
  if (days == null || days <= 0) return null;
  return `${days} day${days === 1 ? "" : "s"}`;
}
