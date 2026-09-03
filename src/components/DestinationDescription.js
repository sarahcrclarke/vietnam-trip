"use client";

import { useLayoutEffect, useRef, useState } from "react";

// Editable description that reads like the existing paragraph when not focused
// and grows with its content. Borderless, same typography / padding.
export default function DestinationDescription({ value }) {
  const [text, setText] = useState(value ?? "");
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
      onChange={(e) => setText(e.target.value)}
      rows={1}
      placeholder="Description"
      aria-label="Destination description"
      className="block w-full resize-none overflow-hidden rounded-sm bg-transparent px-1 -mx-1 text-base leading-relaxed text-muted placeholder:text-stone/40 hover:bg-stone/[0.06] focus:bg-stone/[0.06] focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/25"
    />
  );
}
