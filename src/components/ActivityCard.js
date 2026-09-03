"use client";

import { useEffect, useRef, useState } from "react";
import { CameraIcon, CloseIcon } from "./icons";
import ActivityVotes from "./ActivityVotes";
import ActivityFields from "./ActivityFields";

export default function ActivityCard({ activity, currency, isNew = false, onRemove }) {
  const { name, link, cost, image, votes } = activity;
  const [confirming, setConfirming] = useState(false);
  // New activities have an editable name; existing JSON names stay static.
  const [nameVal, setNameVal] = useState(name ?? "");

  // Image is client-side state only. Existing images start from the JSON
  // base64 (a data: URL, never revoked); device uploads use object URLs which
  // we revoke on replace/remove/unmount to avoid leaks. No persistence.
  const [imgSrc, setImgSrc] = useState(image || null);
  const objectUrlRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    []
  );

  const openPicker = () => fileRef.current?.click();

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be picked again later
    if (!file || !file.type.startsWith("image/")) return; // images only
    const url = URL.createObjectURL(file);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = url;
    setImgSrc(url);
  };

  const removePhoto = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setImgSrc(null);
  };

  const label = isNew ? nameVal : name;

  return (
    <div className="flex flex-col">
      <div className="relative">
        {imgSrc ? (
          <>
            <img
              src={imgSrc}
              alt={label || "Activity image"}
              className="aspect-[4/3] w-full object-cover"
            />
            {/* Subtle photo controls — kept small so they don't obscure the photo. */}
            <div className="absolute bottom-1.5 left-1.5 flex gap-1 font-mono text-[9px] uppercase tracking-wider">
              <button
                type="button"
                onClick={openPicker}
                className="border border-forest/40 bg-parchment/90 px-1.5 py-0.5 text-forest transition-colors hover:border-forest"
              >
                Change photo
              </button>
              <button
                type="button"
                onClick={removePhoto}
                className="border border-rust/50 bg-parchment/90 px-1.5 py-0.5 text-rust transition-colors hover:border-rust"
              >
                Remove photo
              </button>
            </div>
          </>
        ) : (
          // Existing camera placeholder, now clickable to add a photo.
          <button
            type="button"
            onClick={openPicker}
            aria-label="Add photo"
            className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 bg-ink/5 text-ink/30 transition-colors hover:bg-ink/10 hover:text-forest/60"
          >
            <CameraIcon />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-forest/60">
              + Add photo
            </span>
          </button>
        )}

        {/* Activity delete — unchanged behaviour, distinct from photo controls. */}
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={label ? `Remove ${label}` : "Remove activity"}
          className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-ink/20 bg-parchment/95 text-ink/60 transition-colors hover:border-rust/50 hover:text-rust"
        >
          <CloseIcon className="h-2.5 w-2.5" />
        </button>

        {confirming && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-parchment/95 px-3 text-center">
            <p className="font-mono text-[11px] leading-snug text-forest">
              Remove {label ? `“${label}”` : "this activity"}?
            </p>
            <div className="flex gap-2 font-mono text-[10px] uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="border border-dashed border-ink/40 px-2 py-0.5 text-ink/70 transition-colors hover:border-ink/70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onRemove(activity.id)}
                className="border border-dashed border-rust/60 px-2 py-0.5 font-semibold text-rust transition-colors hover:border-rust"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {isNew ? (
        <input
          type="text"
          value={nameVal}
          onChange={(e) => setNameVal(e.target.value)}
          placeholder="Activity name"
          aria-label="Activity name"
          className="mt-1.5 w-full bg-transparent text-sm font-semibold text-ink placeholder:font-normal placeholder:text-ink/40 focus:outline-none"
        />
      ) : (
        <p className="mt-1.5 truncate text-sm font-semibold text-ink">{name}</p>
      )}

      <ActivityFields link={link} cost={cost} currency={currency} />

      <ActivityVotes votes={votes} />
    </div>
  );
}
