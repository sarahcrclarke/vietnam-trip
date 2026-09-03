"use client";

import { useState } from "react";

// Display mapping — preserved exactly: Sarah = SCC, Dom = DC, Steph = SR.
const VOTER_LABELS = { Sarah: "SCC", Dom: "DC", Steph: "SR" };
const VOTE_ORDER = ["Sarah", "Dom", "Steph"];

// Keep the existing pill styling / visual language.
//   null  -> neutral outlined
//   true  -> muted sage / dark-green (selected but restrained)
//   false -> muted rust (negative but not aggressive)
function voteStyle(value) {
  if (value === true) return "border-forest/60 bg-sage/30 text-forest";
  if (value === false) return "border-rust/45 bg-rust/[0.06] text-rust";
  return "border-stone/40 text-stone/70";
}

// Cycle: null -> true -> false -> null
function nextVote(value) {
  if (value === true) return false;
  if (value === false) return null;
  return true;
}

function ariaState(value) {
  if (value === true) return "interested";
  if (value === false) return "not interested";
  return "undecided";
}

export default function ActivityVotes({ votes }) {
  // Initial state comes straight from the activity's JSON vote values.
  // Copy the prop so the source object is never mutated. Client-side only —
  // no persistence; a refresh restores the original JSON values.
  const [state, setState] = useState(() => ({ ...votes }));

  const cycle = (voter) =>
    setState((prev) => ({ ...prev, [voter]: nextVote(prev[voter]) }));

  return (
    <div className="mt-2 flex gap-1.5">
      {VOTE_ORDER.map((voter) => (
        <button
          key={voter}
          type="button"
          onClick={() => cycle(voter)}
          aria-label={`${VOTER_LABELS[voter]}: ${ariaState(state[voter])}`}
          className={`rounded-full border px-2 py-0.5 font-sans text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-forest/40 ${voteStyle(
            state[voter]
          )}`}
        >
          {VOTER_LABELS[voter]}
        </button>
      ))}
    </div>
  );
}
