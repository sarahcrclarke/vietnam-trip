"use client";

import { useEffect, useRef, useState } from "react";
import ActivityCard from "./ActivityCard";
import { isUnanimous } from "@/lib/voting";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

// Controlled by Itinerary's stops state (not local) because the trip cost
// summary needs every activity's live cost across every destination to
// compute its subtotal, and unanimity needs every activity's votes compared
// against the current voter list at once. No persistence — a refresh
// restores the original activities.
//
// Layout: a native CSS-grid carousel (grid-auto-flow: column) rather than a
// tall grid or a carousel library — two rows on desktop, one larger row on
// mobile, continuing sideways into a horizontally-scrollable track.
export default function ActivityGrid({ activities, onChange, currency, loc, travellers }) {
  const seq = useRef(0);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Only travellers who are both included in the trip and marked as a voter
  // get a voting pill. Recomputed from the live traveller list every render,
  // so adding/removing a voter or editing their initials/name takes effect
  // immediately, and unanimity is always judged against the current set.
  const voters = travellers.filter((t) => t.included && t.voter);

  const addActivity = () => {
    seq.current += 1;
    const id = `new-${Date.now()}-${seq.current}`;
    onChange([
      ...activities,
      { id, name: "", link: "", cost: "", image: null, travelTime: "", votes: {} },
    ]);
  };

  const removeActivity = (id) => onChange(activities.filter((a) => a.id !== id));

  const toggleVote = (activityId, travellerId) =>
    onChange(
      activities.map((a) =>
        a.id === activityId
          ? { ...a, votes: { ...a.votes, [travellerId]: !a.votes[travellerId] } }
          : a
      )
    );

  const updateCost = (activityId, cost) =>
    onChange(activities.map((a) => (a.id === activityId ? { ...a, cost } : a)));

  // Unanimous activities float to the top, keeping their existing relative
  // order; everyone else keeps their existing relative order too — nothing
  // beyond promoting the unanimous ones is reshuffled. Recomputed from live
  // state every render, so gaining/losing unanimity reorders automatically.
  const unanimousActivities = activities.filter((a) => isUnanimous(a.votes, voters));
  const otherActivities = activities.filter((a) => !isUnanimous(a.votes, voters));
  const displayList = [...unanimousActivities, ...otherActivities];

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    updateScrollState();
    if (!el) return undefined;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [displayList.length]);

  const scrollByPage = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className="relative" data-loc={loc}>
      <div
        ref={scrollRef}
        className="grid grid-flow-col grid-rows-1 auto-cols-[68%] gap-x-3 gap-y-4 overflow-x-auto scroll-smooth snap-x snap-proximity pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:auto-cols-[190px] sm:grid-rows-2 sm:gap-x-4 sm:gap-y-5"
      >
        {displayList.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            currency={currency}
            voters={voters}
            unanimous={isUnanimous(activity.votes, voters)}
            onToggleVote={(travellerId) => toggleVote(activity.id, travellerId)}
            onCostChange={(cost) => updateCost(activity.id, cost)}
            onRemove={removeActivity}
          />
        ))}

        <button
          type="button"
          onClick={addActivity}
          className="flex min-h-[7rem] snap-start flex-col items-center justify-center gap-1 rounded-[4px] border border-border/70 bg-transparent font-sans text-[11px] font-medium uppercase tracking-wide text-stone/45 transition-colors hover:border-forest/25 hover:bg-sage/10 hover:text-forest/70"
        >
          <span aria-hidden className="text-base leading-none">
            +
          </span>
          Add activity
        </button>
      </div>

      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          aria-label="Scroll activities left"
          className="absolute -left-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 p-1.5 text-stone/60 shadow-sm backdrop-blur-sm transition-colors hover:text-forest sm:flex"
        >
          <ChevronLeftIcon />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByPage(1)}
          aria-label="Scroll activities right"
          className="absolute -right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 p-1.5 text-stone/60 shadow-sm backdrop-blur-sm transition-colors hover:text-forest sm:flex"
        >
          <ChevronRightIcon />
        </button>
      )}
    </div>
  );
}
