// Destination duration — DERIVED from adjacent dates (this stop's date
// through the next stop's date, or the trip's return date for the final
// stop), so it's no longer independently editable. Renders nothing when no
// valid duration can be computed (missing/invalid dates), rather than
// showing a misleading value. Keeps the existing sage pill styling.
export default function DestinationTag({ value }) {
  if (!value) return null;
  return (
    <span className="inline-block rounded-[4px] bg-sage/25 px-3 py-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-forest">
      {value}
    </span>
  );
}
