"use client";

import { useEffect, useRef, useState } from "react";
import { CameraIcon } from "./icons";

// Destination photo management — same approved behaviour as activity images,
// sized for the stop photo. Client-side only; object URLs revoked on
// replace/remove/unmount. Existing JSON photos are data: URLs (never revoked).
export default function DestinationPhoto({ photo, loc }) {
  const [imgSrc, setImgSrc] = useState(photo || null);
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
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
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

  return (
    <div className="relative">
      {imgSrc ? (
        <>
          <img
            src={imgSrc}
            alt={loc}
            className="h-56 w-full object-cover sm:h-72"
          />
          <div className="absolute bottom-2 left-2 flex gap-1 font-mono text-[9px] uppercase tracking-wider sm:text-[10px]">
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
        <button
          type="button"
          onClick={openPicker}
          aria-label="Add photo"
          className="flex h-56 w-full flex-col items-center justify-center gap-1 bg-ink/5 text-ink/30 transition-colors hover:bg-ink/10 hover:text-forest/60 sm:h-72"
        >
          <CameraIcon />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-forest/60 sm:text-xs">
            + Add photo
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
