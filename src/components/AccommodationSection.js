"use client";

import { useEffect, useRef, useState } from "react";
import AccommodationCard from "./AccommodationCard";
import { isUnanimous } from "@/lib/voting";

export default function AccommodationSection({ accommodations, accommodationWishlistUrl, selectedAccommodationId, currency, loc, travellers, onAccommodationsChange, onWishlistUrlChange, onSelectedAccommodationChange }) {
  const gridRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [editingWishlist, setEditingWishlist] = useState(false);
  const [wishlistUrlVal, setWishlistUrlVal] = useState(accommodationWishlistUrl || "");
  const seq = useRef(0);

  const voters = travellers.filter((t) => t.included && t.voter);

  useEffect(() => {
    const updateScrollState = () => {
      if (gridRef.current) {
        setCanScrollLeft(gridRef.current.canScrollLeft);
        setCanScrollRight(gridRef.current.canScrollRight);
      }
    };
    updateScrollState();
    const interval = setInterval(updateScrollState, 100);
    return () => clearInterval(interval);
  }, [accommodations.length]);

  const handleEditAccommodation = (updated) => {
    onAccommodationsChange(
      accommodations.map((a) => (a.id === updated.id ? { ...updated, votes: a.votes } : a))
    );
  };

  const handleRemoveAccommodation = (id) => {
    onAccommodationsChange(accommodations.filter((a) => a.id !== id));
  };

  const handleSelectStay = (accommodationId) => {
    onSelectedAccommodationChange(
      selectedAccommodationId === accommodationId ? null : accommodationId
    );
  };

  const handleToggleVote = (accommodationId, travellerId) => {
    onAccommodationsChange(
      accommodations.map((a) =>
        a.id === accommodationId
          ? { ...a, votes: { ...a.votes, [travellerId]: !a.votes[travellerId] } }
          : a
      )
    );
  };

  const handleAddAccommodation = () => {
    seq.current += 1;
    onAccommodationsChange([
      ...accommodations,
      {
        id: `accommodation-${Date.now()}-${seq.current}`,
        name: "",
        type: "",
        location: "",
        image: null,
        pricePerNight: null,
        totalPrice: null,
        rating: null,
        reviewCount: null,
        link: "",
      },
    ]);
  };

  const handleSaveWishlist = () => {
    onWishlistUrlChange(wishlistUrlVal);
    setEditingWishlist(false);
  };

  const handleCancelWishlist = () => {
    setWishlistUrlVal(accommodationWishlistUrl || "");
    setEditingWishlist(false);
  };

  return (
    <div className="space-y-6">
      {/* Wishlist section */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="font-sans text-sm font-semibold uppercase tracking-widest text-stone/50">
              AIRBNB WISHLIST
            </h4>
          </div>
          {!editingWishlist && (
            <div className="flex items-center gap-3">
              {accommodationWishlistUrl ? (
                <>
                  <a
                    href={accommodationWishlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-forest transition-colors hover:text-forest/80"
                  >
                    View original
                    <span aria-hidden>↗</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setEditingWishlist(true)}
                    className="text-xs text-stone/60 transition-colors hover:text-forest"
                  >
                    Edit
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingWishlist(true)}
                  className="text-xs text-forest transition-colors hover:text-forest/80"
                >
                  + Add wishlist
                </button>
              )}
            </div>
          )}
        </div>

        {editingWishlist && (
          <div className="mt-3 space-y-2">
            <input
              type="url"
              value={wishlistUrlVal}
              onChange={(e) => setWishlistUrlVal(e.target.value)}
              placeholder="Airbnb wishlist URL"
              className="w-full rounded-sm bg-transparent px-0.5 -mx-0.5 text-xs text-muted placeholder:text-stone/40 hover:bg-stone/10 focus:bg-stone/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-forest/25"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveWishlist}
                className="text-xs font-semibold text-forest transition-colors hover:text-forest/80"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleCancelWishlist}
                className="text-xs text-stone/60 transition-colors hover:text-forest"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Accommodation cards carousel */}
      {accommodations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1" />
            <div className="flex items-center gap-1.5 flex-none">
              <button
                type="button"
                onClick={() => gridRef.current?.scrollByPage(-1)}
                aria-label="Scroll accommodations left"
                disabled={!canScrollLeft}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-stone/30 text-stone/60 transition-colors hover:text-forest hover:border-forest/50 disabled:opacity-40 disabled:cursor-default"
              >
                <span className="text-sm">‹</span>
              </button>
              <button
                type="button"
                onClick={() => gridRef.current?.scrollByPage(1)}
                aria-label="Scroll accommodations right"
                disabled={!canScrollRight}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-stone/30 text-stone/60 transition-colors hover:text-forest hover:border-forest/50 disabled:opacity-40 disabled:cursor-default"
              >
                <span className="text-sm">›</span>
              </button>
            </div>
          </div>

          <div
            ref={gridRef}
            className="flex min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 sm:gap-4"
          >
            {(() => {
              const unanimous = accommodations.filter((a) => isUnanimous(a.votes, voters));
              const nonUnanimous = accommodations.filter((a) => !isUnanimous(a.votes, voters));
              const ranked = [...unanimous, ...nonUnanimous];

              return ranked.map((accommodation) => (
                <div key={accommodation.id} className="min-w-0 flex-shrink-0 basis-full sm:basis-[calc(33.333%-0.667rem)] snap-start">
                  <AccommodationCard
                    accommodation={accommodation}
                    currency={currency}
                    voters={voters}
                    unanimous={isUnanimous(accommodation.votes, voters)}
                    selected={accommodation.id === selectedAccommodationId}
                    onToggleVote={(travellerId) => handleToggleVote(accommodation.id, travellerId)}
                    onSelectStay={() => handleSelectStay(accommodation.id)}
                    onEdit={handleEditAccommodation}
                    onRemove={handleRemoveAccommodation}
                  />
                </div>
              ));
            })()}

            {/* + ADD ACCOMMODATION as final carousel item */}
            <div className="min-w-0 flex-shrink-0 basis-full sm:basis-[calc(33.333%-0.667rem)] flex snap-start">
              <button
                type="button"
                onClick={handleAddAccommodation}
                className="w-full flex flex-col items-center justify-center rounded-[5px] border border-dashed border-stone/30 bg-stone/[0.02] transition-colors hover:border-forest/50 hover:bg-stone/[0.06]"
              >
                <span className="text-2xl text-stone/30 mb-1">+</span>
                <span className="text-xs font-semibold text-stone/50 uppercase tracking-wide">
                  Add accommodation
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {accommodations.length === 0 && (
        <button
          type="button"
          onClick={handleAddAccommodation}
          className="w-full py-8 rounded-[5px] border border-dashed border-stone/30 bg-stone/[0.02] transition-colors hover:border-forest/50 hover:bg-stone/[0.06]"
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-2xl text-stone/30">🏠</span>
            <span className="text-xs font-semibold text-stone/50 uppercase tracking-wide">
              + Add accommodation
            </span>
          </div>
        </button>
      )}
    </div>
  );
}
