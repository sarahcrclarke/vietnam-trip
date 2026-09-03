"use client";

import { useState } from "react";

// Non-negative monetary value: empty, or digits with up to 2 decimals.
// Blocks letters, negatives, and malformed numbers so "abc" can never
// become a valid cost.
const COST_RE = /^\d*\.?\d{0,2}$/;

// Editorial metadata line — reads as plain text when it holds a value, and
// stays very quiet (no border, no boxed placeholder) when empty, so a card
// with nothing filled in doesn't look like an unfinished form. Still fully
// editable; hover/focus give a restrained cue rather than a permanent outline.
export default function ActivityFields({ link, cost, currency }) {
  const [linkVal, setLinkVal] = useState(link ?? "");
  const [costVal, setCostVal] = useState(cost ? String(cost) : "");

  const onCostChange = (e) => {
    const next = e.target.value;
    if (COST_RE.test(next)) setCostVal(next); // otherwise ignore the keystroke
  };

  const hasLink = linkVal !== "";
  const hasCost = costVal !== "";

  return (
    <div className="mt-1.5 space-y-1">
      {/* Link */}
      <p className="text-xs leading-snug">
        <input
          type="text"
          inputMode="url"
          value={linkVal}
          onChange={(e) => setLinkVal(e.target.value)}
          placeholder="+ Add link"
          aria-label="Activity link"
          className={`w-full truncate rounded-sm bg-transparent focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/30 ${
            hasLink
              ? "text-muted underline decoration-stone/25 underline-offset-2 hover:decoration-stone/50"
              : "text-stone/30 placeholder:text-stone/30 hover:text-stone/50 focus:text-forest"
          }`}
        />
      </p>

      {/* Cost — £ kept visually separate from the editable numeric value. */}
      <p className="flex items-baseline gap-0.5 text-xs">
        <span className={hasCost ? "font-semibold text-rust" : "text-stone/30"}>
          {currency}
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={costVal}
          onChange={onCostChange}
          placeholder="cost"
          aria-label="Activity cost"
          className={`w-full rounded-sm bg-transparent focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/30 ${
            hasCost
              ? "font-semibold text-rust"
              : "text-stone/30 placeholder:text-stone/30 hover:text-stone/50 focus:text-forest"
          }`}
        />
      </p>
    </div>
  );
}
