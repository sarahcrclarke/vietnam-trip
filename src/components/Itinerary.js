"use client";

import { useRef, useState } from "react";
import TransitConnector from "./TransitConnector";
import StopPanel from "./StopPanel";

// List-level client state for the itinerary's stops. Initialised from JSON
// (each stop keeps its stable JSON `id`; new stops get a temporary id). No
// persistence — a refresh restores the original stops. JSON is never mutated:
// stops are only added/removed at the list level, and each stop's inner state
// lives in its own child components.
export default function Itinerary({ itinerary }) {
  const { currency } = itinerary;
  const [stops, setStops] = useState(() => itinerary.days.map((d) => ({ ...d })));
  const seq = useRef(0);

  const addStop = () => {
    seq.current += 1;
    const id = `new-stop-${Date.now()}-${seq.current}`;
    setStops((prev) => [
      ...prev,
      { id, loc: "", date: "", desc: "", tag: "", cost: 0, photo: null, transit: null, activities: [] },
    ]);
  };

  const removeStop = (id) => setStops((prev) => prev.filter((s) => s.id !== id));

  return (
    <>
      {stops.length === 0 ? (
        <div className="mx-auto max-w-5xl px-4 py-16 text-center font-mono text-xs uppercase tracking-widest text-ink/50 sm:px-6">
          No stops yet — add one to begin.
        </div>
      ) : (
        stops.map((stop, index) => (
          <div key={stop.id}>
            <TransitConnector transit={stop.transit} currency={currency} />
            <StopPanel
              day={stop}
              index={index}
              currency={currency}
              onRemove={removeStop}
            />
          </div>
        ))
      )}

      {/* + ADD STOP — sits on the timeline as a restrained dashed node. */}
      <div className="mx-auto flex max-w-5xl gap-3 px-4 pt-4 sm:gap-5 sm:px-6">
        <div className="relative w-12 flex-none sm:w-16">
          {stops.length > 0 && (
            <div className="absolute left-1/2 top-0 h-1/2 -translate-x-1/2 border-l-2 border-dashed border-forest/60" />
          )}
          <div className="relative z-10 mx-auto flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-forest/50 bg-parchment font-display text-xl font-bold text-forest/50 sm:h-14 sm:w-14">
            +
          </div>
        </div>
        <div className="flex flex-1 items-center">
          <button
            type="button"
            onClick={addStop}
            className="flex items-center gap-2 border border-dashed border-forest/50 bg-parchment px-4 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-forest transition-colors hover:border-forest hover:bg-sage/40"
          >
            <span aria-hidden>+</span>
            Add stop
          </button>
        </div>
      </div>
    </>
  );
}
