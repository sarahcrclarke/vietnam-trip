import ActivityGrid from "./ActivityGrid";
import DestinationName from "./DestinationName";
import DestinationDate from "./DestinationDate";
import DestinationDescription from "./DestinationDescription";
import DestinationTag from "./DestinationTag";
import DestinationCost from "./DestinationCost";
import DestinationPhoto from "./DestinationPhoto";
import { DragHandleIcon, CloseIcon } from "./icons";

export default function StopPanel({ day, index, currency }) {
  const number = String(index + 1).padStart(2, "0");

  return (
    <div className="mx-auto flex max-w-5xl gap-3 px-4 sm:gap-5 sm:px-6">
      <div className="relative w-12 flex-none sm:w-16">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-forest/60" />
        <div className="relative z-10 mx-auto flex h-11 w-11 items-center justify-center rounded-full border-2 border-rust bg-parchment font-display text-base font-bold text-rust sm:h-14 sm:w-14 sm:text-lg">
          {number}
        </div>
      </div>

      <div className="flex-1 border border-ink/30 bg-parchment">
        <div className="flex items-center justify-between border-b border-ink/30 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink/60 sm:px-6 sm:text-xs">
          <span className="flex items-center gap-2">
            <DragHandleIcon />
            Drag to reorder
          </span>
          <span className="flex items-center gap-1 text-rust/80">
            <CloseIcon />
            Remove stop
          </span>
        </div>

        <DestinationPhoto photo={day.photo} loc={day.loc} />

        <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-5 sm:px-6">
          <DestinationName value={day.loc} />
          <DestinationDate value={day.date} />
        </div>

        <DestinationDescription value={day.desc} />

        <div className="mx-4 border-t border-dashed border-ink/40 sm:mx-6" />

        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <DestinationTag value={day.tag} />
          <DestinationCost value={day.cost} currency={currency} />
        </div>

        <div className="flex items-center gap-2 border-t border-ink/30 px-4 pb-4 pt-6 sm:px-6">
          <span className="text-rust" aria-hidden>
            ☆
          </span>
          <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-forest sm:text-sm">
            Things to do in {day.loc}
          </h3>
        </div>

        <ActivityGrid
          activities={day.activities}
          currency={currency}
          loc={day.loc}
        />
      </div>
    </div>
  );
}
