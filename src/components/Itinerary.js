"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Journey, { transitToJourney } from "./Journey";
import StopPanel from "./StopPanel";
import CostSummary from "./CostSummary";
import VotesPanel from "./VotesPanel";
import MapPanel from "./MapPanel";
import { daysBetween, formatDuration } from "@/lib/duration";
import { migrateVotes } from "@/lib/voting";
import { migrateAccommodation } from "@/lib/accommodation";
import { accommodationNights } from "@/lib/accommodation";
import { isUuid } from "@/lib/tripData";

// List-level client state for the itinerary's stops. Initialised from JSON
// (each stop keeps its stable JSON `id`; new stops get a temporary id). No
// persistence — a refresh restores the original stops. JSON is never mutated.
//
// Reordering (drag or keyboard) only changes the ORDER of the stops array;
// stable ids stay the React keys, so stop components are never remounted and
// all temporary state inside them is preserved.
//
// A stop's `date`, `cost`, `journey`, `activities`, `loc` (name), `desc` and
// `photo` are all controlled here (not owned locally by their editors) so
// this is the one shared source of truth every view (MAP, VOTES, Cost
// Summary) reads from — a destination's duration is derived from its own
// date through the NEXT stop's date; the trip cost summary needs every
// destination's cost, every transport leg's cost across every journey, and
// every activity's cost, all live, all in one place; and MAP/VOTES need a
// stop's/activity's current name, description and photo to reflect an edit
// immediately, without a tab switch losing it. `tag` stays derived-only
// (never independently editable — see DestinationTag). Activity `name`,
// `link`, `travelTime` and `image` are controlled by ActivityGrid for the
// same reason; accommodation fields are controlled by AccommodationSection.
// Accommodation fields written to public.accommodations (image is not — it
// stays a local fallback until the Storage migration).
const ACCOMMODATION_SAVED_FIELDS = ["name", "type", "location", "pricePerNight", "totalPrice", "rating", "reviewCount", "link"];

