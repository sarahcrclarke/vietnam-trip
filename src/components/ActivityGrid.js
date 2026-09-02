"use client";

import { useRef, useState } from "react";
import ActivityCard from "./ActivityCard";

// Client-side list state for ONE destination's activities. Initial data comes
// from JSON (copied, never mutated); no persistence, so a refresh restores it.
export default function ActivityGrid({ activities, currency, loc }) {
  const [list, setList] = useState(() =>
    activities.map((a) => ({ ...a, votes: { ...a.votes } }))
  );
  const seq = useRef(0);

  const addActivity = () => {
    seq.current += 1;
    const id = `new-${Date.now()}-${seq.current}`;
    setList((prev) => [
      ...prev,
      {
        id,
        name: "",
        link: "",
        cost: 0,
        image: null,
        votes: { Sarah: null, Dom: null, Steph: null },
        isNew: true,
      },
    ]);
  };

  const removeActivity = (id) =>
    setList((prev) => prev.filter((a) => a.id !== id));

  return (
    <div
      data-loc={loc}
      className="grid grid-cols-2 gap-x-3 gap-y-5 px-4 pb-6 sm:grid-cols-4 sm:px-6 sm:pb-8"
    >
      {list.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          currency={currency}
          isNew={!!activity.isNew}
          onRemove={removeActivity}
        />
      ))}

      <button
        type="button"
        onClick={addActivity}
        className="flex min-h-[9rem] flex-col items-center justify-center gap-1 border border-dashed border-forest/50 bg-parchment font-mono text-xs font-semibold uppercase tracking-widest text-forest transition-colors hover:border-forest hover:bg-sage/40"
      >
        <span aria-hidden className="text-lg leading-none">
          +
        </span>
        Add activity
      </button>
    </div>
  );
}
