"use client";

import { useState } from "react";
import MapIllustration from "./MapIllustration";
import { getCoordinates, projectToPercent } from "@/lib/mapCoordinates";
import { daysBetween, formatDuration } from "@/lib/duration";
import { formatDMY } from "@/lib/date";

const TRANSIT_MODE_LABELS = {
  train: "Train",
  flight: "Flight",
  bus: "Bus",
  car: "Car",
  ferry: "Ferry / Boat",
  other: "Transport",
};

// The first leg with a mode set — never invents a mode for an empty/legless
// journey.
function firstLegMode(journey) {
  const leg = (journey || []).find((item) => item.type === "leg" && item.mode);
  return leg ? { mode: leg.mode, dur: leg.dur } : null;
}

function dateRangeFor(dateISO, nextDateISO) {
  if (!dateISO) return null;
  return nextDateISO ? `${formatDMY(dateISO)} – ${formatDMY(nextDateISO)}` : formatDMY(dateISO);
}

// The illustrated journey map — consumes the SAME `stops` state Itinerary
// owns (via props) and the SAME `tripReturnDate` used to derive the final
// stop's duration elsewhere in the app. No copied/duplicated trip data;
// coordinates are the only thing added, purely for pin placement, and are
// looked up (never invented) per stop.
export default function MapPanel({ stops, tripReturnDate, onViewChange }) {
  const numbered = stops.map((s, i) => ({ ...s, number: String(i + 1).padStart(2, "0"), index: i }));

  // Stops that share exact real-world coordinates (e.g. a return trip to the
  // same city) would otherwise render as fully overlapping, mutually
  // click-blocking pins — fan out later duplicates slightly around the true
  // point so every stop stays independently visible and clickable.
  const coordUseCount = new Map();
  const mapped = numbered
    .map((s) => {
      const coords = getCoordinates(s.loc);
      if (!coords) return null;
      let { xPct, yPct } = projectToPercent(coords);
      const key = coords.join(",");
      const n = coordUseCount.get(key) || 0;
      if (n > 0) {
        const angle = (n * 137.5 * Math.PI) / 180;
        const radius = 3 + n * 1.5;
        xPct += Math.cos(angle) * radius;
        yPct += Math.sin(angle) * radius;
      }
      coordUseCount.set(key, n + 1);
      return { ...s, xPct, yPct };
    })
    .filter(Boolean);

  const [selectedId, setSelectedId] = useState(
    () => (mapped[0] ? mapped[0].id : numbered[0]?.id ?? null)
  );

  // Falls back to the first stop if the selected one was removed/reordered
  // away — never renders a stale/missing selection.
  const selected = numbered.find((s) => s.id === selectedId) || numbered[0] || null;

  const segments = [];
  for (let i = 1; i < mapped.length; i++) {
    const from = mapped[i - 1];
    const to = mapped[i];
    // Only attribute transit data when the two mapped stops are ALSO
    // itinerary-adjacent — never guess a mode across a skipped/unmapped stop.
    const adjacent = to.index === from.index + 1;
    const leg = adjacent ? firstLegMode(to.journey) : null;
    segments.push({
      fromId: from.id,
      toId: to.id,
      x1: from.xPct,
      y1: from.yPct,
      x2: to.xPct,
      y2: to.yPct,
      mode: leg ? leg.mode : null,
    });
  }

  if (numbered.length === 0) {
    return (
      <div className="mx-auto max-w-editorial flex-1 px-4 py-16 text-center font-sans text-sm text-stone/50 sm:px-6">
        No stops yet — add one in Itinerary to see the map.
      </div>
    );
  }

  const nextDateFor = (index) => (index + 1 < numbered.length ? numbered[index + 1].date : tripReturnDate);
  const selectedNextDate = selected ? nextDateFor(selected.index) : null;
  const selectedDuration = selected ? formatDuration(daysBetween(selected.date, selectedNextDate)) : null;
  const selectedTransit = selected ? firstLegMode(selected.journey) : null;
  const selectedHasCoords = selected ? mapped.some((m) => m.id === selected.id) : false;

  return (
    <div className="mx-auto w-full max-w-editorial px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-xl">
        <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-stone/50">
          The journey
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-forest sm:text-4xl">
          Our Journey
          <br className="hidden sm:block" /> Through Vietnam
        </h2>
        <p className="mt-3 font-sans text-sm text-muted sm:text-base">
          {numbered.length} stop{numbered.length === 1 ? "" : "s"}, one unforgettable adventure.
          Explore our route, see how we&rsquo;re travelling between each destination, and discover
          what&rsquo;s waiting at each stop.
        </p>
      </div>

      {/* Desktop: journey list / map / preview. Mobile: map, then preview
          below (no permanent sidebar) — the strip further down doubles as
          mobile navigation. */}
      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr_300px] lg:items-start">
        <div className="hidden lg:block">
          <JourneyList
            stops={numbered}
            selectedId={selected?.id}
            onSelect={setSelectedId}
            tripReturnDate={tripReturnDate}
          />
        </div>

        <MapIllustration
          points={mapped}
          segments={segments}
          selectedId={selected?.id}
          onSelect={setSelectedId}
        />

        <div className="hidden lg:block">
          <DestinationPreview
            stop={selected}
            nextDate={selectedNextDate}
            duration={selectedDuration}
            transit={selectedTransit}
            hasCoords={selectedHasCoords}
            onViewDestination={() => onViewChange("itinerary")}
          />
        </div>
      </div>

      <div className="mt-8 lg:hidden">
        <DestinationPreview
          stop={selected}
          nextDate={selectedNextDate}
          duration={selectedDuration}
          transit={selectedTransit}
          hasCoords={selectedHasCoords}
          onViewDestination={() => onViewChange("itinerary")}
        />
      </div>

      <div className="mt-10 border-t border-border pt-6">
        <DestinationStrip
          stops={numbered}
          selectedId={selected?.id}
          onSelect={setSelectedId}
          tripReturnDate={tripReturnDate}
        />
      </div>
    </div>
  );
}

