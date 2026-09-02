"use client";

import { useState } from "react";
import { CameraIcon, CloseIcon } from "./icons";
import ActivityVotes from "./ActivityVotes";
import ActivityFields from "./ActivityFields";

export default function ActivityCard({ activity, currency, isNew = false, onRemove }) {
  const { name, link, cost, image, votes } = activity;
  const [confirming, setConfirming] = useState(false);
  // New activities have an editable name; existing JSON names stay static.
  const [nameVal, setNameVal] = useState(name ?? "");

  const label = isNew ? nameVal : name;

  return (
    <div className="flex flex-col">
      <div className="relative">
        {image ? (
          <img
            src={image}
            alt={name}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-ink/5 text-ink/30">
            <CameraIcon />
          </div>
        )}

        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={label ? `Remove ${label}` : "Remove activity"}
          className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-ink/20 bg-parchment/95 text-ink/60 transition-colors hover:border-rust/50 hover:text-rust"
        >
          <CloseIcon className="h-2.5 w-2.5" />
        </button>

        {confirming && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-parchment/95 px-3 text-center">
            <p className="font-mono text-[11px] leading-snug text-forest">
              Remove {label ? `“${label}”` : "this activity"}?
            </p>
            <div className="flex gap-2 font-mono text-[10px] uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="border border-dashed border-ink/40 px-2 py-0.5 text-ink/70 transition-colors hover:border-ink/70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onRemove(activity.id)}
                className="border border-dashed border-rust/60 px-2 py-0.5 font-semibold text-rust transition-colors hover:border-rust"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {isNew ? (
        <input
          type="text"
          value={nameVal}
          onChange={(e) => setNameVal(e.target.value)}
          placeholder="Activity name"
          aria-label="Activity name"
          className="mt-1.5 w-full bg-transparent text-sm font-semibold text-ink placeholder:font-normal placeholder:text-ink/40 focus:outline-none"
        />
      ) : (
        <p className="mt-1.5 truncate text-sm font-semibold text-ink">{name}</p>
      )}

      <ActivityFields link={link} cost={cost} currency={currency} />

      <ActivityVotes votes={votes} />
    </div>
  );
}
