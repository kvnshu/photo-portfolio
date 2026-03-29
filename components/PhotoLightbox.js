"use client";

import { useEffect, useState } from "react";

export default function PhotoLightbox({ collection }) {
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    function onKeyDown(event) {
      if (activeIndex === null) {
        return;
      }

      if (event.key === "Escape") {
        setActiveIndex(null);
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) => (current + 1) % collection.photos.length);
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => (current - 1 + collection.photos.length) % collection.photos.length);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, collection.photos.length]);

  const activePhoto = activeIndex === null ? null : collection.photos[activeIndex];

  return (
    <>
      <section className="photo-strip">
        <div className="photo-grid minimal-photo-grid">
          {collection.photos.map((photo, index) => (
            <button
              className="photo-card"
              key={photo.id}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <img alt={photo.alt} src={photo.src} />
            </button>
          ))}
        </div>
      </section>

      {activePhoto ? (
        <div
          aria-modal="true"
          className="modal-backdrop"
          onClick={() => setActiveIndex(null)}
          role="dialog"
        >
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-topbar">
              <h2>{activePhoto.title}</h2>
              <button className="close-button" onClick={() => setActiveIndex(null)} type="button">
                <span aria-hidden="true">×</span>
                <span className="sr-only">Close</span>
              </button>
            </div>

            <figure className="modal-figure">
              <img alt={activePhoto.alt} src={activePhoto.src} />
            </figure>

            <div className="modal-copy">
              <div className="modal-actions">
                <button
                  className="modal-button"
                  onClick={() =>
                    setActiveIndex((current) => (current - 1 + collection.photos.length) % collection.photos.length)
                  }
                  type="button"
                >
                  Previous
                </button>
                <button
                  className="modal-button"
                  onClick={() => setActiveIndex((current) => (current + 1) % collection.photos.length)}
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
