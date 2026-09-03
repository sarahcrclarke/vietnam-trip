import { formatDMY } from "@/lib/date";

export default function TripHeader({ itinerary }) {
  const { title, subtitle, travelers, depart } = itinerary;
  const returnDate = itinerary.return;

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
          {title}
        </h1>
        <p className="mt-3 font-sans text-base text-muted sm:text-lg">
          {subtitle}
        </p>
        <p className="mt-4 font-sans text-xs uppercase tracking-widest text-muted sm:text-sm">
          {formatDMY(depart)} &ndash; {formatDMY(returnDate)} &middot; {travelers}
        </p>
      </div>
    </header>
  );
}
