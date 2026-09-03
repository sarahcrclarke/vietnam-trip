import { getItinerary } from "@/lib/itinerary";
import TripPlanner from "@/components/TripPlanner";

export default function Home() {
  const itinerary = getItinerary();

  return (
    <div className="flex flex-1 flex-col pb-16">
      <TripPlanner itinerary={itinerary} />
    </div>
  );
}
