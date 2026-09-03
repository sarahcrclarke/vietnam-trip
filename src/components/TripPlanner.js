"use client";

import { useState } from "react";
import TripHeader from "./TripHeader";
import Itinerary from "./Itinerary";

// Extracts the leading number from the JSON's traveller string (e.g.
// "5 people") so it can be edited as a plain numeric value; defaults to 1.
function parseTravelerCount(raw) {
  const match = String(raw ?? "").match(/\d+/);
  const n = match ? parseInt(match[0], 10) : NaN;
  return Number.isNaN(n) || n < 1 ? 1 : n;
}

// Owns the trip-level dates and traveller count. The return date is threaded
// down into Itinerary because the final destination's derived duration is
// calculated against it — everything else here is local to the header.
// Client-side only; no persistence, so a refresh restores the JSON values.
export default function TripPlanner({ itinerary }) {
  const [depart, setDepart] = useState(itinerary.depart ?? "");
  const [returnDate, setReturnDate] = useState(itinerary.return ?? "");
  const [travelers, setTravelers] = useState(() => parseTravelerCount(itinerary.travelers));

  return (
    <>
      <TripHeader
        subtitle={itinerary.subtitle}
        depart={depart}
        onDepartChange={setDepart}
        returnDate={returnDate}
        onReturnChange={setReturnDate}
        travelers={travelers}
        onTravelersChange={setTravelers}
      />
      <Itinerary itinerary={itinerary} tripReturnDate={returnDate} />
    </>
  );
}
