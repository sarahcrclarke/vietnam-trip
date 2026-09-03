"use client";

import { useState } from "react";
import ActivityGrid from "./ActivityGrid";
import DestinationName from "./DestinationName";
import DestinationDate from "./DestinationDate";
import DestinationDescription from "./DestinationDescription";
import DestinationTag from "./DestinationTag";
import DestinationCost from "./DestinationCost";
import DestinationPhoto from "./DestinationPhoto";
import { DragHandleIcon, CloseIcon } from "./icons";

export default function StopPanel({ day, index, currency, onRemove, onDragStart, onMoveStop, dragging }) {
  const number = String(index + 1).padStart(2, "0");
  const [confirming, setConfirming] = useState(false);

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
    <div className="mx-auto flex max-w-5xl gap-3 px-4 sm:gap-5 sm:px-6">
      <div className="relative w-12 flex-none sm:w-16">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-forest/60" />
        <div className="relative z-10 mx-auto flex h-11 w-11 items-center justify-center rounded-full border-2 border-rust bg-parchment font-display text-base font-bold text-rust sm:h-14 sm:w-14 sm:text-lg">
          {number}
        </div>
      </div>

      <div
        className={`flex-1 border bg-parchment transition-[opacity,box-shadow] ${
          dragging ? "border-forest/60 opacity-70 ring-2 ring-forest/50" : "border-ink/30"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink/30 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink/60 sm:px-6 sm:text-xs">
          {confirming ? (
            <>
              <span className="min-w-0 flex-1 normal-case tracking-normal text-ink/80">
                Remove{" "}
                {day.loc ? `“${day.loc}” and all of its activities` : "this stop"}?
              </span>
              <span className="flex flex-none items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="border border-dashed border-ink/40 px-2 py-0.5 tracking-widest text-ink/70 transition-colors hover:border-ink/70"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(day.id)}
                  className="border border-dashed border-rust/60 px-2 py-0.5 font-semibold tracking-widest text-rust transition-colors hover:border-rust"
                >
                  Remove
                </button>
              </span>
            </>
          ) : (
            <>
              <button
                type="button"
                onPointerDown={(e) => onDragStart(day.id, e)}
                onKeyDown={onHandleKeyDown}
                aria-label={`Reorder ${day.loc || "this stop"} — press up or down arrow keys to move it`}
                className="flex touch-none select-none items-center gap-2 tracking-widest text-ink/60 transition-colors hover:text-ink active:cursor-grabbing"
                style={{ cursor: "grab" }}
              >
                <DragHandleIcon />
                Drag to reorder
              </button>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="flex items-center gap-1 text-rust/80 transition-colors hover:text-rust"
              >
                <CloseIcon />
                Remove stop
              </button>
            </>
          )}
        </div>

        <DestinationPhoto photo={day.photo} loc={day.loc} />

        <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-5 sm:px-6">
          <DestinationName value={day.loc} />
          <DestinationDate value={day.date} />
        </div>

        <DestinationDescription value={day.desc} />

        <div className="mx-4 border-t border-dashed border-ink/40 sm:mx-6" />

        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <DestinationTag value={day.tag} />
          <DestinationCost value={day.cost} currency={currency} />
        </div>

        <div className="flex items-center gap-2 border-t border-ink/30 px-4 pb-4 pt-6 sm:px-6">
          <span className="text-rust" aria-hidden>
            ☆
          </span>
          <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-forest sm:text-sm">
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
  );
}
