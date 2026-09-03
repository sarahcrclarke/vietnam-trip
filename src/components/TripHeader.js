"use client";

import { useState } from "react";
import { formatDMY } from "@/lib/date";
import TravellerAvatars from "./TravellerAvatars";
import MobileNav from "./MobileNav";
import { MenuIcon } from "./icons";

// Displayed trip title — the JSON keeps its original "Việt Nam", but the
// approved heading text is "Vietnam"; the source file is never edited.
const DISPLAY_TITLE = "Vietnam";

// Departure date, return date and the traveller list are lifted to
// TripPlanner (the return date also drives the final destination's derived
// duration in Itinerary; the traveller list will be needed by voting and
// transport assignment later), so this component just renders them with the
// handlers it's given. The "X people" count is derived from included
// travellers — it's no longer an independently editable value.
export default function TripHeader({
  subtitle,
  depart,
  onDepartChange,
  returnDate,
  onReturnChange,
  travellers,
  onTravellersChange,
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const travellerCount = travellers.filter((t) => t.included).length;

  return (
    <header className="border-b border-border">
      {/* Top navigation bar */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:gap-6 sm:px-6">
        {/* Wordmark — VIETNAM on all sizes */}
        <span className="font-display text-sm font-bold tracking-wide text-forest flex-none">
          VIETNAM
        </span>

        {/* Desktop navigation (hidden on mobile) */}
        <div className="hidden md:flex gap-6 flex-1">
          <button className="font-sans text-sm text-forest transition-opacity hover:opacity-70">
            ITINERARY
          </button>
          <button className="font-sans text-sm text-muted transition-colors hover:text-forest">
            MAP
          </button>
          <button className="font-sans text-sm text-muted transition-colors hover:text-forest">
            VOTES
          </button>
          <button className="font-sans text-sm text-muted transition-colors hover:text-forest">
            PHOTOS
          </button>
          <button className="font-sans text-sm text-muted transition-colors hover:text-forest">
            INFO
          </button>
        </div>

        {/* Right controls: traveller avatars and mobile hamburger */}
        <div className="flex items-center gap-3 sm:gap-4 flex-none">
          {/* Traveller avatars (responsive via TravellerAvatars) */}
          <TravellerAvatars
            travellers={travellers}
            onChange={onTravellersChange}
            compact={true}
          />

          {/* Mobile hamburger menu (hidden on md and up) */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileNavOpen}
            className="md:hidden text-stone/50 transition-colors hover:text-forest"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* Mobile navigation panel */}
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Header content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-forest sm:text-5xl">
          {DISPLAY_TITLE}
        </h1>
        <p className="mt-3 font-sans text-base text-muted sm:text-lg">
          {subtitle}
        </p>
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-1 font-sans text-xs uppercase tracking-widest text-muted sm:text-sm">
          <span className="relative inline-flex rounded-sm px-0.5 -mx-0.5 transition-colors hover:bg-stone/10 focus-within:bg-stone/10 focus-within:ring-1 focus-within:ring-forest/25">
            {depart ? formatDMY(depart) : "DD/MM/YYYY"}
            <input
              type="date"
              value={depart ?? ""}
              onChange={(e) => onDepartChange(e.target.value)}
              aria-label="Departure date"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </span>
          <span aria-hidden>&ndash;</span>
          <span className="relative inline-flex rounded-sm px-0.5 -mx-0.5 transition-colors hover:bg-stone/10 focus-within:bg-stone/10 focus-within:ring-1 focus-within:ring-forest/25">
            {returnDate ? formatDMY(returnDate) : "DD/MM/YYYY"}
            <input
              type="date"
              value={returnDate ?? ""}
              onChange={(e) => onReturnChange(e.target.value)}
              aria-label="Return date"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </span>
          <span aria-hidden>&middot;</span>
          <span>
            {travellerCount} {travellerCount === 1 ? "person" : "people"}
          </span>
        </p>
      </div>
    </header>
  );
}
