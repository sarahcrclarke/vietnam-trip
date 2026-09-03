"use client";

import { useState } from "react";

// Editable duration/tag (free text — e.g. "2 days", "2 days, 1 night cruise",
// "Departure"). Keeps the existing sage pill styling; auto-sizes to content via
// an invisible mirror so the pill hugs the text like the original span.
export default function DestinationTag({ value }) {
  const [tag, setTag] = useState(value ?? "");
  return (
    <span className="inline-grid rounded bg-sage px-3 py-1 font-mono text-xs font-semibold uppercase tracking-widest text-forest">
      <span className="invisible col-start-1 row-start-1 whitespace-pre">
        {tag || "Duration"}
      </span>
      <input
        type="text"
        size={1}
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        placeholder="Duration"
        aria-label="Destination duration"
        className="col-start-1 row-start-1 w-full min-w-0 bg-transparent uppercase placeholder:text-forest/50 focus:outline-none"
      />
    </span>
  );
}
