"use client";

import { useLayoutEffect, useRef } from "react";

// Editable description that reads like the existing paragraph when not focused
// and grows with its content. Borderless, same typography / padding.
// Controlled by Itinerary's stops state (not local) because MAP's selected-
// destination preview reads a stop's description straight from `stops` and
// must reflect an edit immediately.
export default function DestinationDescription({ value, onChange }) {
  const text = value ?? "";
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  return (
    <textarea
      ref={ref}
      value={text}
      onChange={(e) => onChange(e.target.value)}
      rows={1}
      placeholder="Description"
      aria-label="Destination description"
      className="block w-full resize-none overflow-hidden rounded-sm bg-transparent px-1 -mx-1 text-base leading-relaxed text-muted placeholder:text-stone/40 hover:bg-stone/[0.06] focus:bg-stone/[0.06] focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/25"
    />
  );
}
