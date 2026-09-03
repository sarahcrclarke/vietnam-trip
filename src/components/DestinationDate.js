import { CalendarIcon } from "./icons";
import { formatDMY } from "@/lib/date";

// Keeps the existing calendar-icon + DD/MM/YYYY presentation, with a real
// (transparent) date input overlaid so the native picker is used. Controlled
// by the parent stop list (rather than owning local state) because adjacent
// destinations' durations are derived from these dates and must recalculate
// the instant one changes.
export default function DestinationDate({ value, onChange }) {
  return (
    <div className="relative inline-flex items-center gap-1.5 rounded-sm px-0.5 -mx-0.5 font-sans text-sm text-muted transition-colors hover:bg-stone/10 focus-within:bg-stone/10 focus-within:ring-1 focus-within:ring-forest/25">
      <CalendarIcon />
      <span>{value ? formatDMY(value) : "DD/MM/YYYY"}</span>
      <input
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Destination date"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}
