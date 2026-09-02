import { getItinerary } from "@/lib/itinerary";
import TripHeader from "@/components/TripHeader";
import StopPanel from "@/components/StopPanel";
import TransitConnector from "@/components/TransitConnector";

export default function Home() {
  const itinerary = getItinerary();

  return (
    <div className="flex flex-1 flex-col pb-16">
      <TripHeader itinerary={itinerary} />
      {itinerary.days.map((day, index) => (
        <div key={day.id}>
          <TransitConnector transit={day.transit} currency={itinerary.currency} />
          <StopPanel day={day} index={index} currency={itinerary.currency} />
        </div>
      ))}
    </div>
  );
}
