import TravelGlobeExperience from "../../components/TravelGlobeExperience";
import { getTravelCollections } from "../../lib/content";

export const metadata = {
  title: "Travel Map"
};

export default async function TravelPage() {
  const collections = await getTravelCollections();

  return (
    <div className="page-stack">
      <section className="page-intro">
        <p className="eyebrow">Interactive View</p>
        <h1>Travel collections on a map</h1>
        <p className="lede">
          Each location pin is driven by collection metadata in the filesystem. Scan the map, pick a
          destination, and move directly into the set.
        </p>
      </section>

      <TravelGlobeExperience collections={collections} />
    </div>
  );
}