// LEFT column (desktop only) — a compact vertical journey list, echoing the
// itinerary's own fine timeline-line language.
function JourneyList({ stops, selectedId, onSelect, tripReturnDate }) {
  return (
    <div className="space-y-0">
      {stops.map((stop, i) => {
        const nextDate = i + 1 < stops.length ? stops[i + 1].date : tripReturnDate;
        const duration = formatDuration(daysBetween(stop.date, nextDate));
        const range = dateRangeFor(stop.date, nextDate);
        const selected = stop.id === selectedId;
        return (
          <button
            key={stop.id}
            type="button"
            onClick={() => onSelect(stop.id)}
            aria-current={selected ? "true" : undefined}
            className={`flex w-full items-start gap-3 border-l-2 py-3 pl-4 text-left transition-colors ${
              selected ? "border-rust" : "border-border hover:border-forest/40"
            }`}
          >
            <span className={`font-display text-sm font-bold ${selected ? "text-rust" : "text-forest"}`}>
              {stop.number}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`block truncate font-sans text-sm font-medium ${
                  selected ? "text-rust" : "text-foreground"
                }`}
              >
                {stop.loc || "Untitled destination"}
              </span>
              {(range || duration) && (
                <span className="block font-sans text-xs text-stone/50">
                  {range}
                  {range && duration ? " · " : null}
                  {duration}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// RIGHT column (desktop) / below the map (mobile) — the selected stop's real
// data only. Nothing here is fabricated: fields that don't exist are simply
// omitted.
function DestinationPreview({ stop, nextDate, duration, transit, hasCoords, onViewDestination }) {
  if (!stop) return null;
  const range = dateRangeFor(stop.date, nextDate);

  return (
    <div className="border-t border-border pt-6 lg:border-t-0 lg:pt-0">
      {stop.photo && (
        <div className="mb-4 overflow-hidden rounded-[6px]">
          <img
            src={stop.photo}
            alt={stop.loc || "Destination photo"}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      )}
      <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-stone/50">
        {stop.number}
      </p>
      <h3 className="mt-1 font-display text-2xl font-bold text-forest">
        {stop.loc || "Untitled destination"}
      </h3>
      {(range || duration) && (
        <p className="mt-1 font-sans text-xs text-stone/55">
          {range}
          {range && duration ? " · " : null}
          {duration}
        </p>
      )}
      {!hasCoords && (
        <p className="mt-2 font-sans text-xs italic text-stone/45">Map location unavailable</p>
      )}
      {stop.desc && <p className="mt-3 font-sans text-sm leading-relaxed text-muted">{stop.desc}</p>}
      {transit && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-stone/50">
            Getting there
          </p>
          <p className="mt-1 font-sans text-sm text-foreground">
            {TRANSIT_MODE_LABELS[transit.mode] || "Transport"}
            {transit.dur ? ` · ${transit.dur}` : ""}
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={onViewDestination}
        className="mt-5 inline-flex items-center gap-1 font-sans text-sm font-semibold text-forest transition-colors hover:text-forest/80"
      >
        View destination
        <span aria-hidden>→</span>
      </button>
    </div>
  );
}

// Compact horizontal destination navigation — small image, number, name,
// dates. Navigation only, deliberately not a second full destination card.
function DestinationStrip({ stops, selectedId, onSelect, tripReturnDate }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {stops.map((stop, i) => {
        const nextDate = i + 1 < stops.length ? stops[i + 1].date : tripReturnDate;
        const duration = formatDuration(daysBetween(stop.date, nextDate));
        const selected = stop.id === selectedId;
        return (
          <button
            key={stop.id}
            type="button"
            onClick={() => onSelect(stop.id)}
            aria-current={selected ? "true" : undefined}
            className={`flex w-32 flex-none snap-start flex-col overflow-hidden rounded-[5px] border text-left transition-colors sm:w-36 ${
              selected ? "border-rust" : "border-border hover:border-forest/40"
            }`}
          >
            <div className="aspect-[4/3] w-full bg-stone/[0.08]">
              {stop.photo ? (
                <img src={stop.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-stone/25">
                  {stop.number}
                </div>
              )}
            </div>
            <div className="p-2">
              <p className={`truncate font-sans text-xs font-semibold ${selected ? "text-rust" : "text-forest"}`}>
                {stop.number} {stop.loc || "Untitled"}
              </p>
              {(stop.date || duration) && (
                <p className="mt-0.5 font-sans text-[10px] text-stone/50">
                  {stop.date ? formatDMY(stop.date) : null}
                  {stop.date && duration ? " · " : null}
                  {duration}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
