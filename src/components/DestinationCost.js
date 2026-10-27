import { formatMoney } from "@/lib/cost";

// Read-only destination total (selected stay + Ready-to-book activities),
// calculated by lib/cost.js. £ flush against the value; same rust, bold,
// right-aligned treatment the editable cost had.
export default function DestinationCost({ total, currency, priceNeeded }) {
  return (
    <span className="inline-flex flex-col items-end">
      <span
        aria-label="Destination total"
        className="font-display text-2xl font-bold text-rust sm:text-3xl"
      >
        {currency}
        {formatMoney(total)}
      </span>
      {priceNeeded && (
        <span className="font-sans text-[10px] uppercase tracking-wide text-stone/60">Price needed</span>
      )}
    </span>
  );
}
