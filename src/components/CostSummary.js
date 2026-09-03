"use client";

const COST_RE = /^\d*\.?\d{0,2}$/;

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Whole £ amounts show without decimals, matching the rest of the UI; a
// value with pence always shows exactly 2 decimal places.
function formatMoney(n) {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

// Trip cost summary — reads live totals straight from Itinerary's stops
// state (destinations, transport legs, activities) plus the trip-level extra
// costs and traveller list, so it can never drift out of sync with the
// editing UI above it. No separate/duplicate cost state of its own.
export default function CostSummary({ stops, extraCosts, onExtraCostsChange, travellers, currency }) {
  const destinationTotal = stops.reduce((sum, s) => sum + num(s.cost), 0);

  const transportTotal = stops.reduce(
    (sum, s) => sum + s.journey.filter((item) => item.type === "leg").reduce((a, leg) => a + num(leg.cost), 0),
    0
  );

  const activityTotal = stops.reduce(
    (sum, s) => sum + s.activities.reduce((a, act) => a + num(act.cost), 0),
    0
  );

  const extrasTotal = extraCosts.reduce((sum, e) => sum + num(e.amount), 0);

  const grandTotal = destinationTotal + transportTotal + activityTotal + extrasTotal;

  const includedCount = travellers.filter((t) => t.included).length;
  const perPerson = includedCount > 0 ? grandTotal / includedCount : null;

  const updateExtra = (id, patch) =>
    onExtraCostsChange((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const removeExtra = (id) => onExtraCostsChange((prev) => prev.filter((e) => e.id !== id));

  const addExtra = () => {
    const id = `extra-${Date.now()}-${Math.round(Math.random() * 1e4)}`;
    onExtraCostsChange((prev) => [...prev, { id, label: "", amount: "" }]);
  };

  const onAmountChange = (id, raw) => {
    if (COST_RE.test(raw)) updateExtra(id, { amount: raw });
  };

  return (
    <div className="mx-auto w-full max-w-editorial border-t border-border px-4 py-12 sm:px-6 sm:py-20">
      {/* Trip Summary Header */}
      <div className="mb-12 text-center">
        <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-stone/50 mb-6">
          Trip Summary
        </p>

        {/* Trip Total — The Star of the Show */}
        <div className="mb-8">
          <div className="font-display text-5xl font-bold text-forest mb-4">
            {currency}{formatMoney(grandTotal)}
          </div>
          <p className="font-sans text-sm text-muted">
            {perPerson != null
              ? `${currency}${perPerson.toFixed(2)} per person · ${includedCount} ${includedCount === 1 ? "traveller" : "travellers"}`
              : "—"}
          </p>
        </div>
      </div>

      {/* Category Breakdown — Restrained and Editorial */}
      <div className="mx-auto mb-16 max-w-sm">
        <div className="space-y-3 font-sans text-sm">
          <div className="flex items-baseline justify-between gap-4 pb-2">
            <dt className="uppercase tracking-wide text-stone/60">Destinations</dt>
            <dd className="text-foreground font-medium">
              {currency}{formatMoney(destinationTotal)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 pb-2">
            <dt className="uppercase tracking-wide text-stone/60">Transport</dt>
            <dd className="text-foreground font-medium">
              {currency}{formatMoney(transportTotal)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 pb-2">
            <dt className="uppercase tracking-wide text-stone/60">Activities</dt>
            <dd className="text-foreground font-medium">
              {currency}{formatMoney(activityTotal)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
            <dt className="uppercase tracking-wide text-stone/60">Extras</dt>
            <dd className="text-foreground font-medium">
              {currency}{formatMoney(extrasTotal)}
            </dd>
          </div>
        </div>
      </div>

      {/* Additional Costs Section */}
      <div className="mx-auto max-w-sm border-t border-border pt-8">
        <p className="mb-4 font-sans text-[10px] font-semibold uppercase tracking-widest text-stone/50">
          Additional Costs
        </p>

        {/* Editable extra costs */}
        <div className="mb-4 space-y-2">
          {extraCosts.map((extra) => (
            <div
              key={extra.id}
              className="flex items-center gap-3 rounded-sm px-2 py-1.5 hover:bg-stone/[0.03]"
            >
              <input
                type="text"
                value={extra.label}
                onChange={(e) => updateExtra(extra.id, { label: e.target.value })}
                placeholder="Label"
                aria-label="Extra cost label"
                className="min-w-0 flex-1 bg-transparent font-sans text-sm text-foreground placeholder:text-stone/35 focus:outline-none focus:ring-1 focus:ring-forest/25 rounded-sm px-1 -mx-1"
              />
              <span className="flex flex-none items-baseline gap-0.5 font-sans text-sm font-medium text-rust">
                <span className="text-xs">{currency}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={extra.amount}
                  onChange={(e) => onAmountChange(extra.id, e.target.value)}
                  placeholder="0"
                  aria-label="Extra cost amount"
                  className="w-12 bg-transparent text-right placeholder:text-rust/40 focus:outline-none focus:ring-1 focus:ring-forest/25 rounded-sm px-1 -mx-1"
                />
              </span>
              <button
                type="button"
                onClick={() => removeExtra(extra.id)}
                aria-label={`Remove ${extra.label || "extra cost"}`}
                className="flex-none text-stone/30 transition-colors hover:text-rust"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Add button */}
        <button
          type="button"
          onClick={addExtra}
          className="font-sans text-xs text-stone/50 transition-colors hover:text-forest"
        >
          + Add cost
        </button>
      </div>
    </div>
  );
}
