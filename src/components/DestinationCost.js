// Non-negative monetary value; empty allowed while editing; invalid text
// rejected. Matches the activity-cost rules.
const COST_RE = /^\d*\.?\d{0,2}$/;

// Editable destination cost. £ kept as a separate span, flush against the
// value (no gap). Keeps the rust, bold treatment and right alignment.
// Controlled by Itinerary's stops state (not local) because the trip cost
// summary needs every destination's live cost to compute its subtotal.
export default function DestinationCost({ value, onChange, currency }) {
  const cost = value ?? "";

  const handleChange = (e) => {
    const next = e.target.value;
    if (COST_RE.test(next)) onChange(next);
  };

  return (
    <span className="inline-flex items-baseline rounded-sm px-1 -mx-1 font-display text-2xl font-bold text-rust transition-colors hover:bg-stone/10 focus-within:bg-stone/10 focus-within:ring-1 focus-within:ring-forest/25 sm:text-3xl">
      <span>{currency}</span>
      <span className="inline-grid">
        <span className="invisible col-start-1 row-start-1 whitespace-pre">
          {cost || "0"}
        </span>
        <input
          type="text"
          inputMode="decimal"
          size={1}
          value={cost}
          onChange={handleChange}
          aria-label="Destination cost"
          className="col-start-1 row-start-1 w-full min-w-0 bg-transparent focus:outline-none"
        />
      </span>
    </span>
  );
}
