"use client";

import { useRef, useState } from "react";
import { CameraIcon } from "./icons";

// Destination photo management — same approved behaviour as activity images,
// sized for the stop photo. Controlled by Itinerary's stops state (not
// local) because MAP's destination preview/strip render a stop's photo
// straight from `stops` and must reflect a change immediately, including
// across a tab switch (which unmounts this component).
//
// Uploaded photos are client-side object URLs only (no Supabase Storage
// yet — see AGENTS-facing audit notes). An object URL is revoked when THIS
// instance replaces or removes it, since at that moment it's certainly
// orphaned; it is deliberately NOT revoked on unmount, because the shared
// `photo` value may still be in use elsewhere (MAP) after this component
// unmounts. Existing JSON photos are data: URLs and are never revoked.
export default function DestinationPhoto({ photo, loc, onChange }) {
  const [showMenu, setShowMenu] = useState(false);
  const objectUrlRef = useRef(null);
  const fileRef = useRef(null);

  const openPicker = () => fileRef.current?.click();

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = url;
    onChange(url);
  };

  const removePhoto = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    onChange(null);
  };

  return (
    <div className="group relative overflow-hidden rounded-[5px]">
      {photo ? (
        <>
          <img
            src={photo}
            alt={loc}
            className="h-72 w-full object-cover sm:h-96"
          />
          <div className="absolute right-3 top-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu((v) => !v)}
                aria-label="Photo options"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-background/85 text-foreground/70 backdrop-blur-sm transition-colors hover:text-forest"
              >
                <span className="text-sm tracking-wider">•••</span>
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 min-w-[9rem] space-y-1 rounded-[4px] border border-border bg-background px-2 py-1.5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      openPicker();
                    }}
                    className="block w-full text-left text-sm text-stone/70 transition-colors hover:text-forest"
                  >
                    Change photo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      removePhoto();
                    }}
                    className="block w-full text-left text-sm text-rust transition-colors hover:text-rust/80"
                  >
                    Remove photo
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          aria-label="Add photo"
          className="flex h-72 w-full flex-col items-center justify-center gap-2 bg-stone/[0.06] text-stone/40 transition-colors hover:bg-stone/10 hover:text-forest/60 sm:h-96"
        >
          <CameraIcon />
          <span className="font-sans text-xs font-medium uppercase tracking-widest text-stone/50">
            Add photo
          </span>
        </button>
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
  );
}
