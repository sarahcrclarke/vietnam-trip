"use client";

import { useEffect, useRef, useState } from "react";
import { CameraIcon } from "./icons";
import ActivityVotes from "./ActivityVotes";
import ActivityFields from "./ActivityFields";

export default function ActivityCard({ activity, currency, voters, unanimous, onToggleVote, onRemove }) {
  const { name, link, cost, image, votes } = activity;
  const [confirming, setConfirming] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  // Name is always editable — existing JSON names and newly-added activities
  // both edit the same client-side state. No persistence; a refresh restores
  // the JSON value.
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

  const label = nameVal;

  return (
    <div className="group flex snap-start flex-col">
      <div className="relative overflow-hidden rounded-[5px]">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={label || "Activity image"}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          // Existing camera placeholder, now clickable to add a photo.
          <button
            type="button"
            onClick={openPicker}
            aria-label="Add photo"
            className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 bg-stone/[0.06] text-stone/35 transition-colors hover:bg-stone/10 hover:text-forest/60"
          >
            <CameraIcon />
            <span className="font-sans text-[10px] font-medium uppercase tracking-wide text-stone/45">
              Add photo
            </span>
          </button>
        )}

        {/* Restrained utility menu — replaces permanently-visible controls. */}
        <div className="absolute right-1.5 top-1.5">
          <button
            type="button"
            onClick={() => setShowMenu((v) => !v)}
            aria-label={label ? `Options for ${label}` : "Activity options"}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-background/85 text-foreground/60 backdrop-blur-sm transition-colors hover:text-forest"
          >
            <span className="text-xs tracking-wider">•••</span>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full z-10 mt-1 min-w-[8.5rem] space-y-1 rounded-[4px] border border-border bg-background px-2 py-1.5 shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  openPicker();
                }}
                className="block w-full text-left text-xs text-muted transition-colors hover:text-forest"
              >
                {imgSrc ? "Change photo" : "Add photo"}
              </button>
              {imgSrc && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    removePhoto();
                  }}
                  className="block w-full text-left text-xs text-rust transition-colors hover:text-rust/80"
                >
                  Remove photo
                </button>
              )}
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  setConfirming(true);
                }}
                className="block w-full text-left text-xs font-medium text-rust transition-colors hover:text-rust/80"
              >
                Remove activity
              </button>
            </div>
          )}
        </div>

        {confirming && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/95 px-3 text-center">
            <p className="font-sans text-xs leading-snug text-forest">
              Remove {label ? `"${label}"` : "this activity"}?
            </p>
            <div className="flex gap-3 font-sans text-xs">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="text-muted transition-colors hover:text-forest"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onRemove(activity.id)}
                className="font-semibold text-rust transition-colors hover:text-rust/80"
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

      {unanimous && (
        <p className="mt-2 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-rust">
          <span aria-hidden>★</span>
          Everyone&rsquo;s pick
        </p>
      )}

      <input
        type="text"
        value={nameVal}
        onChange={(e) => setNameVal(e.target.value)}
        placeholder="Activity name"
        aria-label="Activity name"
        className={`w-full truncate rounded-sm bg-transparent font-sans text-xs font-semibold text-foreground placeholder:font-normal placeholder:text-stone/40 hover:bg-stone/[0.06] focus:bg-stone/[0.06] focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/30 sm:text-sm ${
          unanimous ? "mt-1" : "mt-2"
        }`}
      />

      <ActivityFields link={link} cost={cost} travelTime={activity.travelTime} currency={currency} />

      <ActivityVotes voters={voters} votes={votes} onToggle={onToggleVote} />
    </div>
  );
}
