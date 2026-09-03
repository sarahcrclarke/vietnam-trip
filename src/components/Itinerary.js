"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TransitConnector from "./TransitConnector";
import StopPanel from "./StopPanel";

// List-level client state for the itinerary's stops. Initialised from JSON
// (each stop keeps its stable JSON `id`; new stops get a temporary id). No
// persistence — a refresh restores the original stops. JSON is never mutated.
//
// Reordering (drag or keyboard) only changes the ORDER of the stops array;
// stable ids stay the React keys, so stop components are never remounted and
// all temporary state inside them is preserved.
export default function Itinerary({ itinerary }) {
  const { currency } = itinerary;
  const [stops, setStops] = useState(() => itinerary.days.map((d) => ({ ...d })));
  const [draggingId, setDraggingId] = useState(null);
  const seq = useRef(0);
  const rowRefs = useRef(new Map());
  const dragIdRef = useRef(null);
  const dragAbortRef = useRef(null);

  const setRow = (id) => (el) => {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  };

  // Pointer drag (mouse + touch). Only the handle calls this. Listeners are
  // scoped to an AbortController so they all detach on release/cancel.
  const startDrag = useCallback((id, e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return; // primary only
    dragIdRef.current = id;
    setDraggingId(id);
    const ac = new AbortController();
    dragAbortRef.current = ac;

    // Live reorder: place the dragged stop among the others by pointer Y.
    const onMove = (ev) => {
      const cur = dragIdRef.current;
      if (!cur) return;
      const y = ev.clientY;
      setStops((prev) => {
        const from = prev.findIndex((s) => s.id === cur);
        if (from < 0) return prev;
        const others = prev.filter((s) => s.id !== cur);
        let insert = others.length;
        for (let i = 0; i < others.length; i++) {
          const el = rowRefs.current.get(others[i].id);
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (y < r.top + r.height / 2) { insert = i; break; }
        }
        const next = others.slice();
        next.splice(insert, 0, prev[from]);
        for (let i = 0; i < next.length; i++) if (next[i].id !== prev[i].id) return next;
        return prev; // order unchanged → no re-render
      });
    };
    const onEnd = () => {
      dragIdRef.current = null;
      setDraggingId(null);
      ac.abort();
      dragAbortRef.current = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", onMove, { signal: ac.signal });
    window.addEventListener("pointerup", onEnd, { signal: ac.signal });
    window.addEventListener("pointercancel", onEnd, { signal: ac.signal });
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  }, []);

  // Keyboard reordering from the focused handle (arrow up/down).
  const moveStop = useCallback((id, dir) => {
    setStops((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  useEffect(
    () => () => {
      dragAbortRef.current?.abort();
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    },
    []
  );

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
    <div className="flex flex-col">
      {stops.length === 0 ? (
        <div className="mx-auto max-w-editorial flex-1 px-4 py-16 text-center font-sans text-sm text-stone/50 sm:px-6">
          No stops yet — add one to begin.
        </div>
      ) : (
        <div className="space-y-0">
          {stops.map((stop, index) => (
            <div key={stop.id} ref={setRow(stop.id)}>
              <TransitConnector transit={stop.transit} currency={currency} isFirst={index === 0} />
              <StopPanel
                day={stop}
                index={index}
                currency={currency}
                onRemove={removeStop}
                onDragStart={startDrag}
                onMoveStop={moveStop}
                dragging={draggingId === stop.id}
              />
            </div>
          ))}
        </div>
      )}

      {/* + ADD STOP — appends to the current end of the itinerary. */}
      <div className="mx-auto w-full max-w-editorial px-4 py-8 sm:px-6">
        <div className="flex gap-6">
          <div className="relative w-12 flex-none sm:w-16">
            {stops.length > 0 && (
              <div className="absolute left-1/2 top-0 h-1/2 -translate-x-1/2 border-l border-stone/30" />
            )}
            <div className="relative z-10 mx-auto flex h-10 w-10 items-center justify-center text-sm font-bold text-stone/30 sm:h-12 sm:w-12">
              +
            </div>
          </div>
          <div className="flex items-center">
            <button
              type="button"
              onClick={addStop}
              className="font-sans text-sm text-stone/60 transition-colors hover:text-forest"
            >
              Add another destination
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
