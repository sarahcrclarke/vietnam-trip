"use client";

import { useEffect, useRef, useState } from "react";

const AVATAR_STYLES = [
  "bg-forest/20 text-forest",
  "bg-rust/20 text-rust",
  "bg-sage/30 text-forest",
  "bg-stone/25 text-stone",
];

// Keeps the header row compact — beyond this many included travellers, show
// a "+N" indicator instead of an ever-growing stack of circles.
const MAX_VISIBLE = 4;

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors ${
        active
          ? "border-forest/60 bg-sage/30 text-forest"
          : "border-stone/35 text-stone/50 hover:border-stone/55"
      }`}
    >
      {children}
    </button>
  );
}

// Header avatar cluster + compact traveller management panel. Travellers
// live in TripPlanner (shared trip-level state); this component only reads
// and edits that list via props, so voting/transport-assignment features can
// read the same source later. Client-side only — no persistence.
export default function TravellerAvatars({ travellers, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const seq = useRef(0);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const included = travellers.filter((t) => t.included);
  const visible = included.slice(0, MAX_VISIBLE);
  const overflow = included.length - visible.length;

  const update = (id, patch) =>
    onChange((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const remove = (id) => onChange((prev) => prev.filter((t) => t.id !== id));

  const add = () => {
    seq.current += 1;
    const id = `traveller-${Date.now()}-${seq.current}`;
    onChange((prev) => [...prev, { id, initials: "", name: "", voter: false, included: true }]);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Manage travellers"
        aria-expanded={open}
        className="flex items-center -space-x-2"
      >
        {visible.map((t, i) => (
          <span
            key={t.id}
            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-background text-xs font-bold ${AVATAR_STYLES[i % AVATAR_STYLES.length]}`}
          >
            {t.initials || "?"}
          </span>
        ))}
        {overflow > 0 && (
          <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-stone/20 text-xs font-bold text-stone">
            +{overflow}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-[6px] border border-border bg-background p-3 text-left shadow-md sm:w-96">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-stone/50">
            Travellers
          </p>

          <div className="max-h-72 overflow-y-auto">
            {travellers.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center gap-2 border-b border-border py-2 last:border-0"
              >
                <input
                  type="text"
                  value={t.initials}
                  onChange={(e) => update(t.id, { initials: e.target.value.toUpperCase().slice(0, 4) })}
                  aria-label="Initials"
                  placeholder="AB"
                  className="w-12 rounded-sm bg-transparent px-1 text-xs font-semibold uppercase text-forest placeholder:text-stone/30 hover:bg-stone/10 focus:bg-stone/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/25"
                />
                <input
                  type="text"
                  value={t.name}
                  onChange={(e) => update(t.id, { name: e.target.value })}
                  aria-label="Name"
                  placeholder="Name"
                  className="min-w-0 flex-1 rounded-sm bg-transparent px-1 text-xs text-muted placeholder:text-stone/30 hover:bg-stone/10 focus:bg-stone/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/25"
                />
                <Pill active={t.included} onClick={() => update(t.id, { included: !t.included })}>
                  Included
                </Pill>
                <Pill active={t.voter} onClick={() => update(t.id, { voter: !t.voter })}>
                  Voter
                </Pill>
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  aria-label={`Remove ${t.name || t.initials || "traveller"}`}
                  className="text-stone/35 transition-colors hover:text-rust"
                >
                  &#10005;
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={add}
            className="mt-2 text-xs text-stone/50 transition-colors hover:text-forest"
          >
            + Add traveller
          </button>
        </div>
      )}
    </div>
  );
}
