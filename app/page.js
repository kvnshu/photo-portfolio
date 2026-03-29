import Link from "next/link";
import { getSiteData } from "../lib/content";

export default async function HomePage() {
  const { site, categories, collections } = await getSiteData();
  const heroCards = categories
    .map((category) => {
      const coverCollection = collections.find((collection) => collection.category === category.slug);
      if (!coverCollection) {
        return null;
      }

      return {
        slug: category.slug,
        name: category.name,
        description: category.description,
        src: coverCollection.coverPhoto.src,
        alt: coverCollection.coverPhoto.alt
      };
    })
    .filter(Boolean);

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-intro">
          <p className="eyebrow">Kevin Xu</p>
          <h1>{site.heroTitle}</h1>
          <p className="lede">{site.introShort[0]}</p>
          <p className="lede">{site.introShort[1]}</p>
        </div>

        <div className="hero-cover-grid">
          {heroCards.map((card) => (
            <Link
              className="hero-cover-card"
              href={card.slug === "travel" ? "/travel" : `/category/${card.slug}`}
              key={card.slug}
            >
              <img alt={card.alt} src={card.src} />
              <div className="hero-cover-overlay">
                <span>Category</span>
                <strong>{card.name}</strong>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
