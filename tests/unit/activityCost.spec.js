import { test, expect } from "@playwright/test";
import { buildItineraryFromRows, activityCostColumn } from "../../src/lib/tripData";
import { activityCostToInput, isFreeActivityCost, formatMoney } from "../../src/lib/money";
import { destinationBreakdown } from "../../src/lib/cost";

const TRIP = "cb2a7994-4560-4118-9bb2-100d371785cf";
const STOP = "03626c17-7523-4a65-a01b-a76383a9819e";

// Minimal relational rows, shaped like what PostgREST returns for one stop
// with one activity whose cost is `dbCost` (number, numeric-string or null).
function rowsWithActivity(dbCost, extra = {}) {
  return {
    trip: { id: TRIP, title: "t", subtitle: "", depart: null, return_date: null, currency: "£", hero_photo_url: null },
    travellers: [],
    stops: [{ id: STOP, loc: "Hanoi", date: null, description: "", photo_url: null, sort_order: 0, accommodation_wishlist_url: null, selected_accommodation_id: null }],
    journey: [],
    activities: [
      { id: "a931d935-2aa9-4773-9e6d-1f91f4b16d0f", stop_id: STOP, name: "Train Street", link: null, cost: dbCost, image_url: null, travel_time: null, ready_to_book: false, sort_order: 0, ...extra },
    ],
    activityVotes: [],
    accommodations: [],
    accommodationVotes: [],
    extraCosts: [],
  };
}
const mapped = (dbCost, extra) => buildItineraryFromRows(rowsWithActivity(dbCost, extra), null).days[0].activities[0];

test("1. a persisted activity cost of 0 survives reload/mapping as numeric 0 (and reloads as '0', not blank)", () => {
  for (const stored of [0, "0", "0.00"]) {
    const a = mapped(stored);
    expect(a.cost).toBe(0);
    expect(activityCostToInput(a.cost)).toBe("0");
    expect(isFreeActivityCost(activityCostToInput(a.cost))).toBe(true);
  }
});

test("2. activity cost 0 is shown as 'Free activity' (the card's display rule)", () => {
  expect(isFreeActivityCost(activityCostToInput(mapped(0).cost))).toBe(true);
  expect(isFreeActivityCost("0")).toBe(true);
  expect(isFreeActivityCost("0.00")).toBe(true);
  expect(isFreeActivityCost("")).toBe(false); // no price: placeholder, not Free
  expect(isFreeActivityCost("8.5")).toBe(false);
});

test("3. paid activity costs keep two-decimal formatting", () => {
  expect(formatMoney(mapped(8.5).cost)).toBe("8.50");
  expect(formatMoney(mapped(2).cost)).toBe("2.00");
  expect(formatMoney(mapped(8.55).cost)).toBe("8.55");
  expect(isFreeActivityCost(activityCostToInput(mapped(8.5).cost))).toBe(false);
});

test("4. a Ready to Book free activity contributes £0 and does not trigger 'Price needed'", () => {
  const freeReady = { readyToBook: true, cost: activityCostToInput(0) }; // "0", as the app holds it
  const stop = { selectedAccommodationId: null, accommodations: [], activities: [freeReady, { readyToBook: true, cost: "8.5" }] };
  const b = destinationBreakdown(stop);
  expect(b.activities).toBe(8.5); // the free one adds exactly 0
  expect(b.priceNeeded).toBe(false);
  const onlyFree = destinationBreakdown({ selectedAccommodationId: null, accommodations: [], activities: [freeReady] });
  expect(onlyFree.total).toBe(0);
  expect(onlyFree.priceNeeded).toBe(false);
});

test("5. null / missing cost stays distinct from an explicit 0", () => {
  const missing = mapped(null);
  expect(missing.cost).toBeNull();
  expect(activityCostToInput(missing.cost)).toBe(""); // blank = no price entered
  expect(isFreeActivityCost(activityCostToInput(missing.cost))).toBe(false);
  expect(activityCostToInput(undefined)).toBe("");

  const free = mapped(0);
  expect(free.cost).toBe(0);
  expect(activityCostToInput(free.cost)).not.toBe(activityCostToInput(missing.cost));
});

test("saving: cleared cost is written as NULL, an explicit 0 as 0, paid amounts rounded to pence", () => {
  expect(activityCostColumn("")).toBeNull();
  expect(activityCostColumn("   ")).toBeNull();
  expect(activityCostColumn(".")).toBeNull(); // incomplete input = no price
  expect(activityCostColumn("0")).toBe(0);
  expect(activityCostColumn("0.")).toBe(0);
  expect(activityCostColumn("8.5")).toBe(8.5);
  expect(activityCostColumn("8.555")).toBe(8.56);
});
