"use client";

import { useRef, useState } from "react";
import ActivityCard from "./ActivityCard";
import { migrateVotes, isUnanimous } from "@/lib/voting";

// Client-side list state for ONE destination's activities. Initial data comes
// from JSON (copied, never mutated); no persistence, so a refresh restores it.
// Votes are migrated once, up front, from the legacy name-keyed
// true/false/null shape into a binary shape keyed by stable traveller id.
//
// Votes live here (not inside each ActivityCard) because unanimity — and
// therefore which activities float to the top — depends on comparing every
// activity's votes against the current voter list at once.
export default function ActivityGrid({ activities, currency, loc, travellers }) {
  const [list, setList] = useState(() =>
    activities.map((a) => ({ ...a, votes: migrateVotes(a.votes) }))
  );
  const seq = useRef(0);

  // Only travellers who are both included in the trip and marked as a voter
  // get a voting pill. Recomputed from the live traveller list every render,
  // so adding/removing a voter or editing their initials/name takes effect
  // immediately, and unanimity is always judged against the current set.
  const voters = travellers.filter((t) => t.included && t.voter);

  const addActivity = () => {
    seq.current += 1;
    const id = `new-${Date.now()}-${seq.current}`;
    setList((prev) => [
      ...prev,
      { id, name: "", link: "", cost: 0, image: null, votes: {} },
    ]);
  };

  const removeActivity = (id) =>
    setList((prev) => prev.filter((a) => a.id !== id));

  const toggleVote = (activityId, travellerId) =>
    setList((prev) =>
      prev.map((a) =>
        a.id === activityId
          ? { ...a, votes: { ...a.votes, [travellerId]: !a.votes[travellerId] } }
          : a
      )
    );

  // Unanimous activities float to the top, keeping their existing relative
  // order; everyone else keeps their existing relative order too — nothing
  // beyond promoting the unanimous ones is reshuffled. Recomputed from live
  // state every render, so gaining/losing unanimity reorders automatically.
  const unanimousActivities = list.filter((a) => isUnanimous(a.votes, voters));
  const otherActivities = list.filter((a) => !isUnanimous(a.votes, voters));
  const displayList = [...unanimousActivities, ...otherActivities];

  return (
    <div
      data-loc={loc}
      className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-4"
    >
      {displayList.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          currency={currency}
          voters={voters}
          unanimous={isUnanimous(activity.votes, voters)}
          onToggleVote={(travellerId) => toggleVote(activity.id, travellerId)}
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
