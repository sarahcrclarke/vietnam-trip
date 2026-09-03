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
    <div className="mx-auto w-full max-w-editorial border-t border-border px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-center font-sans text-xs font-semibold uppercase tracking-widest text-stone/50">
        Trip Cost Summary
      </p>

      {/* Extra trip costs — editable, seeded from itinerary.extraCosts. */}
      <div className="mx-auto mt-8 max-w-md">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-forest">
          Extra trip costs
        </p>
        <div className="mt-2">
          {extraCosts.map((extra) => (
            <div
              key={extra.id}
              className="flex items-center gap-2 border-b border-border py-1.5 last:border-0"
            >
              <input
                type="text"
                value={extra.label}
                onChange={(e) => updateExtra(extra.id, { label: e.target.value })}
                placeholder="Label"
                aria-label="Extra cost label"
                className="min-w-0 flex-1 rounded-sm bg-transparent px-1 -mx-1 font-sans text-sm text-foreground placeholder:text-stone/35 hover:bg-stone/[0.06] focus:bg-stone/[0.06] focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/25"
              />
              <span className="flex flex-none items-baseline gap-0.5 font-sans text-sm font-semibold text-rust">
                <span>{currency}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={extra.amount}
                  onChange={(e) => onAmountChange(extra.id, e.target.value)}
                  placeholder="0"
                  aria-label="Extra cost amount"
                  className="w-14 rounded-sm bg-transparent px-1 -mx-1 text-right placeholder:text-rust/40 hover:bg-stone/10 focus:bg-stone/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/25"
                />
              </span>
              <button
                type="button"
                onClick={() => removeExtra(extra.id)}
                aria-label={`Remove ${extra.label || "extra cost"}`}
                className="flex-none text-stone/35 transition-colors hover:text-rust"
              >
                &#10005;
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addExtra}
          className="mt-2 font-sans text-xs text-stone/50 transition-colors hover:text-forest"
        >
          + Add extra cost
        </button>
      </div>

      {/* Category subtotals + grand total. */}
      <div className="mx-auto mt-10 max-w-md">
        <dl className="space-y-2 font-sans text-sm">
          <div className="flex items-center justify-between">
            <dt className="uppercase tracking-wide text-muted">Destinations</dt>
            <dd className="text-foreground">
              {currency}
              {formatMoney(destinationTotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="uppercase tracking-wide text-muted">Transport</dt>
            <dd className="text-foreground">
              {currency}
              {formatMoney(transportTotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="uppercase tracking-wide text-muted">Activities</dt>
            <dd className="text-foreground">
              {currency}
              {formatMoney(activityTotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="uppercase tracking-wide text-muted">Extras</dt>
            <dd className="text-foreground">
              {currency}
              {formatMoney(extrasTotal)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
          <span className="font-sans text-xs font-semibold uppercase tracking-widest text-forest">
            Trip Total
          </span>
          <span className="font-display text-3xl font-bold text-forest sm:text-4xl">
            {currency}
            {formatMoney(grandTotal)}
          </span>
        </div>
      </div>

      {/* Cost per person, from the shared traveller list. */}
      <div className="mx-auto mt-10 max-w-md text-center">
        <p className="font-sans text-xs uppercase tracking-widest text-muted">
          {includedCount} {includedCount === 1 ? "traveller" : "travellers"}
        </p>
        <p className="mt-1 font-display text-2xl font-bold text-rust sm:text-3xl">
          {perPerson != null ? `${currency}${perPerson.toFixed(2)}` : "—"}
          <span className="ml-1.5 font-sans text-xs font-semibold uppercase tracking-widest text-rust/70">
            per person
          </span>
        </p>
      </div>
    </div>
  );
}
