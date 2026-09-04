"use client";

import { ClockIcon, ExternalLinkIcon } from "./icons";

// Non-negative monetary value: empty, or digits with up to 2 decimals.
// Blocks letters, negatives, and malformed numbers so "abc" can never
// become a valid cost.
const COST_RE = /^\d*\.?\d{0,2}$/;

// Accepts "example.com/page" as well as "https://example.com/page" — the
// open action always gets a real, absolute URL either way.
function normalizeUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).href;
  } catch {
    try {
      return new URL(`https://${trimmed}`).href;
    } catch {
      return null;
    }
  }
}

// Editorial metadata line — reads as plain text when it holds a value, and
// stays very quiet (no border, no boxed placeholder) when empty, so a card
// with nothing filled in doesn't look like an unfinished form. Still fully
// editable; hover/focus give a restrained cue rather than a permanent outline.
//
// Cost, link and travel time are all controlled by the parent (ActivityGrid,
// via Itinerary's stops state) — cost because the trip cost summary needs
// every activity's live cost; link and travel time so an edit is never lost
// when switching away from and back to this stop (the card unmounts on a
// MAP/VOTES tab switch).
export default function ActivityFields({ link, cost, onCostChange, onLinkChange, travelTime, onTravelTimeChange, currency }) {
  const linkVal = link ?? "";
  const travelTimeVal = travelTime ?? "";
  const costVal = cost ?? "";

  const handleCostChange = (e) => {
    const next = e.target.value;
    if (COST_RE.test(next)) onCostChange(next); // otherwise ignore the keystroke
  };

  const hasLink = linkVal !== "";
  const hasCost = costVal !== "";
  const hasTravelTime = travelTimeVal !== "";
  const openUrl = hasLink ? normalizeUrl(linkVal) : null;

  return (
    <div className="mt-1 space-y-0.5">
      {/* Link — editing the text and opening it are two separate, deliberate
          actions, so fixing a typo never accidentally navigates away. */}
      <p className="flex items-center gap-1 text-xs leading-snug">
        <input
          type="text"
          inputMode="url"
          value={linkVal}
          onChange={(e) => onLinkChange(e.target.value)}
          placeholder="+ Add link"
          aria-label="Activity link"
          className={`min-w-0 flex-1 truncate rounded-sm bg-transparent focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/30 ${
            hasLink
              ? "text-muted underline decoration-stone/25 underline-offset-2 hover:decoration-stone/50"
              : "text-stone/30 placeholder:text-stone/30 hover:text-stone/50 focus:text-forest"
          }`}
        />
        {openUrl && (
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open link in a new tab"
            title="Open link"
            className="flex-none text-stone/40 transition-colors hover:text-forest"
          >
            <ExternalLinkIcon />
          </a>
        )}
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
          onChange={handleCostChange}
          placeholder="cost"
          aria-label="Activity cost"
          className={`w-full rounded-sm bg-transparent focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/30 ${
            hasCost
              ? "font-semibold text-rust"
              : "text-stone/30 placeholder:text-stone/30 hover:text-stone/50 focus:text-forest"
          }`}
        />
      </p>

      {/* Travel time from accommodation — free text, optional. */}
      <p className="flex items-center gap-1 text-xs">
        <ClockIcon className={`h-3 w-3 flex-none ${hasTravelTime ? "text-stone/45" : "text-stone/25"}`} />
        <input
          type="text"
          value={travelTimeVal}
          onChange={(e) => onTravelTimeChange(e.target.value)}
          placeholder="+ Add travel time"
          aria-label="Travel time from accommodation"
          className={`w-full min-w-0 truncate rounded-sm bg-transparent focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/30 ${
            hasTravelTime
              ? "text-muted"
              : "text-stone/30 placeholder:text-stone/30 hover:text-stone/50 focus:text-forest"
          }`}
        />
      </p>
    </div>
  );
}
