"use client";

import { useState } from "react";
import TripHeader from "./TripHeader";
import Itinerary from "./Itinerary";
import { INITIAL_TRAVELLERS } from "@/lib/travellers";

// Owns the trip-level dates and the traveller list. The return date is
// threaded down into Itinerary because the final destination's derived
// duration is calculated against it. Travellers live here (not inside the
// header) and are passed down into Itinerary too, so activity voting reads
// the same shared list rather than an independent copy — transport
// traveller assignment and cost-per-person will do the same in later passes.
// Client-side only; no persistence, so a refresh restores the JSON/seed
// values.
export default function TripPlanner({ itinerary }) {
  const [depart, setDepart] = useState(itinerary.depart ?? "");
  const [returnDate, setReturnDate] = useState(itinerary.return ?? "");
  const [travellers, setTravellers] = useState(INITIAL_TRAVELLERS);

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
      />
      <Itinerary itinerary={itinerary} tripReturnDate={returnDate} travellers={travellers} />
    </>
  );
}
