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
import { isUuid, activityCostColumn, newActivityId, nextActivitySortOrder } from "@/lib/tripData";
import { isSignedStorageUrl, SIGNED_URL_REFRESH_MS } from "@/lib/imageStorage";

// List-level client state for the itinerary's stops. Initialised from JSON
// (each stop keeps its stable JSON `id`; new stops get a temporary id). No
// persistence — a refresh restores the original stops. JSON is never mutated.
//
// Reordering (drag or keyboard) only changes the ORDER of the stops array;
// stable ids stay the React keys, so stop components are never remounted and
// all temporary state inside them is preserved.
//
// A stop's `date`, `journey`, `activities`, `loc` (name), `desc` and
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

// Stop text fields persisted to public.stops: state key -> [column, value conversion].
const STOP_FIELD_COLUMNS = {
  loc: ["loc", (v) => v ?? ""],
  desc: ["description", (v) => v ?? ""],
  date: ["date", (v) => v || null],
  accommodationWishlistUrl: ["accommodation_wishlist_url", (v) => (v ? v : null)],
};

// Activity text fields persisted to public.activities: state key -> [column,
// value conversion]. (Images stay local until the Storage migration.)
const ACTIVITY_FIELD_COLUMNS = {
  name: ["name", (v) => v ?? ""],
  link: ["link", (v) => (v && v.trim() ? v : null)],
  cost: ["cost", activityCostColumn],
  travelTime: ["travel_time", (v) => (v && v.trim() ? v : null)],
};

