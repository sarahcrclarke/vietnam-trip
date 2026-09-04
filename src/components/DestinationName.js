"use client";

// Editable destination heading. Borderless — keeps the existing serif / size /
// dark-green treatment so it reads as the heading, not a form field.
// Controlled by Itinerary's stops state (not local) because MAP and VOTES
// both read a stop's name straight from `stops` and must reflect an edit
// immediately, without a page switch losing it.
export default function DestinationName({ value, onChange }) {
  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Destination name"
      placeholder="Destination"
      className="min-w-0 w-full rounded-sm bg-transparent px-1 -mx-1 font-display text-3xl font-bold text-forest placeholder:text-forest/30 hover:bg-stone/[0.06] focus:bg-stone/[0.06] focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/25 sm:text-4xl"
    />
  );
}
