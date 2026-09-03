"use client";

import { useState } from "react";

// Non-negative monetary value; empty allowed while editing; invalid text
// rejected. Matches the activity-cost rules.
const COST_RE = /^\d*\.?\d{0,2}$/;

// Editable destination cost. £ kept as a separate span, flush against the
// value (no gap). Keeps the rust, bold, border-b treatment and right alignment.
export default function DestinationCost({ value, currency }) {
  const [cost, setCost] = useState(value != null ? String(value) : "");

  const onChange = (e) => {
    const next = e.target.value;
    if (COST_RE.test(next)) setCost(next);
  };

  return (
    <span className="inline-flex items-baseline border-b border-rust/50 pb-0.5 font-mono text-lg font-bold text-rust sm:text-xl">
      <span>{currency}</span>
      <span className="inline-grid">
        <span className="invisible col-start-1 row-start-1 whitespace-pre">
          {cost || "0"}
        </span>
        <input
          type="text"
          inputMode="decimal"
          size={1}
          value={cost}
          onChange={onChange}
          aria-label="Destination cost"
          className="col-start-1 row-start-1 w-full min-w-0 bg-transparent focus:outline-none"
        />
      </span>
    </span>
  );
}
