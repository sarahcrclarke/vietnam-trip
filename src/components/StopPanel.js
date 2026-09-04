"use client";

import { useEffect, useRef, useState } from "react";
import ActivityGrid from "./ActivityGrid";
import AccommodationSection from "./AccommodationSection";
import DestinationName from "./DestinationName";
import DestinationDate from "./DestinationDate";
import DestinationDescription from "./DestinationDescription";
import DestinationTag from "./DestinationTag";
import DestinationCost from "./DestinationCost";
import DestinationPhoto from "./DestinationPhoto";
import { DragHandleIcon } from "./icons";

export default function StopPanel({ day, index, currency, onRemove, onDragStart, onMoveStop, dragging, onDateChange, onCostChange, onActivitiesChange, onAccommodationsChange, onAccommodationWishlistUrlChange, duration, travellers }) {
  const number = String(index + 1).padStart(2, "0");
  const [confirming, setConfirming] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const gridRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeTab, setActiveTab] = useState("activities");

  const onHandleKeyDown = (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      onMoveStop(day.id, -1);
    } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      onMoveStop(day.id, 1);
    }
  };

  useEffect(() => {
    if (!showMenu) return undefined;
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowMenu(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showMenu]);

  useEffect(() => {
    const updateScrollState = () => {
      if (gridRef.current) {
        setCanScrollLeft(gridRef.current.canScrollLeft);
        setCanScrollRight(gridRef.current.canScrollRight);
      }
    };
    updateScrollState();
    const interval = setInterval(updateScrollState, 100);
    return () => clearInterval(interval);
  }, [day.activities.length]);

  return (
    <div className="mx-auto w-full max-w-editorial px-4 sm:px-6">
      <div className="flex gap-6">
        {/* Timeline column — the number sits directly on the fine journey
            line via a short connecting tick, rather than floating beside it.
            The line itself spans this column's full (stretched) height so it
            stays unbroken from the transit row above into the card below. */}
        <div className="relative w-12 flex-none sm:w-16">
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-stone/25" />
          <div className="relative z-10 mx-auto flex flex-col items-center">
            <span className="text-sm font-bold text-forest sm:text-base">{number}</span>
            <span aria-hidden className="mt-2 h-5 w-px bg-stone/25 sm:h-6" />
          </div>
        </div>

        {/* Card content — min-w-0 lets this flex item shrink below its
            content's intrinsic width, so the activity carousel's own
            overflow-x scrolls internally instead of the whole card
            stretching wider than its column to fit every activity. */}
        <div
          className={`min-w-0 flex-1 transition-[opacity,box-shadow] ${
            dragging ? "opacity-60" : ""
          }`}
        >
          {/* Visible drag-to-reorder control — above the photo */}
          <div className="flex items-center gap-2 px-4 pt-4 sm:px-6">
            <button
              type="button"
              onPointerDown={(e) => onDragStart(day.id, e)}
              onKeyDown={onHandleKeyDown}
              aria-label={`Drag to reorder ${day.loc || "this stop"} — press up or down arrow keys to move it`}
              className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-stone/50 transition-colors hover:text-forest"
              style={{ cursor: "grab" }}
            >
              <DragHandleIcon className="h-3.5 w-3.5" />
              <span>Drag to reorder</span>
            </button>
          </div>

          {/* Photo section */}
          <DestinationPhoto photo={day.photo} loc={day.loc} />

          {/* Main content */}
          <div className={`space-y-4 px-4 py-6 sm:px-6 ${dragging ? "bg-stone/5" : ""}`}>
            {/* Header — title, then a grouped date + duration metadata row with
                the cost as part of the same composition, before the description. */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2>
                  <DestinationName value={day.loc} />
                </h2>
              </div>

              {/* Menu button */}
              <div className="relative flex-none" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-stone/50 transition-colors hover:text-stone/80"
                  aria-label="Menu"
                >
                  <span className="text-sm tracking-wider">•••</span>
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 space-y-1 rounded bg-background border border-border px-2 py-1 shadow-sm z-10">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        setConfirming(true);
                      }}
                      className="block w-full text-left px-2 py-1 text-sm text-rust transition-colors hover:text-rust/80"
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <DestinationDate value={day.date} onChange={(date) => onDateChange(day.id, date)} />
                {duration && (
                  <span aria-hidden className="text-stone/40">
                    &middot;
                  </span>
                )}
                <DestinationTag value={duration} />
              </div>
              <DestinationCost value={day.cost} onChange={onCostChange} currency={currency} />
            </div>

            {/* Description */}
            <DestinationDescription value={day.desc} />

            {/* Tabs — Activities and Accommodations */}
            <div className="space-y-4 border-t border-border pt-6">
              <div className="flex gap-6 border-b border-stone/15">
                <button
                  type="button"
                  onClick={() => setActiveTab("activities")}
                  className={`pb-3 text-sm font-semibold uppercase tracking-widest transition-colors ${
                    activeTab === "activities"
                      ? "text-forest border-b-2 border-forest -mb-0.5"
                      : "text-stone/50 hover:text-stone/70"
                  }`}
                >
                  Things to do
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("accommodation")}
                  className={`pb-3 text-sm font-semibold uppercase tracking-widest transition-colors ${
                    activeTab === "accommodation"
                      ? "text-forest border-b-2 border-forest -mb-0.5"
                      : "text-stone/50 hover:text-stone/70"
                  }`}
                >
                  Accommodation
                </button>
              </div>

              {activeTab === "activities" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-rust flex-none">★</span>
                      <h3 className="font-sans text-sm font-semibold uppercase tracking-widest text-forest">
                        Things to do in {day.loc || "this stop"}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 flex-none">
                      <button
                        type="button"
                        onClick={() => gridRef.current?.scrollByPage(-1)}
                        aria-label="Scroll activities left"
                        disabled={!canScrollLeft}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-stone/30 text-stone/60 transition-colors hover:text-forest hover:border-forest/50 disabled:opacity-40 disabled:cursor-default"
                      >
                        <span className="text-sm">‹</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => gridRef.current?.scrollByPage(1)}
                        aria-label="Scroll activities right"
                        disabled={!canScrollRight}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-stone/30 text-stone/60 transition-colors hover:text-forest hover:border-forest/50 disabled:opacity-40 disabled:cursor-default"
                      >
                        <span className="text-sm">›</span>
                      </button>
                    </div>
                  </div>
                  <ActivityGrid
                    ref={gridRef}
                    activities={day.activities}
                    onChange={onActivitiesChange}
                    currency={currency}
                    loc={day.loc}
                    travellers={travellers}
                  />
                </div>
              )}

              {activeTab === "accommodation" && (
                <div className="space-y-3">
                  <p className="text-sm text-stone/60">
                    Shortlisted stays for your time in {day.loc || "this stop"}.
                  </p>
                  <AccommodationSection
                    accommodations={day.accommodations || []}
                    accommodationWishlistUrl={day.accommodationWishlistUrl || ""}
                    currency={currency}
                    loc={day.loc}
                    onAccommodationsChange={onAccommodationsChange}
                    onWishlistUrlChange={onAccommodationWishlistUrlChange}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Confirmation dialog */}
          {confirming && (
            <div className="border-t border-border bg-stone/5 px-4 py-4 sm:px-6">
              <div className="space-y-3">
                <p className="text-sm text-stone/80">
                  Remove {day.loc ? `"${day.loc}" and all of its activities` : "this stop"}?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="text-sm text-stone/60 transition-colors hover:text-forest"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(day.id)}
                    className="text-sm font-semibold text-rust transition-colors hover:text-rust/80"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
