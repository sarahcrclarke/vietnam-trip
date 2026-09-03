"use client";

import { useRef, useState } from "react";
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

// Which included travellers a leg defaults to: everyone currently included.
// Excluding someone from the trip later doesn't remove their id here — it's
// just filtered out of display/counts — so re-including them restores their
// assignment automatically.
function includedIds(travellers) {
  return travellers.filter((t) => t.included).map((t) => t.id);
}

function makeLeg(overrides = {}) {
  return {
    type: "leg",
    mode: "",
    dur: "",
    cost: "",
    depDate: "",
    depTime: "",
    depLoc: "",
    arrDate: "",
    arrTime: "",
    arrLoc: "",
    bookingRef: "",
    serviceNumber: "",
    travellerIds: [],
    ...overrides,
  };
}

function makeStopover(overrides = {}) {
  return { type: "stopover", loc: "", dur: "", ...overrides };
}

// Converts the legacy single-transit shape ({mode, dur, cost} | null) into
// the initial journey — an ordered list of legs/stopovers — so no existing
// transport mode, description or cost is lost. A journey with one leg and no
// stopovers renders identically to the old single-transit connector. The
// migrated leg defaults to every currently included traveller.
export function transitToJourney(transit, travellers = []) {
  if (!transit) return [];
  return [
    makeLeg({
      id: "leg-migrated",
      mode: normalizeMode(transit.mode),
      dur: transit.dur ?? "",
      cost: transit.cost != null ? String(transit.cost) : "",
      travellerIds: includedIds(travellers),
    }),
  ];
}

// Mode-sensitive label for the service/vehicle number field.
function serviceNumberLabel(mode) {
  if (mode === "flight") return "Flight number";
  if (mode === "train") return "Train number";
  if (mode === "bus") return "Service number";
  if (mode === "ferry") return "Ferry/service number";
  return "Reference / service number";
}

// A very restrained one-line summary shown when the accordion is collapsed
// but details have been entered, e.g. "VN 123 · 14:20 → 16:05".
function summarizeLegDetails(leg) {
  const parts = [];
  if (leg.serviceNumber) parts.push(leg.serviceNumber);
  if (leg.depTime || leg.arrTime) parts.push(`${leg.depTime || "?"} → ${leg.arrTime || "?"}`);
  return parts.length ? parts.join(" · ") : null;
}

function lineClass(isFirstRow, isLastRow) {
  const top = isFirstRow ? "-top-4 sm:-top-5" : "top-0";
  const bottom = isLastRow ? "-bottom-4 sm:-bottom-5" : "bottom-0";
  return `absolute left-1/2 -translate-x-1/2 border-l border-stone/25 ${top} ${bottom}`;
}

function Field({ label, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[10px] uppercase tracking-wide text-stone/40">{label}</span>
      <span className="mt-0.5 block">{children}</span>
    </label>
  );
}

const fieldInputClass =
  "w-full rounded-sm bg-transparent px-0.5 -mx-0.5 text-xs text-muted hover:bg-stone/10 focus:bg-stone/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/25";

