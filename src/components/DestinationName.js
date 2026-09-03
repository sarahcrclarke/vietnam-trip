"use client";

import { useState } from "react";

// Editable destination heading. Borderless — keeps the existing serif / size /
// dark-green treatment so it reads as the heading, not a form field.
export default function DestinationName({ value }) {
  const [name, setName] = useState(value ?? "");
  return (
    <input
      type="text"
      value={name}
      onChange={(e) => setName(e.target.value)}
      aria-label="Destination name"
      placeholder="Destination"
      className="min-w-0 w-full rounded-sm bg-transparent px-1 -mx-1 font-display text-3xl font-bold text-forest placeholder:text-forest/30 hover:bg-stone/[0.06] focus:bg-stone/[0.06] focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/25 sm:text-4xl"
    />
  );
}
