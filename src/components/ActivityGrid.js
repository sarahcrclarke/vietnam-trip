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
      className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-4"
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
        className="flex min-h-[7rem] flex-col items-center justify-center gap-1 rounded-[4px] border border-border/70 bg-transparent font-sans text-[11px] font-medium uppercase tracking-wide text-stone/45 transition-colors hover:border-forest/25 hover:bg-sage/10 hover:text-forest/70"
      >
        <span aria-hidden className="text-base leading-none">
          +
        </span>
        Add activity
      </button>
    </div>
  );
}
