import { getItinerary } from "@/lib/itinerary";
import TripHeader from "@/components/TripHeader";
import Itinerary from "@/components/Itinerary";

export default function Home() {
  const itinerary = getItinerary();

  return (
    <div className="flex flex-1 flex-col pb-16">
      <TripHeader itinerary={itinerary} />
      <Itinerary itinerary={itinerary} />
    </div>
  );
}
