import { accommodationTotalPrice } from "@/lib/accommodation";

// Shared destination-cost calculation — the stop header and the Trip Summary
// both call this, so they can never drift apart. Nothing here is stored;
// everything is derived from the shared `stops` state.
//
// Destination total = the SELECTED (Ready to book) stay's total price
//                   + the cost of every activity that is Ready to book.
// Voting (including Everyone's pick) has no effect on cost; an activity counts
// once, whether or not it is also Everyone's pick. Activity cost is the whole-group price (never multiplied by headcount).
// Transport and extra costs are NOT part of a destination.
// `stops.cost` is deprecated and never read.

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function destinationBreakdown(stop) {
  const selected = (stop.accommodations || []).find((a) => a.id === stop.selectedAccommodationId);
  const accommodation = selected ? accommodationTotalPrice(selected) : 0;
  // A stay is selected but has no usable total price: counted as £0, flagged.
  const priceNeeded = Boolean(selected) && !(Number(selected.totalPrice) > 0);
  const activities = (stop.activities || [])
    .filter((a) => a.readyToBook)
    .reduce((sum, a) => sum + num(a.cost), 0);
  return { accommodation, activities, total: accommodation + activities, priceNeeded };
}

// Whole £ amounts show without decimals, matching the rest of the UI; a
// value with pence always shows exactly 2 decimal places.
export function formatMoney(n) {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}
