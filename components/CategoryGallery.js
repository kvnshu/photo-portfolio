"use client";

import { useState } from "react";
import PhotoLightbox from "./PhotoLightbox";

export default function CategoryGallery({ collections }) {
  const [activeSlug, setActiveSlug] = useState(collections[0]?.slug ?? null);

  const activeCollection = collections.find((c) => c.slug === activeSlug) ?? collections[0];

  if (!collections.length) {
    return <p className="empty-state">No photos yet.</p>;
  }

  return (
    <>
      <nav className="collection-tabs">
        {collections.map((collection) => (
          <button
            key={collection.slug}
            className={collection.slug === activeSlug ? "active" : ""}
            onClick={() => setActiveSlug(collection.slug)}
            type="button"
          >
            {collection.title}
          </button>
        ))}
      </nav>

      {activeCollection && <PhotoLightbox photos={activeCollection.photos} />}
    </>
  );
}
