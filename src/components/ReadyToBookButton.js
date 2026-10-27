// The final-decision control shared by accommodation and activity cards —
// separate from preference voting. ○ = not yet committed, ✓ = decided.
// Accommodation allows one per destination (choosing another replaces it);
// activities allow several — that rule lives in the caller, not here.
export default function ReadyToBookButton({ ready, onToggle, className = "mt-3" }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={Boolean(ready)}
      className={`${className} inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-forest/40 ${
        ready
          ? "border-forest/60 bg-sage/30 text-forest"
          : "border-stone/40 text-stone/70 hover:border-forest/50 hover:text-forest"
      }`}
    >
      <span aria-hidden>{ready ? "✓" : "○"}</span>
      Ready to book
    </button>
  );
}
