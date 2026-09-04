"use client";

import { useState, useRef } from "react";
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
// handlers it's given. The traveller count can be edited via clicking.
export default function TripHeader({
  subtitle,
  depart,
  onDepartChange,
  returnDate,
  onReturnChange,
  travellers,
  onTravellersChange,
  activeTab,
  onTabChange,
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [editingCount, setEditingCount] = useState(false);
  const [countInput, setCountInput] = useState("");
  const countInputRef = useRef(null);

  const travellerCount = travellers.filter((t) => t.included).length;
  const totalTravellers = travellers.length;

  const handleCountEdit = () => {
    setEditingCount(true);
    setCountInput(String(travellerCount));
  };

  const handleCountChange = () => {
    const newCount = parseInt(countInput, 10);
    if (isNaN(newCount) || newCount < 1) return;
    if (newCount === travellerCount) {
      setEditingCount(false);
      return;
    }

    const updated = [...travellers];

    if (newCount > travellerCount) {
      // Need to add more included travellers
      const difference = newCount - travellerCount;
      let added = 0;

      // First, re-include excluded travellers
      for (let i = 0; i < updated.length && added < difference; i++) {
        if (!updated[i].included) {
          updated[i].included = true;
          added++;
        }
      }

      // If still need more, create new travellers
      for (let i = added; i < difference; i++) {
        updated.push({
          id: `traveller-${Date.now()}-${i}`,
          name: "",
          included: true,
        });
      }
    } else {
      // Need to exclude travellers
      const difference = travellerCount - newCount;
      let removed = 0;

      // Exclude travellers starting from the end
      for (let i = updated.length - 1; i >= 0 && removed < difference; i--) {
        if (updated[i].included) {
          updated[i].included = false;
          removed++;
        }
      }
    }

    onTravellersChange(updated);
    setEditingCount(false);
  };

  return (
    <header className="border-b border-border">
      {/* Top navigation bar */}
      <nav className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        {/* Mobile row — hamburger left, wordmark genuinely centred (via
            absolute positioning, so it stays centred regardless of the
            hamburger/avatars' differing widths), avatars right. */}
        <div className="relative flex items-center justify-between gap-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileNavOpen}
            className="text-stone/50 transition-colors hover:text-forest"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 font-display text-sm font-bold tracking-wide text-forest">
            VIETNAM
          </span>
          <TravellerAvatars
            travellers={travellers}
            onChange={onTravellersChange}
            compact={true}
          />
        </div>

        {/* Desktop row — wordmark, nav links, traveller avatars */}
        <div className="hidden md:flex items-center justify-between gap-6">
          <span className="font-display text-sm font-bold tracking-wide text-forest flex-none">
            VIETNAM
          </span>

          <div className="flex flex-1 gap-6">
            <button
              type="button"
              onClick={() => onTabChange("itinerary")}
              className={`font-sans text-sm transition-colors ${
                activeTab === "itinerary" ? "text-forest" : "text-muted hover:text-forest"
              }`}
            >
              ITINERARY
            </button>
            <button
              type="button"
              onClick={() => onTabChange("votes")}
              className={`font-sans text-sm transition-colors ${
                activeTab === "votes" ? "text-forest" : "text-muted hover:text-forest"
              }`}
            >
              VOTES
            </button>
            <button
              type="button"
              onClick={() => onTabChange("map")}
              className={`font-sans text-sm transition-colors ${
                activeTab === "map" ? "text-forest" : "text-muted hover:text-forest"
              }`}
            >
              MAP
            </button>
            <button className="font-sans text-sm text-muted transition-colors hover:text-forest">
              PHOTOS
            </button>
            <button className="font-sans text-sm text-muted transition-colors hover:text-forest">
              INFO
            </button>
          </div>

          <TravellerAvatars
            travellers={travellers}
            onChange={onTravellersChange}
            compact={true}
          />
        </div>
      </nav>

      {/* Mobile navigation panel */}
      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      {/* Header content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-forest sm:text-5xl">
          {DISPLAY_TITLE}
        </h1>
        <p className="mt-3 font-sans text-base text-muted sm:text-lg">
          {subtitle}
        </p>
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-1 font-sans text-xs uppercase tracking-widest text-muted sm:text-sm">
          <label className="relative inline-flex rounded-sm px-0.5 -mx-0.5 cursor-pointer transition-colors hover:bg-stone/10 focus-within:bg-stone/10 focus-within:ring-1 focus-within:ring-forest/25">
            {depart ? formatDMY(depart) : "DD/MM/YYYY"}
            <input
              type="date"
              value={depart ?? ""}
              onChange={(e) => onDepartChange(e.target.value)}
              aria-label="Departure date"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
          <span aria-hidden>&ndash;</span>
          <label className="relative inline-flex rounded-sm px-0.5 -mx-0.5 cursor-pointer transition-colors hover:bg-stone/10 focus-within:bg-stone/10 focus-within:ring-1 focus-within:ring-forest/25">
            {returnDate ? formatDMY(returnDate) : "DD/MM/YYYY"}
            <input
              type="date"
              value={returnDate ?? ""}
              onChange={(e) => onReturnChange(e.target.value)}
              aria-label="Return date"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
          <span aria-hidden>&middot;</span>
          {editingCount ? (
            <input
              ref={countInputRef}
              autoFocus
              type="number"
              min="1"
              value={countInput}
              onChange={(e) => setCountInput(e.target.value)}
              onBlur={handleCountChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCountChange();
                if (e.key === "Escape") setEditingCount(false);
              }}
              className="w-8 text-center bg-transparent border-b border-forest/30 focus:outline-none focus:border-forest"
            />
          ) : (
            <button
              onClick={handleCountEdit}
              className="relative inline-flex rounded-sm px-0.5 -mx-0.5 cursor-pointer transition-colors hover:bg-stone/10 focus:bg-stone/10 focus:outline-none focus:ring-1 focus:ring-forest/25"
            >
              {travellerCount} {travellerCount === 1 ? "person" : "people"}
            </button>
          )}
        </p>
      </div>
    </header>
  );
}
