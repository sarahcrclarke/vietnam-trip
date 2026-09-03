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
      className="block w-full resize-none overflow-hidden bg-transparent px-4 pb-5 pt-3 text-sm leading-relaxed text-ink/80 placeholder:text-ink/40 focus:outline-none sm:px-6 sm:text-base"
    />
  );
}
