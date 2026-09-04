"use client";

import { useState } from "react";

// Generic collapsible destination group used across the Votes page (Stays,
// Contenders, Not Yet Voted). `count` is flexible — a number, or a short
// status string like "✓ Stay selected" / "Still choosing".
export default function VoteDestinationGroup({ title, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 py-3 text-left"
      >
        <span className="flex items-center gap-2 font-sans text-sm font-medium text-forest">
          <span aria-hidden className="text-[10px] text-stone/45">
            {open ? "▾" : "▸"}
          </span>
          {title}
        </span>
        <span className="font-sans text-xs text-stone/45">{count}</span>
      </button>
      {open && <div className="space-y-1 pb-3 pl-4">{children}</div>}
    </div>
  );
}
