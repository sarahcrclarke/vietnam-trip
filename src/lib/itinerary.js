import itinerary from "@/data/itinerary-backup.json";

export function getItinerary() {
  return itinerary;
}

export function getDays() {
  return itinerary.days;
}

export function getActivities() {
  return itinerary.days.flatMap((day) => day.activities);
}