// Optional, collapsed-by-default accordion for a leg's booking/scheduling
// specifics and traveller assignment. None of the fields are required. When
// collapsed, a restrained one-line summary shows if anything's been entered.
function LegDetails({ leg, travellers, onUpdate }) {
  const [open, setOpen] = useState(false);
  const summary = !open ? summarizeLegDetails(leg) : null;
  const included = travellers.filter((t) => t.included);
  const assigned = new Set(leg.travellerIds);

  const toggleTraveller = (id) => {
    const next = new Set(leg.travellerIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onUpdate({ travellerIds: [...next] });
  };

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-stone/45 transition-colors hover:text-forest"
      >
        <span aria-hidden className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}>
          &rsaquo;
        </span>
        Travel details
        {summary && <span className="ml-1 normal-case tracking-normal text-stone/40">{summary}</span>}
      </button>
      {open && (
        <div className="mt-2 border-t border-border pt-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            <Field label="Departure date">
              <input
                type="date"
                value={leg.depDate}
                onChange={(e) => onUpdate({ depDate: e.target.value })}
                className={fieldInputClass}
              />
            </Field>
            <Field label="Departure time">
              <input
                type="time"
                value={leg.depTime}
                onChange={(e) => onUpdate({ depTime: e.target.value })}
                className={fieldInputClass}
              />
            </Field>
            <Field label="Departure location">
              <input
                type="text"
                value={leg.depLoc}
                onChange={(e) => onUpdate({ depLoc: e.target.value })}
                placeholder="Station/airport"
                className={`${fieldInputClass} placeholder:text-stone/30`}
              />
            </Field>
            <Field label="Arrival date">
              <input
                type="date"
                value={leg.arrDate}
                onChange={(e) => onUpdate({ arrDate: e.target.value })}
                className={fieldInputClass}
              />
            </Field>
            <Field label="Arrival time">
              <input
                type="time"
                value={leg.arrTime}
                onChange={(e) => onUpdate({ arrTime: e.target.value })}
                className={fieldInputClass}
              />
            </Field>
            <Field label="Arrival location">
              <input
                type="text"
                value={leg.arrLoc}
                onChange={(e) => onUpdate({ arrLoc: e.target.value })}
                placeholder="Station/airport"
                className={`${fieldInputClass} placeholder:text-stone/30`}
              />
            </Field>
            <Field label="Booking reference">
              <input
                type="text"
                value={leg.bookingRef}
                onChange={(e) => onUpdate({ bookingRef: e.target.value })}
                placeholder="Confirmation code"
                className={`${fieldInputClass} placeholder:text-stone/30`}
              />
            </Field>
            <Field label={serviceNumberLabel(leg.mode)}>
              <input
                type="text"
                value={leg.serviceNumber}
                onChange={(e) => onUpdate({ serviceNumber: e.target.value })}
                placeholder="e.g. VN 123"
                className={`${fieldInputClass} placeholder:text-stone/30`}
              />
            </Field>
          </div>

          {/* Traveller assignment — every INCLUDED traveller regardless of
              voter status; multi-select pills matching the vote-pill style. */}
          <div className="mt-3 border-t border-border pt-2">
            <span className="block text-[10px] uppercase tracking-wide text-stone/40">Travellers</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {included.map((t) => {
                const selected = assigned.has(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTraveller(t.id)}
                    aria-pressed={selected}
                    aria-label={`${t.initials || t.name || "Traveller"}: ${selected ? "assigned" : "not assigned"}`}
                    title={t.name || undefined}
                    className={`rounded-full border px-1.5 py-0.5 font-sans text-[10px] font-medium transition-colors ${
                      selected
                        ? "border-forest/60 bg-sage/30 text-forest"
                        : "border-stone/40 text-stone/70 hover:border-stone/60"
                    }`}
                  >
                    {t.initials || "?"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LegRow({ leg, currency, travellers, isFirstRow, isLastRow, onUpdate, onRemove }) {
  const onCost = (e) => {
    if (COST_RE.test(e.target.value)) onUpdate({ cost: e.target.value });
  };

  // Only currently-included travellers count — someone later excluded from
  // the trip drops out of this count without their assignment being erased.
  const includedCount = travellers.filter((t) => t.included).length;
  const assignedCount = leg.travellerIds.filter((id) =>
    travellers.some((t) => t.id === id && t.included)
  ).length;
  const showTravellerCount = includedCount > 0 && assignedCount < includedCount;

  return (
    <div className="flex gap-6">
      <div className="relative w-12 flex-none sm:w-16">
        <div className={lineClass(isFirstRow, isLastRow)} />
        <div className="relative z-10 mx-auto flex h-11 w-11 items-center justify-center text-stone/70 sm:h-14 sm:w-14">
          <TransportIcon mode={leg.mode} />
        </div>
      </div>

      <div className="flex flex-1 flex-col py-2">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Transport mode — a dropdown of the supported modes, styled to
              read as plain editorial text at rest with a small caret hinting
              it's a control, so it never looks like fixed text. */}
          <span className="relative inline-flex items-center gap-1 rounded-sm px-0.5 -mx-0.5 transition-colors hover:bg-stone/10 focus-within:bg-stone/10 focus-within:ring-1 focus-within:ring-forest/30">
            <span className="text-sm font-semibold text-forest">
              {leg.mode ? MODE_LABELS[leg.mode] : "MODE"}
            </span>
            <span aria-hidden className="text-[9px] text-stone/45">
              &#9662;
            </span>
            <select
              value={leg.mode}
              onChange={(e) => onUpdate({ mode: e.target.value })}
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
              {leg.dur || "duration"}
            </span>
            <input
              type="text"
              size={1}
              value={leg.dur}
              onChange={(e) => onUpdate({ dur: e.target.value })}
              placeholder="duration"
              aria-label="Transit description"
              className="col-start-1 row-start-1 w-full min-w-0 rounded-sm bg-transparent text-sm placeholder:text-stone/40 hover:bg-stone/10 focus:bg-stone/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/30"
            />
          </span>

          {/* Cost */}
          <span className="inline-flex items-baseline font-semibold text-rust">
            <span className="text-xs">{currency}</span>
            <span className="inline-grid">
              <span className="invisible col-start-1 row-start-1 whitespace-pre text-sm">
                {leg.cost || "0"}
              </span>
              <input
                type="text"
                inputMode="decimal"
                size={1}
                value={leg.cost}
                onChange={onCost}
                placeholder="0"
                aria-label="Transit cost"
                className="col-start-1 row-start-1 w-full min-w-0 rounded-sm bg-transparent text-sm placeholder:text-rust/40 hover:bg-stone/10 focus:bg-stone/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/30"
              />
            </span>
          </span>

          {/* Compact indicator — only when assignment differs from the full
              included party, so the main line stays clean the rest of the time. */}
          {showTravellerCount && (
            <span className="ml-auto text-[11px] text-stone/45">
              {assignedCount} {assignedCount === 1 ? "traveller" : "travellers"}
            </span>
          )}

          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove transport leg"
            className={`inline-flex items-center text-stone/30 transition-colors hover:text-rust ${
              showTravellerCount ? "" : "ml-auto"
            }`}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <LegDetails leg={leg} travellers={travellers} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

function StopoverRow({ stopover, isFirstRow, isLastRow, onUpdate, onRemove }) {
  return (
    <div className="flex gap-6">
      <div className="relative w-12 flex-none sm:w-16">
        <div className={lineClass(isFirstRow, isLastRow)} />
        <div className="relative z-10 mx-auto flex h-11 w-11 items-center justify-center text-stone/50 sm:h-14 sm:w-14">
          <span aria-hidden className="text-lg sm:text-xl">
            &#9671;
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center py-2">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <span className="inline-grid">
            <span className="invisible col-start-1 row-start-1 whitespace-pre text-sm font-semibold uppercase">
              {stopover.loc || "LOCATION"}
            </span>
            <input
              type="text"
              size={1}
              value={stopover.loc}
              onChange={(e) => onUpdate({ loc: e.target.value })}
              placeholder="LOCATION"
              aria-label="Stopover location"
              className="col-start-1 row-start-1 w-full min-w-0 rounded-sm bg-transparent text-sm font-semibold text-forest uppercase placeholder:text-stone/40 hover:bg-stone/10 focus:bg-stone/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/30"
            />
          </span>

          <span aria-hidden className="text-stone/30">
            &middot;
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-stone/50">Stopover</span>
          <span aria-hidden className="text-stone/30">
            &middot;
          </span>

          <span className="inline-grid text-sm text-stone/70">
            <span className="invisible col-start-1 row-start-1 whitespace-pre">
              {stopover.dur || "duration"}
            </span>
            <input
              type="text"
              size={1}
              value={stopover.dur}
              onChange={(e) => onUpdate({ dur: e.target.value })}
              placeholder="duration"
              aria-label="Stopover duration"
              className="col-start-1 row-start-1 w-full min-w-0 rounded-sm bg-transparent text-sm placeholder:text-stone/40 hover:bg-stone/10 focus:bg-stone/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/30"
            />
          </span>

          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove stopover"
            className="ml-auto inline-flex items-center text-stone/30 transition-colors hover:text-rust"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ControlsRow({ isFirstRow, isLastRow, onAddLeg, onAddStopover }) {
  return (
    <div className="flex gap-6">
      <div className="relative w-12 flex-none sm:w-16">
        <div className={lineClass(isFirstRow, isLastRow)} />
      </div>
      <div className="flex flex-1 items-center gap-4 py-2">
        <button
          type="button"
          onClick={onAddLeg}
          className="text-sm text-stone/45 transition-colors hover:text-forest"
        >
          + Add leg
        </button>
        <button
          type="button"
          onClick={onAddStopover}
          className="text-sm text-stone/45 transition-colors hover:text-forest"
        >
          + Add stopover
        </button>
      </div>
    </div>
  );
}

// The journey INTO a stop — an ordered sequence of transport legs and
// optional stopovers between it and the previous destination. Controlled by
// Itinerary's stops state (not local) because the trip cost summary needs
// every leg's live cost across every journey to compute its subtotal.
// No persistence — a refresh restores the original single-leg journey.
// Because this renders inside the stop's keyed wrapper, it moves with the
// stop on reorder and is never remounted.
export default function Journey({ journey, onChange, currency, isFirst, travellers }) {
  const seq = useRef(0);

  const updateItem = (id, patch) =>
    onChange(journey.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const removeItem = (id) => onChange(journey.filter((it) => it.id !== id));

  // A new leg defaults to every currently included traveller, same as a
  // migrated one — users then deselect individuals as required.
  const addLeg = () => {
    seq.current += 1;
    onChange([
      ...journey,
      makeLeg({ id: `leg-${Date.now()}-${seq.current}`, travellerIds: includedIds(travellers) }),
    ]);
  };

  const addStopover = () => {
    seq.current += 1;
    onChange([...journey, makeStopover({ id: `stopover-${Date.now()}-${seq.current}` })]);
  };

  // The first stop's inbound journey is optional and not shown by default —
  // no journey precedes it. If it has one anyway, still render it normally.
  if (isFirst && journey.length === 0) return null;

  return (
    <div className="mx-auto w-full max-w-editorial px-4 py-4 sm:px-6 sm:py-5">
      {journey.map((item, i) =>
        item.type === "leg" ? (
          <LegRow
            key={item.id}
            leg={item}
            currency={currency}
            travellers={travellers}
            isFirstRow={i === 0}
            isLastRow={false}
            onUpdate={(patch) => updateItem(item.id, patch)}
            onRemove={() => removeItem(item.id)}
          />
        ) : (
          <StopoverRow
            key={item.id}
            stopover={item}
            isFirstRow={i === 0}
            isLastRow={false}
            onUpdate={(patch) => updateItem(item.id, patch)}
            onRemove={() => removeItem(item.id)}
          />
        )
      )}
      <ControlsRow
        isFirstRow={journey.length === 0}
        isLastRow
        onAddLeg={addLeg}
        onAddStopover={addStopover}
      />
    </div>
  );
}
