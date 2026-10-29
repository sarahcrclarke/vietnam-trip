// The one place monetary amounts are formatted for display: always exactly 2
// decimal places (8.5 -> "8.50", 10 -> "10.00", 0 -> "0.00"), rounded to the
// penny. Display only — stored values stay plain numbers. The currency symbol
// is added by the caller.
export function formatMoney(n) {
  const value = Number(n);
  if (!Number.isFinite(value)) return "0.00";
  return (Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2);
}

// For editable amount fields, which hold whatever string is being typed: a
// valid number is shown to 2 decimals; blank (genuinely no value) and
// half-typed text are left exactly as they are.
export function formatMoneyInput(value) {
  if (value == null) return "";
  const text = String(value);
  if (text.trim() === "" || !Number.isFinite(Number(text))) return text;
  return formatMoney(text);
}

// Activity cost in editable state: "" = no price entered (null in the
// database); a numeric 0 stays "0" so it survives reload as an explicit free
// activity rather than being treated as blank.
export const activityCostToInput = (value) => (value == null ? "" : String(Number(value)));

// True only for an explicitly entered zero (not blank, not missing).
export const isFreeActivityCost = (input) => typeof input === "string" && input.trim() !== "" && Number(input) === 0;
