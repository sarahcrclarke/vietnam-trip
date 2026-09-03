"use client";

import { useState } from "react";
import { CloseIcon } from "./icons";

// Non-negative money, empty allowed while editing — same rule as the other costs.
const COST_RE = /^\d*\.?\d{0,2}$/;

// Editable transit for the journey INTO this stop. Local client state, seeded
// from the stop's JSON transit (or empty for stops without one). No persistence
// — a refresh restores the JSON. Because this renders inside the stop's keyed
// wrapper, its state moves with the stop on reorder and is never remounted.
//
// Transit is optional everywhere: a stop with none shows an "Add transit"
// affordance (so new stops — and the first stop — can add or stay blank), and
// an existing one can be cleared back to blank. Nothing here recalculates or
// rewrites transit on reorder; values only change when the user edits them.
export default function TransitConnector({ transit, currency }) {
  const [present, setPresent] = useState(Boolean(transit));
  const [mode, setMode] = useState(transit?.mode ?? "");
  const [dur, setDur] = useState(transit?.dur ?? "");
  const [cost, setCost] = useState(transit?.cost != null ? String(transit.cost) : "");

  const onCost = (e) => {
    const next = e.target.value;
    if (COST_RE.test(next)) setCost(next);
  };

  const removeTransit = () => {
    setPresent(false);
    setMode("");
    setDur("");
    setCost("");
  };

  return (
    <div className="mx-auto flex max-w-5xl gap-3 px-4 sm:gap-5 sm:px-6">
      <div className="relative w-12 flex-none sm:w-16">
        {present && (
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-forest/60" />
        )}
      </div>

      <div className="flex flex-1 items-center py-4 font-mono text-[11px] uppercase tracking-widest text-ink/60 sm:text-xs">
        {present ? (
          <div className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-rust" aria-hidden>
              &rsaquo;
            </span>

            {/* Transport mode — free text, shown uppercase. */}
            <span className="inline-grid">
              <span className="invisible col-start-1 row-start-1 whitespace-pre uppercase">
                {mode || "MODE"}
              </span>
              <input
                type="text"
                size={1}
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                placeholder="MODE"
                aria-label="Transport mode"
                className="col-start-1 row-start-1 w-full min-w-0 bg-transparent uppercase placeholder:text-ink/30 focus:outline-none"
              />
            </span>

            <span className="text-ink/30" aria-hidden>
              &middot;
            </span>

            {/* Duration / description — free text. */}
            <span className="inline-grid normal-case tracking-normal text-ink/50">
              <span className="invisible col-start-1 row-start-1 whitespace-pre">
                {dur || "duration / notes"}
              </span>
              <input
                type="text"
                size={1}
                value={dur}
                onChange={(e) => setDur(e.target.value)}
                placeholder="duration / notes"
                aria-label="Transit description"
                className="col-start-1 row-start-1 w-full min-w-0 bg-transparent placeholder:text-ink/30 focus:outline-none"
              />
            </span>

            <span className="text-ink/30" aria-hidden>
              &middot;
            </span>

            {/* Cost — same £ treatment as the other editable costs. */}
            <span className="inline-flex items-baseline font-semibold text-rust">
              <span>{currency}</span>
              <span className="inline-grid">
                <span className="invisible col-start-1 row-start-1 whitespace-pre">
                  {cost || "0"}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  size={1}
                  value={cost}
                  onChange={onCost}
                  placeholder="0"
                  aria-label="Transit cost"
                  className="col-start-1 row-start-1 w-full min-w-0 bg-transparent placeholder:text-rust/40 focus:outline-none"
                />
              </span>
            </span>

            <button
              type="button"
              onClick={removeTransit}
              aria-label="Remove transit"
              className="ml-1 inline-flex items-center text-ink/40 transition-colors hover:text-rust"
            >
              <CloseIcon />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPresent(true)}
            className="inline-flex items-center gap-1.5 tracking-widest text-ink/40 transition-colors hover:text-forest"
          >
            <span aria-hidden>+</span>
            Add transit
          </button>
        )}
      </div>
    </div>
  );
}
