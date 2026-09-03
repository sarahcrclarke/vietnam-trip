// Binary voting: selected (yes) or not selected — no third "no" state.
// Controlled by the parent ActivityGrid (not local state) because unanimity
// — and therefore activity ordering — depends on comparing every activity's
// votes against the current voter list at once. Renders one pill per
// included+voter traveller, using their LIVE initials/name, so an edit in
// traveller management is reflected immediately.
export default function ActivityVotes({ voters, votes, onToggle }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {voters.map((voter) => {
        const selected = Boolean(votes[voter.id]);
        return (
          <button
            key={voter.id}
            type="button"
            onClick={() => onToggle(voter.id)}
            aria-pressed={selected}
            aria-label={`${voter.initials || voter.name || "Traveller"}: ${
              selected ? "selected" : "not selected"
            }`}
            title={voter.name || undefined}
            className={`rounded-full border px-1.5 py-0.5 font-sans text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-forest/40 ${
              selected
                ? "border-forest/60 bg-sage/30 text-forest"
                : "border-stone/40 text-stone/70 hover:border-stone/60"
            }`}
          >
            {voter.initials || "?"}
          </button>
        );
      })}
    </div>
  );
}
