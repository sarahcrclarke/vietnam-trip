"use client";

import { useState } from "react";
import { TransportIcon, CloseIcon } from "./icons";

const COST_RE = /^\d*\.?\d{0,2}$/;

// Supported modes — kept in sync with TransportIcon's own keyword matching so
// picking a mode here always resolves to the right icon.
const MODE_OPTIONS = [
  { value: "train", label: "Train" },
  { value: "flight", label: "Flight" },
  { value: "bus", label: "Bus" },
  { value: "car", label: "Car" },
  { value: "ferry", label: "Ferry / Boat" },
  { value: "other", label: "Other" },
];
const MODE_LABELS = Object.fromEntries(MODE_OPTIONS.map((o) => [o.value, o.label.toUpperCase()]));

// Existing JSON transit stores mode as free text (e.g. "train"); normalise it
// to one of our select's discrete values so the dropdown has a matching option.
function normalizeMode(raw) {
  const m = (raw || "").toLowerCase();
  if (!m) return "";
  if (m.includes("train")) return "train";
  if (m.includes("flight")) return "flight";
  if (m.includes("bus")) return "bus";
  if (m.includes("car")) return "car";
  if (m.includes("ferry") || m.includes("boat")) return "ferry";
  return "other";
}

export default function TransitConnector({ transit, currency, isFirst }) {
  const [present, setPresent] = useState(Boolean(transit));
  const [mode, setMode] = useState(() => normalizeMode(transit?.mode));
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
              {/* Transport mode — a dropdown of the supported modes, styled to
                  read as plain editorial text at rest (like the destination
                  date's native-picker overlay) with a small caret hinting
                  it's a control, so it never looks like fixed text. */}
              <span className="relative inline-flex items-center gap-1 rounded-sm px-0.5 -mx-0.5 transition-colors hover:bg-stone/10 focus-within:bg-stone/10 focus-within:ring-1 focus-within:ring-forest/30">
                <span className="text-sm font-semibold text-forest">
                  {mode ? MODE_LABELS[mode] : "MODE"}
                </span>
                <span aria-hidden className="text-[9px] text-stone/45">
                  &#9662;
                </span>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  aria-label="Transport mode"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0 focus:outline-none"
                >
                  <option value="" disabled hidden>
                    Select mode
                  </option>
                  {MODE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
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
                  className="col-start-1 row-start-1 w-full min-w-0 rounded-sm bg-transparent text-sm placeholder:text-stone/40 hover:bg-stone/10 focus:bg-stone/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/30"
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
                    className="col-start-1 row-start-1 w-full min-w-0 rounded-sm bg-transparent text-sm placeholder:text-rust/40 hover:bg-stone/10 focus:bg-stone/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/30"
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
