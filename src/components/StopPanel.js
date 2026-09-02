import ActivityCard from "./ActivityCard";
import { DragHandleIcon, CalendarIcon, CloseIcon, CameraIcon } from "./icons";
import { formatDMY } from "@/lib/date";

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

        {day.photo ? (
          <img
            src={day.photo}
            alt={day.loc}
            className="h-56 w-full object-cover sm:h-72"
          />
        ) : (
          <div className="flex h-56 w-full items-center justify-center bg-ink/5 text-ink/30 sm:h-72">
            <CameraIcon />
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-5 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-forest sm:text-4xl">
            {day.loc}
          </h2>
          <div className="flex items-center gap-1.5 font-mono text-sm text-ink/70">
            <CalendarIcon />
            {formatDMY(day.date)}
          </div>
        </div>

        {day.desc && (
          <p className="px-4 pb-5 pt-3 text-sm leading-relaxed text-ink/80 sm:px-6 sm:text-base">
            {day.desc}
          </p>
        )}

        <div className="mx-4 border-t border-dashed border-ink/40 sm:mx-6" />

        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <span className="rounded bg-sage px-3 py-1 font-mono text-xs font-semibold uppercase tracking-widest text-forest">
            {day.tag}
          </span>
          <span className="border-b border-rust/50 pb-0.5 font-mono text-lg font-bold text-rust sm:text-xl">
            {currency}
            {day.cost}
          </span>
        </div>

        {day.activities.length > 0 && (
          <>
            <div className="flex items-center gap-2 border-t border-ink/30 px-4 pb-4 pt-6 sm:px-6">
              <span className="text-rust" aria-hidden>
                ☆
              </span>
              <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-forest sm:text-sm">
                Things to do in {day.loc}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-5 px-4 pb-6 sm:grid-cols-4 sm:px-6 sm:pb-8">
              {day.activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  currency={currency}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
