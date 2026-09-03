"use client";

import { useState } from "react";
import ActivityGrid from "./ActivityGrid";
import DestinationName from "./DestinationName";
import DestinationDate from "./DestinationDate";
import DestinationDescription from "./DestinationDescription";
import DestinationTag from "./DestinationTag";
import DestinationCost from "./DestinationCost";
import DestinationPhoto from "./DestinationPhoto";

export default function StopPanel({ day, index, currency, onRemove, onDragStart, onMoveStop, dragging }) {
  const number = String(index + 1).padStart(2, "0");
  const [confirming, setConfirming] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const onHandleKeyDown = (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      onMoveStop(day.id, -1);
    } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      onMoveStop(day.id, 1);
    }
  };

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

        {/* Card content */}
        <div
          className={`flex-1 transition-[opacity,box-shadow] ${
            dragging ? "opacity-60" : ""
          }`}
        >
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
              <div className="relative flex-none">
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
                      onPointerDown={(e) => onDragStart(day.id, e)}
                      onKeyDown={onHandleKeyDown}
                      aria-label={`Reorder ${day.loc || "this stop"} — press up or down arrow keys to move it`}
                      className="block w-full text-left px-2 py-1 text-sm text-muted hover:text-forest transition-colors"
                      style={{ cursor: "grab" }}
                    >
                      ↕ Reorder
                    </button>
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
                <DestinationDate value={day.date} />
                <span aria-hidden className="text-stone/40">
                  &middot;
                </span>
                <DestinationTag value={day.tag} />
              </div>
              <DestinationCost value={day.cost} currency={currency} />
            </div>

            {/* Description */}
            <DestinationDescription value={day.desc} />

            {/* Activities section */}
            <div className="space-y-3 border-t border-border pt-6">
              <div className="flex items-center gap-2">
                <span className="text-rust">★</span>
                <h3 className="font-sans text-sm font-semibold uppercase tracking-widest text-forest">
                  Things to do in {day.loc || "this stop"}
                </h3>
              </div>
              <ActivityGrid
                activities={day.activities}
                currency={currency}
                loc={day.loc}
              />
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
