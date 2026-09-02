import { CameraIcon, CloseIcon } from "./icons";

const VOTER_LABELS = { Sarah: "SCC", Dom: "DC", Steph: "SR" };
const VOTE_ORDER = ["Sarah", "Dom", "Steph"];

function voteStyle(value) {
  if (value === true) return "border-forest/70 bg-sage text-forest";
  if (value === false) return "border-rust/60 text-rust/80";
  return "border-ink/40 text-ink/60";
}

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

      <div className="mt-1.5 flex gap-1.5">
        {VOTE_ORDER.map((voter) => (
          <span
            key={voter}
            className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium ${voteStyle(
              votes[voter]
            )}`}
          >
            {VOTER_LABELS[voter]}
          </span>
        ))}
      </div>
    </div>
  );
}
