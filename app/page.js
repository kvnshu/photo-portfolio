import Link from "next/link";
import Image from "next/image";
import { getSiteData } from "../lib/content";

export default async function HomePage() {
  const { site, categories } = await getSiteData();

  const heroCards = categories
    .filter((category) => category.coverPhoto)
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      src: category.coverPhoto
    }));

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-intro">
          <h1>{site.heroTitle}</h1>
          <p className="lede">{site.introShort[0]}</p>
        </div>

        <div className="hero-cover-grid">
          {heroCards.map((card) => (
            <Link
              className="hero-cover-card"
              href={card.slug === "travel" ? "/travel" : `/category/${card.slug}`}
              key={card.slug}
            >
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <Image
                  alt={card.name}
                  src={card.src}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  style={{ objectFit: 'cover' }}
                  quality={85}
                  priority
                />
              </div>
              <div className="hero-cover-overlay">
                <strong>{card.name}</strong>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
