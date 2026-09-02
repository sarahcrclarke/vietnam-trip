import { formatDMY } from "@/lib/date";

export default function TripHeader({ itinerary }) {
  const { title, subtitle, travelers, depart } = itinerary;
  const returnDate = itinerary.return;

  return (
    <header className="mx-auto max-w-5xl px-4 pb-8 pt-10 text-center sm:px-6 sm:pb-10 sm:pt-14">
      <h1 className="font-display text-3xl font-bold tracking-tight text-forest sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 text-sm text-ink/70 sm:text-base">{subtitle}</p>
      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-ink/60 sm:text-sm">
        {formatDMY(depart)} &ndash; {formatDMY(returnDate)} &middot; {travelers}
      </p>
    </header>
  );
}
