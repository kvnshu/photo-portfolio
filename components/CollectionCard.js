import Link from "next/link";

export default function CollectionCard({ collection }) {
  return (
    <Link className="collection-card minimal-card" href={`/collections/${collection.slug}`}>
      <div className="collection-card-image">
        <img alt={collection.coverPhoto.alt} src={collection.coverPhoto.src} />
      </div>

      <div className="collection-card-overlay">
        <p className="collection-card-kicker">{collection.categoryLabel}</p>
        <h3>{collection.title}</h3>
      </div>
    </Link>
  );
}
