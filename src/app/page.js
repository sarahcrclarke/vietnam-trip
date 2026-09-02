import { getItinerary } from "@/lib/itinerary";
import TripHeader from "@/components/TripHeader";
import StopPanel from "@/components/StopPanel";

export default function Home() {
  const itinerary = getItinerary();
  const firstStop = itinerary.days[0];

  return (
    <div className="flex flex-1 flex-col pb-16">
      <TripHeader itinerary={itinerary} />
      <StopPanel day={firstStop} index={0} currency={itinerary.currency} />
    </div>
  );
}
