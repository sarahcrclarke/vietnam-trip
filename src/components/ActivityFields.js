"use client";

import { useState } from "react";

// Non-negative monetary value: empty, or digits with up to 2 decimals.
// Blocks letters, negatives, and malformed numbers so "abc" can never
// become a valid cost.
const COST_RE = /^\d*\.?\d{0,2}$/;

export default function ActivityFields({ link, cost, currency }) {
  // Initial values come straight from the activity's JSON. Client-side state
  // only — no persistence, so a refresh restores the JSON values. A £0 cost is
  // held as an empty string so it keeps the existing "£ cost" placeholder look.
  const [linkVal, setLinkVal] = useState(link ?? "");
  const [costVal, setCostVal] = useState(cost ? String(cost) : "");

  const onCostChange = (e) => {
    const next = e.target.value;
    if (COST_RE.test(next)) setCostVal(next); // otherwise ignore the keystroke
  };

  const hasCost = costVal !== "";

  return (
    <>
      {/* Link — understated dashed underline, no boxed field. Editing an input
          never navigates. */}
      <p className="mt-0.5 border-b border-dashed border-ink/35 pb-0.5 font-mono text-[11px] focus-within:border-ink/70">
        <input
          type="text"
          inputMode="url"
          value={linkVal}
          onChange={(e) => setLinkVal(e.target.value)}
          placeholder="Link (optional)"
          aria-label="Activity link"
          className="w-full truncate bg-transparent text-ink/45 placeholder:text-ink/45 focus:text-ink focus:outline-none"
        />
      </p>

      {/* Cost — £ kept visually separate from the editable numeric value. */}
      <p className="mt-0.5 flex items-baseline border-b border-dashed border-ink/35 pb-0.5 font-mono text-[11px] focus-within:border-ink/70">
        <span className={hasCost ? "font-semibold text-rust" : "text-ink/45"}>
          {currency}
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={costVal}
          onChange={onCostChange}
          placeholder=" cost"
          aria-label="Activity cost"
          className={`w-full bg-transparent focus:outline-none placeholder:text-ink/45 ${
            hasCost ? "font-semibold text-rust" : "text-ink/45"
          }`}
        />
      </p>
    </>
  );
}
