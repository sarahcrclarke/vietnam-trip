"use client";

import { useEffect, useRef, useState } from "react";
import { CameraIcon } from "./icons";
import AccommodationVotes from "./AccommodationVotes";

export default function AccommodationCard({ accommodation, currency, voters, unanimous, selected, onToggleVote, onSelectStay, onEdit, onRemove }) {
  const { name, type, location, image, pricePerNight, totalPrice, rating, reviewCount, link } = accommodation;
  const [editing, setEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const menuRef = useRef(null);
  const fileRef = useRef(null);

  const [nameVal, setNameVal] = useState(name || "");
  const [typeVal, setTypeVal] = useState(type || "");
  const [locationVal, setLocationVal] = useState(location || "");
  const [pricePerNightVal, setPricePerNightVal] = useState(pricePerNight ? String(pricePerNight) : "");
  const [totalPriceVal, setTotalPriceVal] = useState(totalPrice ? String(totalPrice) : "");
  const [ratingVal, setRatingVal] = useState(rating ? String(rating) : "");
  const [reviewCountVal, setReviewCountVal] = useState(reviewCount ? String(reviewCount) : "");
  const [linkVal, setLinkVal] = useState(link || "");
  const [imgSrc, setImgSrc] = useState(image || null);
  const objectUrlRef = useRef(null);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    []
  );

  useEffect(() => {
    if (!showMenu) return undefined;
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowMenu(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showMenu]);

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

  const handleSave = () => {
    onEdit({
      id: accommodation.id,
      name: nameVal,
      type: typeVal,
      location: locationVal,
      pricePerNight: pricePerNightVal ? parseFloat(pricePerNightVal) : null,
      totalPrice: totalPriceVal ? parseFloat(totalPriceVal) : null,
      rating: ratingVal ? parseFloat(ratingVal) : null,
      reviewCount: reviewCountVal ? parseInt(reviewCountVal) : null,
      link: linkVal,
      image: imgSrc,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setNameVal(name || "");
    setTypeVal(type || "");
    setLocationVal(location || "");
    setPricePerNightVal(pricePerNight ? String(pricePerNight) : "");
    setTotalPriceVal(totalPrice ? String(totalPrice) : "");
    setRatingVal(rating ? String(rating) : "");
    setReviewCountVal(reviewCount ? String(reviewCount) : "");
    setLinkVal(link || "");
    setImgSrc(image || null);
    setEditing(false);
  };

  const label = nameVal || "Accommodation";

  if (editing) {
    return (
      <div className="group flex snap-start flex-col space-y-3 rounded-[5px] border border-border bg-stone/[0.03] p-4">
        <div className="relative overflow-hidden rounded-[4px]">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={label}
              className="aspect-[4/3] w-full object-cover"
            />
          ) : (
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
          {imgSrc && (
            <div className="absolute right-1.5 top-1.5">
              <button
                type="button"
                onClick={removePhoto}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-background/85 text-rust backdrop-blur-sm transition-colors hover:text-rust/80"
              >
                <span className="text-xs">✕</span>
              </button>
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileRef}
          accept="image/*"
          onChange={onFile}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />

        <input
          type="text"
          value={nameVal}
          onChange={(e) => setNameVal(e.target.value)}
          placeholder="Property name"
          className="w-full rounded-sm bg-transparent px-0.5 -mx-0.5 text-xs font-semibold text-foreground placeholder:text-stone/40 hover:bg-stone/10 focus:bg-stone/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/25"
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={typeVal}
            onChange={(e) => setTypeVal(e.target.value)}
            placeholder="Type"
            className="rounded-sm bg-transparent px-0.5 -mx-0.5 text-xs text-muted placeholder:text-stone/40 hover:bg-stone/10 focus:bg-stone/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/25"
          />
          <input
            type="text"
            value={locationVal}
            onChange={(e) => setLocationVal(e.target.value)}
            placeholder="Location"
            className="rounded-sm bg-transparent px-0.5 -mx-0.5 text-xs text-muted placeholder:text-stone/40 hover:bg-stone/10 focus:bg-stone/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/25"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="block text-[10px] uppercase tracking-wide text-stone/40">Price/night</span>
            <input
              type="text"
              inputMode="decimal"
              value={pricePerNightVal}
              onChange={(e) => setPricePerNightVal(e.target.value)}
              placeholder="0"
              className="w-full rounded-sm bg-transparent px-0.5 -mx-0.5 text-xs text-muted placeholder:text-stone/40 hover:bg-stone/10 focus:bg-stone/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/25"
            />
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wide text-stone/40">Total price</span>
            <input
              type="text"
              inputMode="decimal"
              value={totalPriceVal}
              onChange={(e) => setTotalPriceVal(e.target.value)}
              placeholder="0"
              className="w-full rounded-sm bg-transparent px-0.5 -mx-0.5 text-xs text-muted placeholder:text-stone/40 hover:bg-stone/10 focus:bg-stone/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/25"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="block text-[10px] uppercase tracking-wide text-stone/40">Rating</span>
            <input
              type="text"
              inputMode="decimal"
              value={ratingVal}
              onChange={(e) => setRatingVal(e.target.value)}
              placeholder="0"
              className="w-full rounded-sm bg-transparent px-0.5 -mx-0.5 text-xs text-muted placeholder:text-stone/40 hover:bg-stone/10 focus:bg-stone/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/25"
            />
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wide text-stone/40">Reviews</span>
            <input
              type="text"
              inputMode="numeric"
              value={reviewCountVal}
              onChange={(e) => setReviewCountVal(e.target.value)}
              placeholder="0"
              className="w-full rounded-sm bg-transparent px-0.5 -mx-0.5 text-xs text-muted placeholder:text-stone/40 hover:bg-stone/10 focus:bg-stone/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/25"
            />
          </div>
        </div>

        <input
          type="url"
          value={linkVal}
          onChange={(e) => setLinkVal(e.target.value)}
          placeholder="Property link"
          className="w-full rounded-sm bg-transparent px-0.5 -mx-0.5 text-xs text-muted placeholder:text-stone/40 hover:bg-stone/10 focus:bg-stone/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/25"
        />

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="text-xs font-semibold text-forest transition-colors hover:text-forest/80"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="text-xs text-stone/60 transition-colors hover:text-forest"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex snap-start flex-col">
      <div className={`relative overflow-hidden rounded-[5px] ${selected ? "ring-1 ring-forest/40" : ""}`}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={label}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full flex-col items-center justify-center bg-stone/[0.06]">
            <span className="text-stone/30 text-xl">🏠</span>
          </div>
        )}

        <div className="absolute right-1.5 top-1.5" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu((v) => !v)}
            aria-label={label ? `Options for ${label}` : "Accommodation options"}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-background/85 text-foreground/60 backdrop-blur-sm transition-colors hover:text-forest"
          >
            <span className="text-xs tracking-wider">•••</span>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full z-10 mt-1 min-w-[8.5rem] space-y-1 rounded-[4px] border border-border bg-background px-2 py-1.5 shadow-sm">
              <button
                type="button"
                onClick={() => {
                  onSelectStay();
                  setShowMenu(false);
                }}
                className="block w-full text-left text-xs font-medium text-forest transition-colors hover:text-forest/80"
              >
                {selected ? "Deselect stay" : "Select stay"}
              </button>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setShowMenu(false);
                }}
                className="block w-full text-left text-xs text-muted transition-colors hover:text-forest"
              >
                Edit accommodation
              </button>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                onClick={() => {
                  setConfirming(true);
                  setShowMenu(false);
                }}
                className="block w-full text-left text-xs font-medium text-rust transition-colors hover:text-rust/80"
              >
                Remove accommodation
              </button>
            </div>
          )}
        </div>

        {confirming && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/95 px-3 text-center">
            <p className="font-sans text-xs leading-snug text-forest">
              Remove {label ? `"${label}"` : "this accommodation"}?
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
                onClick={() => onRemove(accommodation.id)}
                className="font-semibold text-rust transition-colors hover:text-rust/80"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {(unanimous || selected) && (
        <div className="mt-2 space-y-0.5">
          {unanimous && (
            <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-rust">
              <span aria-hidden>★</span>
              Everyone&rsquo;s pick
            </p>
          )}
          {selected && (
            <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-forest">
              <span aria-hidden>✓</span>
              Selected stay
            </p>
          )}
        </div>
      )}

      <h4 className={`font-display text-base font-semibold leading-tight text-foreground truncate ${(unanimous || selected) ? "mt-1" : "mt-3"}`}>
        {nameVal}
      </h4>

      <div className="mt-1 flex items-center gap-2 text-xs text-muted">
        {typeVal && <span>{typeVal}</span>}
        {typeVal && locationVal && <span aria-hidden>·</span>}
        {locationVal && <span>{locationVal}</span>}
      </div>

      {ratingVal && (
        <div className="mt-1.5 flex items-center gap-1 text-xs">
          <span className="text-rust">★</span>
          <span className="text-foreground font-semibold">{ratingVal}</span>
          {reviewCountVal && <span className="text-stone/60">({reviewCountVal})</span>}
        </div>
      )}

      <div className="mt-2 flex items-baseline gap-1 font-semibold text-rust">
        <span className="text-xs">{currency}</span>
        <span className="text-base">{pricePerNightVal}</span>
        <span className="text-xs text-stone/60">/ night</span>
      </div>

      {totalPriceVal && (
        <div className="mt-1 text-xs text-stone/60">
          {currency}{totalPriceVal} total
        </div>
      )}

      {linkVal && (
        <a
          href={linkVal}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-forest transition-colors hover:text-forest/80"
        >
          View property
          <span aria-hidden>↗</span>
        </a>
      )}

      <AccommodationVotes
        voters={voters}
        votes={accommodation.votes || {}}
        onToggle={onToggleVote}
      />
    </div>
  );
}