export default function Itinerary({ itinerary, tripReturnDate, travellers, extraCosts, onExtraCostsChange, view = "itinerary", onViewChange, scrollToStopId, onScrollToStopHandled, onPersistActivityVote, accommodationWriter, onPersistAccommodationVote, onPersistSelectedAccommodation }) {
  const { currency } = itinerary;
  // Each stop's legacy single `transit` is migrated once, up front, into a
  // `journey` — an ordered list of transport legs and optional stopovers —
  // so no existing transport mode, description or cost is lost. Destination
  // cost is normalised to a string (matching how the cost input holds it);
  // activity votes are migrated from the legacy name-keyed true/false/null
  // shape into a binary shape keyed by stable traveller id.
  const [stops, setStops] = useState(() =>
    itinerary.days.map((d) => {
      const { transit, journey, activities, cost, accommodations, accommodationWishlistUrl, selectedAccommodationId, ...rest } = d;
      return {
        ...rest,
        cost: cost != null ? String(cost) : "",
        journey: journey ?? transitToJourney(transit, travellers),
        activities: activities.map(({ voteMap, ...a }) => ({
          ...a,
          cost: a.cost ? String(a.cost) : "",
          votes: voteMap ?? migrateVotes(a.votes),
        })),
        accommodations: (accommodations || []).map(migrateAccommodation),
        accommodationWishlistUrl: accommodationWishlistUrl || "",
        selectedAccommodationId: selectedAccommodationId ?? null,
      };
    })
  );
  const [draggingId, setDraggingId] = useState(null);
  const [voteError, setVoteError] = useState(null);
  const stopsRef = useRef(stops);
  useEffect(() => {
    stopsRef.current = stops;
  }, [stops]);
  useEffect(() => {
    if (!voteError) return undefined;
    const t = setTimeout(() => setVoteError(null), 4000);
    return () => clearTimeout(t);
  }, [voteError]);
  const voteToast = voteError ? (
    <p
      role="alert"
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-[4px] border border-border bg-background px-3 py-2 font-sans text-xs text-rust shadow-sm"
    >
      {voteError}
    </p>
  ) : null;
  const seq = useRef(0);
  const rowRefs = useRef(new Map());
  const dragIdRef = useRef(null);
  const dragAbortRef = useRef(null);

  const setRow = (id) => (el) => {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  };

  // Pointer drag (mouse + touch). Only the handle calls this. Listeners are
  // scoped to an AbortController so they all detach on release/cancel.
  const startDrag = useCallback((id, e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return; // primary only
    dragIdRef.current = id;
    setDraggingId(id);
    const ac = new AbortController();
    dragAbortRef.current = ac;

    // Live reorder: place the dragged stop among the others by pointer Y.
    const onMove = (ev) => {
      const cur = dragIdRef.current;
      if (!cur) return;
      const y = ev.clientY;
      setStops((prev) => {
        const from = prev.findIndex((s) => s.id === cur);
        if (from < 0) return prev;
        const others = prev.filter((s) => s.id !== cur);
        let insert = others.length;
        for (let i = 0; i < others.length; i++) {
          const el = rowRefs.current.get(others[i].id);
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (y < r.top + r.height / 2) { insert = i; break; }
        }
        const next = others.slice();
        next.splice(insert, 0, prev[from]);
        for (let i = 0; i < next.length; i++) if (next[i].id !== prev[i].id) return next;
        return prev; // order unchanged → no re-render
      });
    };
    const onEnd = () => {
      dragIdRef.current = null;
      setDraggingId(null);
      ac.abort();
      dragAbortRef.current = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", onMove, { signal: ac.signal });
    window.addEventListener("pointerup", onEnd, { signal: ac.signal });
    window.addEventListener("pointercancel", onEnd, { signal: ac.signal });
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  }, []);

  // Keyboard reordering from the focused handle (arrow up/down).
  const moveStop = useCallback((id, dir) => {
    setStops((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  useEffect(
    () => () => {
      dragAbortRef.current?.abort();
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    },
    []
  );

  // Deep-link from MAP's "View destination" — scrolls to the requested
  // stop's own anchor (its stable id, set by StopPanel; see its
  // scroll-margin-top for the resting offset) once the itinerary view is
  // actually on screen, then consumes the request immediately so a later,
  // ordinary switch to ITINERARY never re-triggers it.
  useEffect(() => {
    if (view !== "itinerary" || !scrollToStopId) return;
    const el = document.getElementById(`stop-${scrollToStopId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    onScrollToStopHandled?.();
  }, [view, scrollToStopId, onScrollToStopHandled]);

  const addStop = () => {
    seq.current += 1;
    const id = `new-stop-${Date.now()}-${seq.current}`;
    setStops((prev) => [
      ...prev,
      { id, loc: "", date: "", desc: "", tag: "", cost: "0", photo: null, journey: [], activities: [], accommodations: [], accommodationWishlistUrl: "", selectedAccommodationId: null },
    ]);
  };

  const removeStop = (id) => setStops((prev) => prev.filter((s) => s.id !== id));

  const updateName = useCallback(
    (id, loc) => setStops((prev) => prev.map((s) => (s.id === id ? { ...s, loc } : s))),
    []
  );

  const updateDescription = useCallback(
    (id, desc) => setStops((prev) => prev.map((s) => (s.id === id ? { ...s, desc } : s))),
    []
  );

  const updatePhoto = useCallback(
    (id, photo) => setStops((prev) => prev.map((s) => (s.id === id ? { ...s, photo } : s))),
    []
  );

  const updateDate = useCallback(
    (id, date) => setStops((prev) => prev.map((s) => (s.id === id ? { ...s, date } : s))),
    []
  );

  const updateCost = useCallback(
    (id, cost) => setStops((prev) => prev.map((s) => (s.id === id ? { ...s, cost } : s))),
    []
  );

  const updateJourney = useCallback(
    (id, journey) => setStops((prev) => prev.map((s) => (s.id === id ? { ...s, journey } : s))),
    []
  );

  const updateActivities = useCallback(
    (id, activities) => setStops((prev) => prev.map((s) => (s.id === id ? { ...s, activities } : s))),
    []
  );

  const setStopAccommodations = useCallback(
    (id, accommodations) =>
      setStops((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          const stillSelected = accommodations.some((a) => a.id === s.selectedAccommodationId);
          return {
            ...s,
            accommodations,
            selectedAccommodationId: stillSelected ? s.selectedAccommodationId : null,
          };
        })
      ),
    []
  );

  // Optimistic: apply the change to the shared state at once, then (Supabase
  // mode, saved stops only) persist whatever card was added, edited or
  // removed. Only the card's own fields count — vote toggles also pass
  // through here and must not write anything. A failed write is undone for
  // that card alone, with a brief message.
  const updateAccommodations = useCallback(
    (id, accommodations) => {
      const stop = stopsRef.current.find((s) => s.id === id);
      const before = stop?.accommodations ?? [];
      setStopAccommodations(id, accommodations);
      if (!accommodationWriter || !stop || !isUuid(stop.id)) return;

      const fail = (revert) => (err) => {
        console.error("Accommodation save failed", err);
        revert();
        setVoteError("Couldn't save that accommodation change. Please try again.");
      };
      const patchCard = (cardId, fields) =>
        setStops((prev) =>
          prev.map((s) =>
            s.id !== id
              ? s
              : { ...s, accommodations: s.accommodations.map((a) => (a.id === cardId ? { ...a, ...fields } : a)) }
          )
        );

      accommodations.forEach((card, index) => {
        const old = before.find((a) => a.id === card.id);
        if (!old) {
          accommodationWriter.insert(id, card, index).catch(
            fail(() =>
              setStops((prev) =>
                prev.map((s) =>
                  s.id !== id
                    ? s
                    : {
                        ...s,
                        accommodations: s.accommodations.filter((a) => a.id !== card.id),
                        selectedAccommodationId: s.selectedAccommodationId === card.id ? null : s.selectedAccommodationId,
                      }
                )
              )
            )
          );
        } else if (ACCOMMODATION_SAVED_FIELDS.some((k) => old[k] !== card[k])) {
          const prevFields = Object.fromEntries(ACCOMMODATION_SAVED_FIELDS.map((k) => [k, old[k]]));
          accommodationWriter.update(card).catch(fail(() => patchCard(card.id, prevFields)));
        }
      });

      before.forEach((old, index) => {
        if (accommodations.some((a) => a.id === old.id)) return;
        accommodationWriter.remove(old.id).catch(
          fail(() =>
            setStops((prev) =>
              prev.map((s) => {
                if (s.id !== id || s.accommodations.some((a) => a.id === old.id)) return s;
                const next = [...s.accommodations];
                next.splice(Math.min(index, next.length), 0, old);
                // The card was the selected stay: put the selection back too.
                const restoreSelection = stop.selectedAccommodationId === old.id && !s.selectedAccommodationId;
                return { ...s, accommodations: next, selectedAccommodationId: restoreSelection ? old.id : s.selectedAccommodationId };
              })
            )
          )
        );
      });
    },
    [accommodationWriter, setStopAccommodations]
  );

  const updateAccommodationWishlistUrl = useCallback(
    (id, accommodationWishlistUrl) => setStops((prev) => prev.map((s) => (s.id === id ? { ...s, accommodationWishlistUrl } : s))),
    []
  );

  // The ONE path for selecting / deselecting a stay (null = deselect), used by
  // both the Accommodation tab and the VOTES tab. Optimistic; in Supabase mode
  // (saved stops only) it then persists stops.selected_accommodation_id. On
  // failure the previous selection is restored — but only if nothing newer has
  // changed it since, so a slow failed write can't undo a later choice.
  const updateSelectedAccommodation = useCallback(
    (id, selectedAccommodationId) => {
      const stop = stopsRef.current.find((s) => s.id === id);
      const previous = stop?.selectedAccommodationId ?? null;
      const setSelection = (value) =>
        setStops((prev) => prev.map((s) => (s.id === id ? { ...s, selectedAccommodationId: value } : s)));
      setSelection(selectedAccommodationId);
      if (!onPersistSelectedAccommodation || !stop || !isUuid(id)) return;
      onPersistSelectedAccommodation(id, selectedAccommodationId).catch((err) => {
        console.error("Selected stay save failed", err);
        setStops((prev) =>
          prev.map((s) =>
            s.id === id && (s.selectedAccommodationId ?? null) === selectedAccommodationId
              ? { ...s, selectedAccommodationId: previous }
              : s
          )
        );
        setVoteError("Couldn't save that stay selection. Please try again.");
      });
    },
    [onPersistSelectedAccommodation]
  );

  // Vote/select actions reachable from the Votes page — same `setStops`,
  // same mutation shape as ActivityGrid.toggleVote /
  // AccommodationSection.handleToggleVote / handleSelectStay use for the
  // itinerary view, so both views always read and write the one shared
  // `stops` state. No separate voting model, no copied data.
  const setActivityVote = useCallback(
    (stopId, activityId, travellerId, selected) =>
      setStops((prev) =>
        prev.map((s) =>
          s.id !== stopId
            ? s
            : {
                ...s,
                activities: s.activities.map((a) =>
                  a.id === activityId ? { ...a, votes: { ...a.votes, [travellerId]: selected } } : a
                ),
              }
        )
      ),
    []
  );

  // Optimistic: flip the vote in the UI at once, then persist (Supabase mode
  // only). If the write fails, put the vote back and show a brief message.
  const toggleActivityVote = useCallback(
    (stopId, activityId, travellerId) => {
      const activity = stopsRef.current
        .find((s) => s.id === stopId)
        ?.activities.find((a) => a.id === activityId);
      if (!activity) return;
      const next = !activity.votes[travellerId];
      setActivityVote(stopId, activityId, travellerId, next);
      if (!onPersistActivityVote) return;
      onPersistActivityVote(activityId, travellerId, next).catch(() => {
        setActivityVote(stopId, activityId, travellerId, !next);
        setVoteError("Couldn't save that vote. Please try again.");
      });
    },
    [onPersistActivityVote, setActivityVote]
  );

  const setAccommodationVote = useCallback(
    (stopId, accommodationId, travellerId, selected) =>
      setStops((prev) =>
        prev.map((s) =>
          s.id !== stopId
            ? s
            : {
                ...s,
                accommodations: s.accommodations.map((a) =>
                  a.id === accommodationId ? { ...a, votes: { ...a.votes, [travellerId]: selected } } : a
                ),
              }
        )
      ),
    []
  );

  // Same optimistic pattern as activity votes, used by both the Accommodation
  // tab and the Votes tab. Cards on unsaved (non-UUID) stops stay local-only.
  const toggleAccommodationVote = useCallback(
    (stopId, accommodationId, travellerId) => {
      const stop = stopsRef.current.find((s) => s.id === stopId);
      const accommodation = stop?.accommodations.find((a) => a.id === accommodationId);
      if (!accommodation) return;
      const next = !accommodation.votes[travellerId];
      setAccommodationVote(stopId, accommodationId, travellerId, next);
      if (!onPersistAccommodationVote || !isUuid(stopId)) return;
      onPersistAccommodationVote(accommodationId, travellerId, next).catch(() => {
        setAccommodationVote(stopId, accommodationId, travellerId, !next);
        setVoteError("Couldn't save that vote. Please try again.");
      });
    },
    [onPersistAccommodationVote, setAccommodationVote]
  );

  const selectAccommodation = useCallback(
    (stopId, accommodationId) => {
      const stop = stopsRef.current.find((s) => s.id === stopId);
      if (!stop) return;
      updateSelectedAccommodation(stopId, stop.selectedAccommodationId === accommodationId ? null : accommodationId);
    },
    [updateSelectedAccommodation]
  );

  if (view === "votes") {
    return (
      <div className="flex flex-col">
        {voteToast}
        <VotesPanel
          stops={stops}
          travellers={travellers}
          currency={currency}
          onToggleActivityVote={toggleActivityVote}
          onToggleAccommodationVote={toggleAccommodationVote}
          onSelectAccommodation={selectAccommodation}
        />
      </div>
    );
  }

  if (view === "map") {
    return (
      <div className="flex flex-col">
        {voteToast}
        <MapPanel stops={stops} tripReturnDate={tripReturnDate} onViewChange={onViewChange} />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {voteToast}
      {stops.length === 0 ? (
        <div className="mx-auto max-w-editorial flex-1 px-4 py-16 text-center font-sans text-sm text-stone/50 sm:px-6">
          No stops yet — add one to begin.
        </div>
      ) : (
        <div className="space-y-0">
          {stops.map((stop, index) => {
            const nextDate = index + 1 < stops.length ? stops[index + 1].date : tripReturnDate;
            const stayDays = daysBetween(stop.date, nextDate);
            const duration = formatDuration(stayDays);
            return (
              <div key={stop.id} ref={setRow(stop.id)}>
                <Journey
                  journey={stop.journey}
                  onChange={(journey) => updateJourney(stop.id, journey)}
                  currency={currency}
                  isFirst={index === 0}
                  travellers={travellers}
                />
                <StopPanel
                  day={stop}
                  index={index}
                  currency={currency}
                  onRemove={removeStop}
                  onDragStart={startDrag}
                  onMoveStop={moveStop}
                  dragging={draggingId === stop.id}
                  onNameChange={(loc) => updateName(stop.id, loc)}
                  onDescriptionChange={(desc) => updateDescription(stop.id, desc)}
                  onPhotoChange={(photo) => updatePhoto(stop.id, photo)}
                  onDateChange={updateDate}
                  onCostChange={(cost) => updateCost(stop.id, cost)}
                  onActivitiesChange={(activities) => updateActivities(stop.id, activities)}
                  onActivityVoteToggle={(activityId, travellerId) => toggleActivityVote(stop.id, activityId, travellerId)}
                  onAccommodationsChange={(accommodations) => updateAccommodations(stop.id, accommodations)}
                  onAccommodationVoteToggle={(accommodationId, travellerId) => toggleAccommodationVote(stop.id, accommodationId, travellerId)}
                  onAccommodationWishlistUrlChange={(url) => updateAccommodationWishlistUrl(stop.id, url)}
                  onSelectedAccommodationChange={(selectedId) => updateSelectedAccommodation(stop.id, selectedId)}
                  duration={duration}
                  nights={accommodationNights(stayDays)}
                  travellers={travellers}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* + ADD STOP — appends to the current end of the itinerary. */}
      <div className="mx-auto w-full max-w-editorial px-4 py-8 sm:px-6">
        <div className="flex gap-6">
          <div className="relative w-12 flex-none sm:w-16">
            {stops.length > 0 && (
              <div className="absolute left-1/2 top-0 h-1/2 -translate-x-1/2 border-l border-stone/30" />
            )}
            <div className="relative z-10 mx-auto flex h-10 w-10 items-center justify-center text-sm font-bold text-stone/30 sm:h-12 sm:w-12">
              +
            </div>
          </div>
          <div className="flex items-center">
            <button
              type="button"
              onClick={addStop}
              className="font-sans text-sm text-stone/60 transition-colors hover:text-forest"
            >
              Add another destination
            </button>
          </div>
        </div>
      </div>

      {/* Trip cost summary — reads live totals straight from `stops` above,
          plus the trip-level extra costs and traveller list. */}
      <CostSummary
        stops={stops}
        extraCosts={extraCosts}
        onExtraCostsChange={onExtraCostsChange}
        travellers={travellers}
        currency={currency}
      />
    </div>
  );
}
