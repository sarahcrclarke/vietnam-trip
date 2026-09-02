import { CameraIcon, CloseIcon } from "./icons";
import ActivityVotes from "./ActivityVotes";

export default function ActivityCard({ activity, currency }) {
  const { name, link, cost, image, votes } = activity;

  return (
    <div className="flex flex-col">
      <div className="relative">
        {image ? (
          <img
            src={image}
            alt={name}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-ink/5 text-ink/30">
            <CameraIcon />
          </div>
        )}
        <span
          aria-hidden
          className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-ink/20 bg-parchment/95 text-ink/60"
        >
          <CloseIcon className="h-2.5 w-2.5" />
        </span>
      </div>

      <p className="mt-1.5 truncate text-sm font-semibold text-ink">{name}</p>

      <p className="mt-0.5 truncate border-b border-dashed border-ink/35 pb-0.5 font-mono text-[11px] text-ink/45">
        {link || "Link (optional)"}
      </p>

      <p className="mt-0.5 border-b border-dashed border-ink/35 pb-0.5 font-mono text-[11px]">
        <span className={cost ? "font-semibold text-rust" : "text-ink/45"}>
          {cost ? `${currency}${cost}` : `${currency} cost`}
        </span>
      </p>

      <ActivityVotes votes={votes} />
    </div>
  );
}
