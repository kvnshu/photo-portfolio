"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function PhotoLightbox({ photos }) {
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    function onKeyDown(event) {
      if (activeIndex === null) return;

      if (event.key === "Escape") {
        setActiveIndex(null);
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) => (current + 1) % photos.length);
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => (current - 1 + photos.length) % photos.length);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, photos.length]);

  const activePhoto = activeIndex === null ? null : photos[activeIndex];

  return (
    <>
      <section className="photo-strip">
        <div className="photo-grid minimal-photo-grid">
          {photos.map((photo, index) => (
            <button
              className="photo-card"
              key={photo.src}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <Image
                  alt={photo.alt}
                  src={photo.src}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                  quality={85}
                />
              </div>
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
              <span>{activeIndex + 1} / {photos.length}</span>
              <button className="close-button" onClick={() => setActiveIndex(null)} type="button">
                <span aria-hidden="true">×</span>
                <span className="sr-only">Close</span>
              </button>
            </div>

            <figure className="modal-figure" style={{ position: 'relative', width: '100%', height: '100%' }}>
              <Image
                alt={activePhoto.alt}
                src={activePhoto.src}
                fill
                sizes="100vw"
                style={{ objectFit: 'contain' }}
                quality={90}
                priority
              />
            </figure>

            <div className="modal-copy">
              <div className="modal-actions">
                <button
                  className="modal-button"
                  onClick={() => setActiveIndex((current) => (current - 1 + photos.length) % photos.length)}
                  type="button"
                >
                  Previous
                </button>
                <button
                  className="modal-button"
                  onClick={() => setActiveIndex((current) => (current + 1) % photos.length)}
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
