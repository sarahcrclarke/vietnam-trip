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
      className="min-w-0 w-full bg-transparent font-display text-3xl font-bold text-forest placeholder:text-forest/30 focus:outline-none sm:text-4xl"
    />
  );
}
