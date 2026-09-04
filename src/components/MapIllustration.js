"use client";

import { TransportIcon } from "./icons";
import vietnamMapArt from "@/assets/map/vietnam-map.webp";

// A quadratic-bezier arc for flight legs (bowing gently away from the direct
// line, evoking a flight path) versus a straight line for ground/water
// transport — a subtle, elegant differentiation rather than literal routing.
function routePathD(x1, y1, x2, y2, mode) {
  if (mode !== "flight") return `M ${x1} ${y1} L ${x2} ${y2}`;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const offset = Math.min(len * 0.18, 8);
  const cx = mx + (-dy / len) * offset;
  const cy = my + (dx / len) * offset;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

function dashArrayFor(mode) {
  if (mode === "flight") return "0.8 1.8";
  if (mode === "ferry") return "0.2 1.4 2.4 1.4";
  if (mode === "train") return "2.4 1.3";
  return undefined; // car/bus/other/unspecified — a fine solid line
}

// The illustrated journey map — a static, hand-painted Vietnam atlas image
// (src/assets/map/vietnam-map.webp) as the geographic background, with the
// live route/transport/pin overlay drawn on top. The container's aspect
// ratio is pinned to the artwork's own native pixel ratio (1122×1402) so the
// image fills it with a plain, undistorted 1:1 scale — no crop, no
// non-uniform stretch, no letterboxing. The route/icon SVG (viewBox
// "0 0 100 100", preserveAspectRatio="none") and the pin buttons (plain
// left/top percentages) both resolve against that same box, so every layer
// — artwork, route, icons, pins — always scales together, at any width.
// No external tiles, no map service, no runtime network request.
export default function MapIllustration({ points, segments, selectedId, onSelect }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-[6px] border border-border"
      style={{ aspectRatio: "1122 / 1402" }}
    >
      <img
        src={vietnamMapArt.src}
        alt="Illustrated map of Vietnam and its neighbouring countries"
        className="absolute inset-0 h-full w-full"
        draggable={false}
      />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {segments.map((seg) => {
          const touchesSelected = seg.fromId === selectedId || seg.toId === selectedId;
          return (
            <path
              key={`${seg.fromId}-${seg.toId}`}
              d={routePathD(seg.x1, seg.y1, seg.x2, seg.y2, seg.mode)}
              fill="none"
              stroke="#1f3d31"
              strokeOpacity={touchesSelected ? 0.85 : 0.55}
              strokeWidth={touchesSelected ? 0.45 : 0.32}
              strokeDasharray={dashArrayFor(seg.mode)}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Transport glyphs — small monochrome "stamp" markers integrated
          into the route line, not standalone buttons. */}
      {segments
        .filter((seg) => seg.mode)
        .map((seg) => (
          <div
            key={`icon-${seg.fromId}-${seg.toId}`}
            aria-hidden
            className="absolute flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 items-center justify-center rounded-[2px] bg-forest/85 text-background shadow-sm"
            style={{ left: `${(seg.x1 + seg.x2) / 2}%`, top: `${(seg.y1 + seg.y2) / 2}%` }}
          >
            <span className="-rotate-45 scale-[0.4]">
              <TransportIcon mode={seg.mode} />
            </span>
          </div>
        ))}

      {/* Numbered destination pins. */}
      {points.map((p) => {
        const selected = p.id === selectedId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            aria-label={`${p.number}. ${p.loc || "Untitled destination"}`}
            aria-pressed={selected}
            className="absolute -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none"
            style={{ left: `${p.xPct}%`, top: `${p.yPct}%` }}
          >
            <span
              className={`flex items-center justify-center rounded-full border font-sans text-[10px] font-semibold transition-all ${
                selected
                  ? "h-7 w-7 border-rust bg-rust text-background shadow-sm ring-2 ring-rust/30"
                  : "h-6 w-6 border-forest bg-forest text-background shadow-sm hover:bg-forest/90"
              }`}
            >
              {p.number}
            </span>
            {/* Label shown only for the selected pin — with several
                destinations sitting close together (e.g. Hanoi and a return
                trip to it), always-on labels for every pin collide and read
                as clutter; numbers alone plus the journey list/strip already
                identify the rest. */}
            {selected && (
              <span
                aria-hidden
                className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-sm bg-background/85 px-1 font-sans text-[10px] font-semibold text-rust"
              >
                {p.loc || "Untitled"}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
