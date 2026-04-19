"use client";
import maplibregl from "maplibre-gl";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import PhotoLightbox from "./PhotoLightbox";

const CollectionTile = memo(function CollectionTile({ location, isActive, onClick }) {
  const coverPhoto = location.coverPhoto || location.photos[0];

  return (
    <button
      className={`collection-tile ${isActive ? "active" : ""}`}
      onClick={onClick}
      type="button"
    >
      {coverPhoto && (
        <img
          alt={coverPhoto.alt}
          decoding="async"
          loading="lazy"
          src={coverPhoto.thumb || coverPhoto.src}
        />
      )}
      <span>{location.label}</span>
    </button>
  );
});

const MONOCHROME_STYLE = {
  version: 8,
  sources: {
    "carto-light": {
      type: "raster",
      tiles: ["https://basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
    },
    "carto-labels": {
      type: "raster",
      tiles: ["https://basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"],
      tileSize: 256
    }
  },
  layers: [
    { id: "base", type: "raster", source: "carto-light" },
    { id: "labels", type: "raster", source: "carto-labels" }
  ]
};

export default function TravelGlobeExperience({ locations, title }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerMapRef = useRef(new Map());
  const popupRef = useRef(null);
  const [activeSlug, setActiveSlug] = useState(locations[0]?.slug ?? null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MONOCHROME_STYLE,
      center: [0, 20],
      zoom: 1.0,
      attributionControl: true,
      interactive: false
    });

    mapRef.current = map;

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 15,
      className: "map-hover-popup"
    });
    popupRef.current = popup;

    locations.forEach((location) => {
      const element = document.createElement("button");
      element.className = "maplibre-pin";
      element.type = "button";
      element.setAttribute("aria-label", `View ${location.label}`);
      element.addEventListener("click", () => setActiveSlug(location.slug));

      element.addEventListener("mouseenter", () => {
        const coverPhoto = location.coverPhoto || location.photos[0];
        const popupContent = `
          <div class="map-popup-content">
            ${coverPhoto ? `<img src="${coverPhoto.src}" alt="${coverPhoto.alt}" />` : ""}
            <span>${location.label}</span>
          </div>
        `;
        popup.setLngLat([location.lng, location.lat]).setHTML(popupContent).addTo(map);
      });

      element.addEventListener("mouseleave", () => {
        popup.remove();
      });

      const marker = new maplibregl.Marker({ element, anchor: "center" })
        .setLngLat([location.lng, location.lat])
        .addTo(map);

      markerMapRef.current.set(location.slug, { element, marker });
    });

    map.on("load", () => {
      map.fitBounds(
        [[-170, -60], [180, 75]],
        { padding: { top: 60, right: 20, bottom: 20, left: 20 }, duration: 0 }
      );
    });

    return () => {
      popup.remove();
      markerMapRef.current.forEach(({ marker }) => marker.remove());
      markerMapRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [locations]);

  useEffect(() => {
    markerMapRef.current.forEach(({ element }, slug) => {
      element.classList.toggle("active", slug === activeSlug);
    });
  }, [activeSlug]);

  if (locations.length === 0) {
    return (
      <section className="globe-shell map-shell">
        <p className="empty-state">No travel locations configured yet.</p>
      </section>
    );
  }

  return (
    <section className="globe-shell map-shell">
      <div className="travel-map-frame full-width">
        <div className="travel-map-surface" ref={mapContainerRef} />
        {title && <h1 className="travel-map-title">{title}</h1>}
      </div>

      <div className="collection-tiles">
        {locations.map((location) => (
          <CollectionTile
            isActive={location.slug === activeSlug}
            key={location.slug}
            location={location}
            onClick={() => setActiveSlug(location.slug)}
          />
        ))}
      </div>

      {locations.map((location) => (
        location.photos.length > 0 && (
          <div
            key={location.slug}
            style={{ display: location.slug === activeSlug ? "block" : "none" }}
          >
            <PhotoLightbox photos={location.photos} />
          </div>
        )
      ))}
    </section>
  );
}
