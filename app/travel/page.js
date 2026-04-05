import TravelGlobeExperience from "../../components/TravelGlobeExperience";
import { getTravelLocations } from "../../lib/content";

export const metadata = {
  title: "Travel Map"
};

export default async function TravelPage() {
  const locations = await getTravelLocations();

  return (
    <div className="page-stack">
      <section className="page-intro">
        <p className="eyebrow">Interactive View</p>
        <h1>Travel</h1>
        {/* <p className="lede">
          Explore travel photos by location. Add folders to public/photos/travel/ and configure
          coordinates in content/travel-locations.json.
        </p> */}
      </section>

      <TravelGlobeExperience locations={locations} />
    </div>
  );
}
