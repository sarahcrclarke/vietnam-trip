import { getItinerary } from "@/lib/itinerary";
import TripGate from "@/components/TripGate";

export default function Home() {
  const itinerary = getItinerary();

  return (
    <div className="flex flex-1 flex-col pb-16">
      <TripGate localItinerary={itinerary} />
    </div>
  );
}
