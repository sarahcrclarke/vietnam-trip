import { formatDMY } from "@/lib/date";

// Displayed trip title — the JSON keeps its original "Việt Nam", but the
// approved heading text is "Vietnam"; the source file is never edited.
const DISPLAY_TITLE = "Vietnam";

// Departure date, return date and traveller count are lifted to TripPlanner
// (the return date also drives the final destination's derived duration in
// Itinerary), so this component just renders them with the handlers it's given.
export default function TripHeader({
  subtitle,
  depart,
  onDepartChange,
  returnDate,
  onReturnChange,
  travelers,
  onTravelersChange,
}) {
  return (
    <header className="border-b border-border">
      {/* Top navigation bar */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-8">
          <span className="font-display text-sm font-bold tracking-wide text-forest">
            VIỆT NAM
          </span>
          <div className="flex gap-6">
            <button className="font-sans text-sm text-forest transition-opacity hover:opacity-70">
              ITINERARY
            </button>
            <button className="font-sans text-sm text-muted transition-colors hover:text-forest">
              MAP
            </button>
            <button className="font-sans text-sm text-muted transition-colors hover:text-forest">
              VOTES
            </button>
            <button className="font-sans text-sm text-muted transition-colors hover:text-forest">
              PHOTOS
            </button>
            <button className="font-sans text-sm text-muted transition-colors hover:text-forest">
              INFO
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-7 w-7 rounded-full bg-forest/20 flex items-center justify-center text-xs font-bold text-forest">
            S
          </div>
          <div className="h-7 w-7 rounded-full bg-rust/20 flex items-center justify-center text-xs font-bold text-rust">
            D
          </div>
          <div className="h-7 w-7 rounded-full bg-sage/30 flex items-center justify-center text-xs font-bold text-stone">
            R
          </div>
        </div>
      </nav>

      {/* Header content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-forest sm:text-5xl">
          {DISPLAY_TITLE}
        </h1>
        <p className="mt-3 font-sans text-base text-muted sm:text-lg">
          {subtitle}
        </p>
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-1 font-sans text-xs uppercase tracking-widest text-muted sm:text-sm">
          <span className="relative inline-flex rounded-sm px-0.5 -mx-0.5 transition-colors hover:bg-stone/10 focus-within:bg-stone/10 focus-within:ring-1 focus-within:ring-forest/25">
            {depart ? formatDMY(depart) : "DD/MM/YYYY"}
            <input
              type="date"
              value={depart ?? ""}
              onChange={(e) => onDepartChange(e.target.value)}
              aria-label="Departure date"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </span>
          <span aria-hidden>&ndash;</span>
          <span className="relative inline-flex rounded-sm px-0.5 -mx-0.5 transition-colors hover:bg-stone/10 focus-within:bg-stone/10 focus-within:ring-1 focus-within:ring-forest/25">
            {returnDate ? formatDMY(returnDate) : "DD/MM/YYYY"}
            <input
              type="date"
              value={returnDate ?? ""}
              onChange={(e) => onReturnChange(e.target.value)}
              aria-label="Return date"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </span>
          <span aria-hidden>&middot;</span>
          <span className="relative inline-flex rounded-sm px-0.5 -mx-0.5 transition-colors hover:bg-stone/10 focus-within:bg-stone/10 focus-within:ring-1 focus-within:ring-forest/25">
            {travelers} {travelers === 1 ? "person" : "people"}
            <input
              type="number"
              min={1}
              value={travelers}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                onTravelersChange(Number.isNaN(n) || n < 1 ? 1 : n);
              }}
              aria-label="Number of travellers"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </span>
        </p>
      </div>
    </header>
  );
}
