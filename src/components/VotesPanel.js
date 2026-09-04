"use client";

import { useState } from "react";
import VoteDecisionRow from "./VoteDecisionRow";
import VoteDestinationGroup from "./VoteDestinationGroup";
import { isUnanimous } from "@/lib/voting";
import { accommodationTotalPrice } from "@/lib/accommodation";

const PICKS_INITIAL = 6;
const CONTENDERS_INITIAL = 5;

// Groups activity rows by their stop, preserving itinerary order — a
// read-only view derived fresh from `stops` every render, never stored.
function groupByStop(rows) {
  const order = [];
  const byStop = new Map();
  for (const row of rows) {
    if (!byStop.has(row.stop.id)) {
      byStop.set(row.stop.id, []);
      order.push(row.stop.id);
    }
    byStop.get(row.stop.id).push(row);
  }
  return order.map((stopId) => {
    const rowsForStop = byStop.get(stopId);
    return { stop: rowsForStop[0].stop, rows: rowsForStop };
  });
}

// The group's decision-making hub. Consumes the SAME `stops` state Itinerary
// owns and the SAME `travellers` list TripPlanner owns — no copies, no
// second voting model. Every vote/select action here calls straight back
// into Itinerary's existing `setStops`, so switching back to the itinerary
// view reflects changes immediately.
export default function VotesPanel({
  stops,
  travellers,
  currency,
  onToggleActivityVote,
  onToggleAccommodationVote,
  onSelectAccommodation,
}) {
  const [showAllPicks, setShowAllPicks] = useState(false);
  const [notYetVotedOpen, setNotYetVotedOpen] = useState(false);
  const [expandedLists, setExpandedLists] = useState(() => new Set());

  const voters = travellers.filter((t) => t.included && t.voter);

  const activityRows = stops.flatMap((stop) =>
    (stop.activities || []).map((activity) => ({ activity, stop }))
  );

  const everyonesPicks = activityRows.filter(({ activity }) =>
    isUnanimous(activity.votes || {}, voters)
  );
  const contenders = activityRows.filter(
    ({ activity }) =>
      !isUnanimous(activity.votes || {}, voters) &&
      voters.some((v) => Boolean((activity.votes || {})[v.id]))
  );
  const notYetVoted = activityRows.filter(
    ({ activity }) => !voters.some((v) => Boolean((activity.votes || {})[v.id]))
  );

  const contenderGroups = groupByStop(contenders);
  const notYetVotedGroups = groupByStop(notYetVoted);

  const stopsWithShortlist = stops.filter((s) => (s.accommodations || []).length > 0);
  const stopsWithSelection = stopsWithShortlist.filter((s) => s.selectedAccommodationId);

  const toggleFullList = (stopId) =>
    setExpandedLists((prev) => {
      const next = new Set(prev);
      if (next.has(stopId)) next.delete(stopId);
      else next.add(stopId);
      return next;
    });

  const visiblePicks = showAllPicks ? everyonesPicks : everyonesPicks.slice(0, PICKS_INITIAL);

  return (
    <div className="mx-auto w-full max-w-editorial px-4 py-10 sm:px-6 sm:py-14">
      {/* Intro */}
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold text-forest sm:text-4xl">Votes</h2>
        <p className="mt-3 font-sans text-sm text-muted sm:text-base">
          See what everyone&rsquo;s loving and where there&rsquo;s still a decision to make.
        </p>
      </div>

      {/* Summary */}
      <div className="mx-auto mt-10 max-w-2xl border-y border-border">
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-4 py-4 text-center">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-stone/50">
              Everyone&rsquo;s picks
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-forest">{everyonesPicks.length}</p>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-stone/50">
              Contenders
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-forest">{contenders.length}</p>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-stone/50">
              Accommodation
            </p>
            {stopsWithShortlist.length === 0 ? (
              <p className="mt-1 font-sans text-sm text-stone/50">Nothing shortlisted yet</p>
            ) : (
              <p className="mt-1 font-display text-2xl font-bold text-forest">
                {stopsWithSelection.length} / {stopsWithShortlist.length}
                <span className="ml-1 font-sans text-xs font-normal text-stone/50">selected</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Everyone's Picks */}
      <section className="mx-auto mt-14 max-w-2xl">
        <h3 className="flex items-center gap-1.5 font-sans text-sm font-semibold uppercase tracking-widest text-forest">
          <span aria-hidden className="text-rust">★</span>
          Everyone&rsquo;s picks
        </h3>
        {everyonesPicks.length === 0 ? (
          <p className="mt-3 font-sans text-sm text-stone/50">No unanimous picks yet.</p>
        ) : (
          <>
            <div className="mt-3 divide-y divide-border/60">
              {visiblePicks.map(({ activity, stop }) => (
                <VoteDecisionRow
                  key={activity.id}
                  image={activity.image}
                  title={activity.name}
                  subtitle={stop.loc || "Untitled destination"}
                  unanimous
                  voters={voters}
                  votes={activity.votes}
                  onToggleVote={(travellerId) => onToggleActivityVote(stop.id, activity.id, travellerId)}
                />
              ))}
            </div>
            {everyonesPicks.length > PICKS_INITIAL && (
              <button
                type="button"
                onClick={() => setShowAllPicks((v) => !v)}
                className="mt-2 font-sans text-xs text-stone/55 transition-colors hover:text-forest"
              >
                {showAllPicks ? "Show fewer" : `+ ${everyonesPicks.length - PICKS_INITIAL} more`}
              </button>
            )}
          </>
        )}
      </section>

      {/* Stays */}
      <section className="mx-auto mt-14 max-w-2xl">
        <h3 className="font-sans text-sm font-semibold uppercase tracking-widest text-forest">Stays</h3>
        {stopsWithShortlist.length === 0 ? (
          <p className="mt-3 font-sans text-sm text-stone/50">No accommodation shortlisted yet.</p>
        ) : (
          <div className="mt-3">
            {stopsWithShortlist.map((stop) => (
              <VoteDestinationGroup
                key={stop.id}
                title={stop.loc || "Untitled destination"}
                count={stop.selectedAccommodationId ? "✓ Stay selected" : "Still choosing"}
                defaultOpen
              >
                {stop.accommodations.map((acc) => {
                  const total = accommodationTotalPrice(acc);
                  return (
                    <VoteDecisionRow
                      key={acc.id}
                      kind="accommodation"
                      image={acc.image}
                      title={acc.name}
                      meta={total > 0 ? `${currency}${total} total` : null}
                      unanimous={isUnanimous(acc.votes || {}, voters)}
                      selected={stop.selectedAccommodationId === acc.id}
                      voters={voters}
                      votes={acc.votes}
                      onToggleVote={(travellerId) => onToggleAccommodationVote(stop.id, acc.id, travellerId)}
                      onSelectStay={() => onSelectAccommodation(stop.id, acc.id)}
                    />
                  );
                })}
              </VoteDestinationGroup>
            ))}
          </div>
        )}
      </section>

      {/* Contenders */}
      <section className="mx-auto mt-14 max-w-2xl">
        <h3 className="font-sans text-sm font-semibold uppercase tracking-widest text-forest">Contenders</h3>
        {contenderGroups.length === 0 ? (
          <p className="mt-3 font-sans text-sm text-stone/50">No contenders right now.</p>
        ) : (
          <div className="mt-3">
            {contenderGroups.map(({ stop, rows }, index) => {
              const fullyShown = expandedLists.has(stop.id);
              const visibleRows = fullyShown ? rows : rows.slice(0, CONTENDERS_INITIAL);
              return (
                <VoteDestinationGroup
                  key={stop.id}
                  title={stop.loc || "Untitled destination"}
                  count={rows.length}
                  defaultOpen={index === 0}
                >
                  {visibleRows.map(({ activity }) => (
                    <VoteDecisionRow
                      key={activity.id}
                      image={activity.image}
                      title={activity.name}
                      voters={voters}
                      votes={activity.votes}
                      onToggleVote={(travellerId) => onToggleActivityVote(stop.id, activity.id, travellerId)}
                    />
                  ))}
                  {rows.length > CONTENDERS_INITIAL && (
                    <button
                      type="button"
                      onClick={() => toggleFullList(stop.id)}
                      className="font-sans text-xs text-stone/55 transition-colors hover:text-forest"
                    >
                      {fullyShown ? "Show fewer" : `+ ${rows.length - CONTENDERS_INITIAL} more`}
                    </button>
                  )}
                </VoteDestinationGroup>
              );
            })}
          </div>
        )}
      </section>

      {/* Not Yet Voted — deliberately de-emphasised and collapsed by default */}
      <section className="mx-auto mt-14 max-w-2xl border-t border-border pt-6">
        <button
          type="button"
          onClick={() => setNotYetVotedOpen((v) => !v)}
          aria-expanded={notYetVotedOpen}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="font-sans text-xs font-semibold uppercase tracking-widest text-stone/50">
            Not yet voted
          </span>
          <span className="flex items-center gap-3 font-sans text-xs text-stone/50">
            {notYetVoted.length} {notYetVoted.length === 1 ? "activity" : "activities"}
            <span className="text-forest">{notYetVotedOpen ? "Hide" : "Show"}</span>
          </span>
        </button>
        {notYetVotedOpen && (
          <div className="mt-3">
            {notYetVotedGroups.length === 0 ? (
              <p className="font-sans text-sm text-stone/50">Everything has at least one vote.</p>
            ) : (
              notYetVotedGroups.map(({ stop, rows }) => (
                <VoteDestinationGroup
                  key={stop.id}
                  title={stop.loc || "Untitled destination"}
                  count={rows.length}
                >
                  {rows.map(({ activity }) => (
                    <VoteDecisionRow
                      key={activity.id}
                      image={activity.image}
                      title={activity.name}
                      voters={voters}
                      votes={activity.votes}
                      onToggleVote={(travellerId) => onToggleActivityVote(stop.id, activity.id, travellerId)}
                    />
                  ))}
                </VoteDestinationGroup>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