export default function Itinerary({ itinerary, tripReturnDate, travellers, extraCosts, onExtraCostsChange, view = "itinerary", onViewChange, scrollToStopId, onScrollToStopHandled, onRefreshImageUrls, onPersistActivityVote, onPersistActivityReady, onPersistActivityFields, onPersistActivityAdd, onPersistActivityRemove, accommodationWriter, onPersistAccommodationVote, onPersistSelectedAccommodation, onPersistStopFields }) {
  const { currency } = itinerary;
  // Each stop's legacy single `transit` is migrated once, up front, into a
  // `journey` — an ordered list of transport legs and optional stopovers —
  // so no existing transport mode, description or cost is lost. Destination
  // cost (stops.cost) is deprecated and dropped here — a destination's total is
  // calculated (lib/cost.js);
  // activity votes are migrated from the legacy name-keyed true/false/null
  // shape into a binary shape keyed by stable traveller id.
  const [stops, setStops] = useState(() =>
    itinerary.days.map((d) => {
      const { transit, journey, activities, cost: _legacyStopCost, accommodations, accommodationWishlistUrl, selectedAccommodationId, ...rest } = d;
      return {
        ...rest,
        journey: journey ?? transitToJourney(transit, travellers),
        activities: activities.map(({ voteMap, ...a }) => ({
          ...a,
          cost: a.cost ? String(a.cost) : "",
          readyToBook: Boolean(a.readyToBook),
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
  // Signed image URLs expire (an hour), so re-sign the Storage-backed images
  // shortly before that, while the tab is visible, and when the tab comes back
  // after being away long enough. Only the display URL is swapped, and only on
  // values that are still a signed URL (a local replacement image is left
  // alone). A failed refresh keeps the current URLs; nothing happens when no
  // image is Storage-backed.
  useEffect(() => {
    if (!onRefreshImageUrls) return undefined;
    let lastSigned = Date.now();
    let busy = false;
    const refresh = async () => {
      if (busy) return;
      const paths = new Set();
      for (const s of stopsRef.current) {
        if (s.photoPath) paths.add(s.photoPath);
        s.activities.forEach((a) => a.imagePath && paths.add(a.imagePath));
        s.accommodations.forEach((a) => a.imagePath && paths.add(a.imagePath));
      }
      if (paths.size === 0) return;
      busy = true;
      try {
        const urls = await onRefreshImageUrls([...paths]);
        if (urls.size === 0) return;
        lastSigned = Date.now();
        const next = (path, current) => (path && urls.has(path) && isSignedStorageUrl(current) ? urls.get(path) : current);
        setStops((prev) =>
          prev.map((s) => ({
            ...s,
            photo: next(s.photoPath, s.photo),
            activities: s.activities.map((a) => ({ ...a, image: next(a.imagePath, a.image) })),
            accommodations: s.accommodations.map((a) => ({ ...a, image: next(a.imagePath, a.image) })),
          }))
        );
      } finally {
        busy = false;
      }
    };
    const stale = () => Date.now() - lastSigned >= SIGNED_URL_REFRESH_MS;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible" && stale()) refresh();
    }, 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible" && stale()) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [onRefreshImageUrls]);
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
      { id, loc: "", date: "", desc: "", tag: "", photo: null, journey: [], activities: [], accommodations: [], accommodationWishlistUrl: "", selectedAccommodationId: null },
    ]);
  };

  const removeStop = (id) => setStops((prev) => prev.filter((s) => s.id !== id));

  // Stop text fields (name, description, date, wishlist URL) share one
  // optimistic path. `savedStopFields` holds
  // each field's last value known to be in the DB, so a failed write rolls
  // back to that — but only if the field hasn't been edited again since.
  const savedStopFields = useRef(new Map());
  const updateStopField = useCallback(
    (id, key, value) => {
      const stop = stopsRef.current.find((s) => s.id === id);
      setStops((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
      if (!onPersistStopFields || !stop || !isUuid(id)) return;

      const savedKey = `${id}:${key}`;
      if (!savedStopFields.current.has(savedKey)) savedStopFields.current.set(savedKey, stop[key]);
      const [column, convert] = STOP_FIELD_COLUMNS[key];
      onPersistStopFields(id, { [column]: convert(value) }).then(
        () => savedStopFields.current.set(savedKey, value),
        (err) => {
          console.error("Stop save failed", err);
          const saved = savedStopFields.current.get(savedKey);
          setStops((prev) => prev.map((s) => (s.id === id && s[key] === value ? { ...s, [key]: saved } : s)));
          setVoteError("Couldn't save that change. Please try again.");
        }
      );
    },
    [onPersistStopFields]
  );

  const updateName = useCallback((id, loc) => updateStopField(id, "loc", loc), [updateStopField]);

  const updateDescription = useCallback((id, desc) => updateStopField(id, "desc", desc), [updateStopField]);

  const updatePhoto = useCallback(
    (id, photo) => setStops((prev) => prev.map((s) => (s.id === id ? { ...s, photo } : s))),
    []
  );

  const updateDate = useCallback((id, date) => updateStopField(id, "date", date), [updateStopField]);

  const updateJourney = useCallback(
    (id, journey) => setStops((prev) => prev.map((s) => (s.id === id ? { ...s, journey } : s))),
    []
  );

  // Name / link / cost / travel time of an EXISTING activity: optimistic, then
  // (Supabase mode, saved activities only — local-only ones have non-UUID ids)
  // persisted via the debounced field writer. `savedActivityFields` holds each
  // field's last value known to be in the DB, so a failed write rolls back to
  // that — but only if the field hasn't been edited again since.
  const savedActivityFields = useRef(new Map());
  const updateActivityField = useCallback(
    (stopId, activityId, key, value) => {
      const activity = stopsRef.current
        .find((s) => s.id === stopId)
        ?.activities.find((a) => a.id === activityId);
      const patchField = (v, onlyIf) =>
        setStops((prev) =>
          prev.map((s) =>
            s.id !== stopId
              ? s
              : {
                  ...s,
                  activities: s.activities.map((a) =>
                    a.id === activityId && (!onlyIf || a[key] === onlyIf.current) ? { ...a, [key]: v } : a
                  ),
                }
          )
        );
      patchField(value);
      if (!onPersistActivityFields || !activity || !isUuid(activityId)) return;

      const savedKey = `${activityId}:${key}`;
      if (!savedActivityFields.current.has(savedKey)) savedActivityFields.current.set(savedKey, activity[key]);
      const [column, convert] = ACTIVITY_FIELD_COLUMNS[key];
      onPersistActivityFields(activityId, { [column]: convert(value) }).then(
        () => savedActivityFields.current.set(savedKey, value),
        (err) => {
          console.error("Activity save failed", err);
          patchField(savedActivityFields.current.get(savedKey), { current: value });
          setVoteError("Couldn't save that change. Please try again.");
        }
      );
    },
    [onPersistActivityFields]
  );

  // Adding an activity. On a saved stop in Supabase mode the card gets a real
  // UUID and a sort_order after every existing one, appears at once, and the
  // row is inserted in the background (anything done to it meanwhile is queued
  // behind the INSERT). If the insert fails the card is removed again. Local
  // mode / unsaved stops keep temporary non-UUID ids and stay in memory.
  const failedActivityInserts = useRef(new Set());
  const addActivity = useCallback(
    (stopId) => {
      const stop = stopsRef.current.find((s) => s.id === stopId);
      if (!stop) return;
      const persist = Boolean(onPersistActivityAdd) && isUuid(stopId);
      seq.current += 1;
      const activity = {
        id: persist ? newActivityId() : `new-${Date.now()}-${seq.current}`,
        name: "",
        link: "",
        cost: "",
        image: null,
        travelTime: "",
        votes: {},
        readyToBook: false,
        ...(persist ? { sortOrder: nextActivitySortOrder(stop.activities) } : {}),
      };
      setStops((prev) => prev.map((s) => (s.id === stopId ? { ...s, activities: [...s.activities, activity] } : s)));
      if (!persist) return;
      onPersistActivityAdd(stopId, activity).catch((err) => {
        console.error("Activity add failed", err);
        failedActivityInserts.current.add(activity.id);
        setStops((prev) =>
          prev.map((s) => (s.id === stopId ? { ...s, activities: s.activities.filter((a) => a.id !== activity.id) } : s))
        );
        setVoteError("Couldn't save that change. Please try again.");
      });
    },
    [onPersistActivityAdd]
  );

  // Deleting an activity: optimistic (so its cost leaves every total at once);
  // saved activities are then deleted in the database (their votes cascade). If
  // that fails the card comes back in its old position with its old state.
  const removeActivity = useCallback(
    (stopId, activityId) => {
      const stop = stopsRef.current.find((s) => s.id === stopId);
      const index = stop?.activities.findIndex((a) => a.id === activityId) ?? -1;
      if (index < 0) return;
      const removed = stop.activities[index];
      setStops((prev) =>
        prev.map((s) => (s.id === stopId ? { ...s, activities: s.activities.filter((a) => a.id !== activityId) } : s))
      );
      if (!onPersistActivityRemove || !isUuid(activityId)) return;
      onPersistActivityRemove(activityId).catch((err) => {
        console.error("Activity delete failed", err);
        if (!failedActivityInserts.current.has(activityId)) {
          setStops((prev) =>
            prev.map((s) => {
              if (s.id !== stopId || s.activities.some((a) => a.id === activityId)) return s;
              const next = [...s.activities];
              next.splice(Math.min(index, next.length), 0, removed);
              return { ...s, activities: next };
            })
          );
        }
        setVoteError("Couldn't save that change. Please try again.");
      });
    },
    [onPersistActivityRemove]
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
    (id, accommodationWishlistUrl) => updateStopField(id, "accommodationWishlistUrl", accommodationWishlistUrl),
    [updateStopField]
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
      // Local-only activities (temporary non-UUID ids) never touch the DB.
      if (!onPersistActivityVote || !isUuid(activityId)) return;
      onPersistActivityVote(activityId, travellerId, next).catch(() => {
        setActivityVote(stopId, activityId, travellerId, !next);
        setVoteError("Couldn't save that vote. Please try again.");
      });
    },
    [onPersistActivityVote, setActivityVote]
  );

  const setActivityReady = useCallback(
    (stopId, activityId, ready) =>
      setStops((prev) =>
        prev.map((s) =>
          s.id !== stopId
            ? s
            : { ...s, activities: s.activities.map((a) => (a.id === activityId ? { ...a, readyToBook: ready } : a)) }
        )
      ),
    []
  );

  // Ready to book: the final decision to do an activity, independent of votes.
  // Any number per stop. Optimistic; in Supabase mode (saved activities only —
  // local-only ones have non-UUID ids) it persists activities.ready_to_book.
  // On failure the flag is put back, but only if nothing newer has changed it.
  const toggleActivityReady = useCallback(
    (stopId, activityId) => {
      const activity = stopsRef.current
        .find((s) => s.id === stopId)
        ?.activities.find((a) => a.id === activityId);
      if (!activity) return;
      const next = !activity.readyToBook;
      setActivityReady(stopId, activityId, next);
      if (!onPersistActivityReady || !isUuid(activityId)) return;
      onPersistActivityReady(activityId, next).catch((err) => {
        console.error("Activity ready-to-book save failed", err);
        setStops((prev) =>
          prev.map((s) =>
            s.id !== stopId
              ? s
              : {
                  ...s,
                  activities: s.activities.map((a) =>
                    a.id === activityId && a.readyToBook === next ? { ...a, readyToBook: !next } : a
                  ),
                }
          )
        );
        setVoteError("Couldn't save that change. Please try again.");
      });
    },
    [onPersistActivityReady, setActivityReady]
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
          onToggleActivityReady={toggleActivityReady}
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
                  onActivitiesChange={(activities) => updateActivities(stop.id, activities)}
                  onActivityAdd={() => addActivity(stop.id)}
                  onActivityRemove={(activityId) => removeActivity(stop.id, activityId)}
                  onActivityFieldChange={(activityId, key, value) => updateActivityField(stop.id, activityId, key, value)}
                  onActivityVoteToggle={(activityId, travellerId) => toggleActivityVote(stop.id, activityId, travellerId)}
                  onActivityReadyToggle={(activityId) => toggleActivityReady(stop.id, activityId)}
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
