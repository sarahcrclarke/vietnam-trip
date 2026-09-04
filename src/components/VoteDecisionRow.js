"use client";

import ActivityVotes from "./ActivityVotes";
import AccommodationVotes from "./AccommodationVotes";

// Compact decision row for the Votes page — one activity or accommodation
// per row: a small recognition thumbnail, name, a couple of status badges,
// and the SAME voting pills used on the itinerary (ActivityVotes /
// AccommodationVotes, reused unmodified). Never a full ActivityCard /
// AccommodationCard — this is a list treatment for scanning many items,
// not for browsing or editing them.
export default function VoteDecisionRow({
  image,
  title,
  subtitle,
  meta,
  unanimous,
  voters,
  votes,
  onToggleVote,
  kind = "activity",
  selected,
  onSelectStay,
}) {
  const VotesComponent = kind === "accommodation" ? AccommodationVotes : ActivityVotes;
  // Both vote-pill components carry their own top margin, sized for stacking
  // under a card's content — cancelled here so they sit centred inline.
  const votesMarginFix = kind === "accommodation" ? "-mt-2" : "-mt-1.5";

  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="h-10 w-10 flex-none overflow-hidden rounded-[4px] bg-stone/[0.08]">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone/25">
            <span aria-hidden className="text-xs">
              {kind === "accommodation" ? "🏠" : "•"}
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-sans text-sm font-medium text-foreground">
          {title || (kind === "accommodation" ? "Accommodation" : "Activity")}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {subtitle && <span className="text-xs text-stone/55">{subtitle}</span>}
          {meta && <span className="text-xs font-medium text-rust">{meta}</span>}
          {unanimous && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide text-rust">
              <span aria-hidden>★</span> Everyone&rsquo;s pick
            </span>
          )}
          {kind === "accommodation" && selected && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide text-forest">
              <span aria-hidden>✓</span> Selected
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-none items-center gap-2">
        <div className={votesMarginFix}>
          <VotesComponent voters={voters} votes={votes || {}} onToggle={onToggleVote} />
        </div>
        {kind === "accommodation" && (
          <button
            type="button"
            onClick={onSelectStay}
            className={`font-sans text-[10px] font-semibold uppercase tracking-wide transition-colors ${
              selected ? "text-forest/60 hover:text-forest" : "text-stone/50 hover:text-forest"
            }`}
          >
            {selected ? "Deselect" : "Select"}
          </button>
        )}
      </div>
    </div>
  );
}
