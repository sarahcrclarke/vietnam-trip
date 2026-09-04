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
  // Top-nav section — only ITINERARY and VOTES are wired up; MAP/PHOTOS/INFO
  // stay inert. Kept here (not in Itinerary) since it also drives TripHeader.
  const [activeTab, setActiveTab] = useState("itinerary");

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
      />
    </>
  );
}
