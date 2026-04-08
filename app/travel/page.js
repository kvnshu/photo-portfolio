import TravelGlobeExperience from "../../components/TravelGlobeExperience";
import { getTravelLocations } from "../../lib/content";

export const metadata = {
  title: "Travel Map"
};

export default async function TravelPage() {
  const locations = await getTravelLocations();

  return (
    <div className="page-stack">
      <TravelGlobeExperience locations={locations} title="Travel" />
    </div>
  );
}
