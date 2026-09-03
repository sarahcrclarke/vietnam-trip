"use client";

import { useState } from "react";
import { TransportIcon, CloseIcon } from "./icons";

const COST_RE = /^\d*\.?\d{0,2}$/;

export default function TransitConnector({ transit, currency, isFirst }) {
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

  // The first stop's inbound transit is optional and not shown by default —
  // no journey precedes it. If the user (or JSON) has given it a transit
  // anyway, still render it normally.
  if (isFirst && !present) return null;

  return (
    <div className="mx-auto w-full max-w-editorial px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex gap-6">
        {/* Timeline column with icon */}
        <div className="relative w-12 flex-none sm:w-16">
          <div className="absolute -top-6 left-1/2 h-6 -translate-x-1/2 border-l border-stone/25" />
          <div className="relative z-10 mx-auto flex h-11 w-11 items-center justify-center text-stone/70 sm:h-14 sm:w-14">
            {present && <TransportIcon mode={mode} />}
          </div>
          <div className="absolute -bottom-6 left-1/2 h-6 -translate-x-1/2 border-l border-stone/25" />
        </div>

        {/* Transit details */}
        <div className="flex flex-1 items-center">
          {present ? (
            <div className="flex flex-1 flex-wrap items-center gap-3">
              {/* Transport mode — free text */}
              <span className="inline-grid">
                <span className="invisible col-start-1 row-start-1 whitespace-pre text-sm font-semibold text-forest uppercase">
                  {mode || "MODE"}
                </span>
                <input
                  type="text"
                  size={1}
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  placeholder="MODE"
                  aria-label="Transport mode"
                  className="col-start-1 row-start-1 w-full min-w-0 bg-transparent text-sm font-semibold text-forest uppercase placeholder:text-stone/40 focus:outline-none"
                />
              </span>

              {/* Duration / description — free text */}
              <span className="inline-grid text-sm text-stone/70">
                <span className="invisible col-start-1 row-start-1 whitespace-pre">
                  {dur || "duration"}
                </span>
                <input
                  type="text"
                  size={1}
                  value={dur}
                  onChange={(e) => setDur(e.target.value)}
                  placeholder="duration"
                  aria-label="Transit description"
                  className="col-start-1 row-start-1 w-full min-w-0 bg-transparent text-sm placeholder:text-stone/40 focus:outline-none"
                />
              </span>

              {/* Cost */}
              <span className="inline-flex items-baseline font-semibold text-rust">
                <span className="text-xs">£</span>
                <span className="inline-grid">
                  <span className="invisible col-start-1 row-start-1 whitespace-pre text-sm">
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
                    className="col-start-1 row-start-1 w-full min-w-0 bg-transparent text-sm placeholder:text-rust/40 focus:outline-none"
                  />
                </span>
              </span>

              <button
                type="button"
                onClick={removeTransit}
                aria-label="Remove transit"
                className="ml-auto inline-flex items-center text-stone/30 transition-colors hover:text-rust"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPresent(true)}
              className="text-sm text-stone/40 transition-colors hover:text-stone/60"
            >
              + Add transit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
