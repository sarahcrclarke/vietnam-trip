"use client";

import { useEffect, useRef, useState } from "react";
import TripPlanner from "./TripPlanner";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  buildItineraryFromRows,
  buildTravellersFromRows,
  checkMembership,
  createActivityVoteWriter,
  createActivityReadyWriter,
  createActivityFieldWriter,
  createAccommodationWriter,
  createSelectedAccommodationWriter,
  createStopFieldWriter,
  createAccommodationVoteWriter,
  fetchTripRows,
  joinTrip,
} from "@/lib/tripData";

function Centered({ children }) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      {children}
    </div>
  );
}

// Session -> membership -> read, in front of the existing app. READ + ACCESS
// only: no trip content is written back to Supabase from here.
//
// When the Supabase env vars aren't configured (e.g. a build without them),
// the app falls back to its bundled local data exactly as before.
export default function TripGate({ localItinerary }) {
  const [status, setStatus] = useState(isSupabaseConfigured ? "loading" : "local");
  const [trip, setTrip] = useState(null);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [codeError, setCodeError] = useState(null);
  const started = useRef(false);

  const loadTrip = async (supabase) => {
    const rows = await fetchTripRows(supabase);
    const accommodationWriter = createAccommodationWriter(supabase);
    const writeAccommodationVote = createAccommodationVoteWriter(supabase);
    const writeSelectedAccommodation = createSelectedAccommodationWriter(supabase);
    setTrip({
      itinerary: buildItineraryFromRows(rows, localItinerary),
      travellers: buildTravellersFromRows(rows),
      persistActivityVote: createActivityVoteWriter(supabase),
      persistActivityReady: createActivityReadyWriter(supabase),
      persistActivityFields: createActivityFieldWriter(supabase),
      accommodationWriter,
      // A vote waits for its card's own add/edit to finish so the row exists.
      persistAccommodationVote: (accommodationId, travellerId, selected) =>
        accommodationWriter
          .ready(accommodationId)
          .then(() => writeAccommodationVote(accommodationId, travellerId, selected)),
      // Selecting a stay waits for that card's own add/edit to finish so the
      // row exists before stops.selected_accommodation_id points at it.
      persistStopFields: createStopFieldWriter(supabase),
      persistSelectedAccommodation: (stopId, accommodationId) =>
        (accommodationId ? accommodationWriter.ready(accommodationId) : Promise.resolve()).then(() =>
          writeSelectedAccommodation(stopId, accommodationId)
        ),
    });
    setStatus("ready");
  };

  useEffect(() => {
    if (!isSupabaseConfigured || started.current) return;
    started.current = true;
    (async () => {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          const { error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
        }
        if (await checkMembership(supabase)) await loadTrip(supabase);
        else setStatus("gate");
      } catch {
        setStatus("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || joining) return;
    setJoining(true);
    setCodeError(null);
    try {
      const supabase = getSupabase();
      const result = await joinTrip(supabase, code.trim());
      if (!result.ok) {
        setCodeError(
          result.invalid ? "That code doesn't look right." : "Couldn't check that code. Please try again."
        );
        return;
      }
      setStatus("loading");
      await loadTrip(supabase);
    } catch {
      setStatus("error");
    } finally {
      setJoining(false);
    }
  };

  if (status === "local") return <TripPlanner itinerary={localItinerary} />;

  if (status === "ready" && trip) {
    return (
      <TripPlanner
        itinerary={trip.itinerary}
        initialTravellers={trip.travellers}
        onPersistActivityVote={trip.persistActivityVote}
        onPersistActivityReady={trip.persistActivityReady}
        onPersistActivityFields={trip.persistActivityFields}
        accommodationWriter={trip.accommodationWriter}
        onPersistAccommodationVote={trip.persistAccommodationVote}
        onPersistSelectedAccommodation={trip.persistSelectedAccommodation}
        onPersistStopFields={trip.persistStopFields}
      />
    );
  }

  if (status === "gate") {
    return (
      <Centered>
        <span className="font-display text-sm font-bold tracking-wide text-forest">VIETNAM</span>
        <form onSubmit={onSubmit} className="mt-8 w-full">
          <label className="block font-sans text-sm text-muted" htmlFor="trip-code">
            Enter your trip code
          </label>
          <input
            id="trip-code"
            type="password"
            autoComplete="off"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-3 w-full rounded-[4px] border border-border bg-transparent px-3 py-2 text-center font-sans text-base text-forest focus:border-forest/50 focus:outline-none"
          />
          {codeError && (
            <p role="alert" className="mt-2 font-sans text-xs text-rust">
              {codeError}
            </p>
          )}
          <button
            type="submit"
            disabled={joining || !code.trim()}
            className="mt-5 font-sans text-xs font-semibold uppercase tracking-widest text-forest transition-colors hover:text-forest/70 disabled:opacity-40"
          >
            {joining ? "Checking…" : "Enter trip"}
          </button>
        </form>
      </Centered>
    );
  }

  if (status === "error") {
    return (
      <Centered>
        <span className="font-display text-sm font-bold tracking-wide text-forest">VIETNAM</span>
        <p className="mt-6 font-sans text-sm text-muted">We couldn&rsquo;t load the trip right now.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 font-sans text-xs font-semibold uppercase tracking-widest text-forest hover:text-forest/70"
        >
          Try again
        </button>
      </Centered>
    );
  }

  return (
    <Centered>
      <span className="font-display text-sm font-bold tracking-wide text-forest">VIETNAM</span>
      <p className="mt-4 font-sans text-xs uppercase tracking-widest text-stone/50">Loading…</p>
    </Centered>
  );
}
