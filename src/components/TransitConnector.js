export default function TransitConnector({ transit, currency }) {
  if (!transit) return null;

  const { mode, dur, cost } = transit;

  return (
    <div className="mx-auto flex max-w-5xl gap-3 px-4 sm:gap-5 sm:px-6">
      <div className="relative w-12 flex-none sm:w-16">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-forest/60" />
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1 py-4 font-mono text-[11px] uppercase tracking-widest text-ink/60 sm:text-xs">
        <span className="text-rust" aria-hidden>
          &rsaquo;
        </span>
        {mode && <span>{mode}</span>}
        {dur && (
          <>
            <span className="text-ink/30" aria-hidden>
              &middot;
            </span>
            <span className="normal-case tracking-normal text-ink/50">
              {dur}
            </span>
          </>
        )}
        {typeof cost === "number" && (
          <>
            <span className="text-ink/30" aria-hidden>
              &middot;
            </span>
            <span className="font-semibold text-rust">
              {currency}
              {cost}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
