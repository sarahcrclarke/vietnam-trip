"use client";

import { useState } from "react";
import TripHeader from "./TripHeader";
import Itinerary from "./Itinerary";
import { INITIAL_TRAVELLERS } from "@/lib/travellers";

// Owns the trip-level dates, the traveller list, and the extra (non-
// destination) trip costs. The return date is threaded down into Itinerary
// because the final destination's derived duration is calculated against
// it; travellers and extra costs are threaded down too, because the trip
// cost summary rendered at the end of Itinerary reads all three straight
// from here rather than an independent copy. Client-side only; no
// persistence, so a refresh restores the JSON/seed values.
export default function TripPlanner({ itinerary }) {
  const [depart, setDepart] = useState(itinerary.depart ?? "");
  const [returnDate, setReturnDate] = useState(itinerary.return ?? "");
  const [travellers, setTravellers] = useState(INITIAL_TRAVELLERS);
  const [extraCosts, setExtraCosts] = useState(() =>
    (itinerary.extraCosts ?? []).map((e) => ({
      id: e.id,
      label: e.label ?? "",
      amount: e.cost ? String(e.cost) : "",
    }))
  );
  // Top-nav section — ITINERARY, VOTES and MAP are wired up; PHOTOS/INFO
  // stay inert. Kept here (not in Itinerary) since it also drives TripHeader.
  const [activeTab, setActiveTab] = useState("itinerary");

  // A one-time "scroll to this stop" request, set only by MAP's "View
  // destination" (which passes a stop id alongside the view change) and
  // consumed by Itinerary right after it acts on it — so switching to
  // ITINERARY normally (top nav / mobile menu) never triggers a stray
  // scroll from a previously-viewed map destination.
  const [scrollToStopId, setScrollToStopId] = useState(null);

  const handleViewChange = (nextView, stopId) => {
    if (stopId) setScrollToStopId(stopId);
    setActiveTab(nextView);
  };

  return (
    <>
      <TripHeader
        subtitle={itinerary.subtitle}
        depart={depart}
        onDepartChange={setDepart}
        returnDate={returnDate}
        onReturnChange={setReturnDate}
        travellers={travellers}
        onTravellersChange={setTravellers}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <Itinerary
        itinerary={itinerary}
        tripReturnDate={returnDate}
        travellers={travellers}
        extraCosts={extraCosts}
        onExtraCostsChange={setExtraCosts}
        view={activeTab}
        onViewChange={handleViewChange}
        scrollToStopId={scrollToStopId}
        onScrollToStopHandled={() => setScrollToStopId(null)}
      />
    </>
  );
}
