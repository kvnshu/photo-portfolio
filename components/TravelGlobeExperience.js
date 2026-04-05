"use client";
import maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import PhotoLightbox from "./PhotoLightbox";

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

export default function TravelGlobeExperience({ locations }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerMapRef = useRef(new Map());
  const hasAutoFitRef = useRef(false);
  const [activeSlug, setActiveSlug] = useState(locations[0]?.slug ?? null);

  const activeLocation = locations.find((loc) => loc.slug === activeSlug) ?? locations[0] ?? null;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MONOCHROME_STYLE,
      center: [20, 24],
      zoom: 1.15,
      attributionControl: true,
      dragRotate: false,
      pitchWithRotate: false
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.scrollZoom.enable();
    map.touchZoomRotate.disableRotation();
    map.dragRotate.disable();

    locations.forEach((location) => {
      const element = document.createElement("button");
      element.className = "maplibre-pin";
      element.type = "button";
      element.setAttribute("aria-label", `Open ${location.label}`);
      element.addEventListener("click", () => setActiveSlug(location.slug));

      const marker = new maplibregl.Marker({ element, anchor: "bottom" })
        .setLngLat([location.lng, location.lat])
        .addTo(map);

      markerMapRef.current.set(location.slug, { element, marker });
    });

    const bounds = new maplibregl.LngLatBounds();
    locations.forEach((location) => {
      bounds.extend([location.lng, location.lat]);
    });

    map.on("load", () => {
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: { top: 56, right: 56, bottom: 56, left: 56 },
          maxZoom: 2.25,
          duration: 0
        });
        hasAutoFitRef.current = true;
      }
    });

    return () => {
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

    if (activeLocation && mapRef.current && hasAutoFitRef.current) {
      mapRef.current.easeTo({
        center: [activeLocation.lng, activeLocation.lat],
        duration: 1200,
        zoom: 2.1
      });
    }
  }, [activeLocation, activeSlug]);

  if (locations.length === 0) {
    return (
      <section className="globe-shell map-shell">
        <p className="empty-state">No travel locations configured yet.</p>
      </section>
    );
  }

  return (
    <section className="globe-shell map-shell">
      <div className="globe-layout map-layout">
        <div className="travel-map-frame">
          <div className="travel-map-surface" ref={mapContainerRef} />
        </div>

        <div>
          <div className="marker-list">
            {locations.map((location) => (
              <button
                className={location.slug === activeLocation?.slug ? "active" : ""}
                key={location.slug}
                onClick={() => setActiveSlug(location.slug)}
                type="button"
              >
                <span>{location.label}</span>
                <p>{location.photos.length} photos</p>
              </button>
            ))}
          </div>

          {activeLocation ? (
            <div className="detail-panel">
              <span>Selected</span>
              <h2>{activeLocation.label}</h2>
              {activeLocation.coverPhoto && (
                <img alt={activeLocation.coverPhoto.alt} src={activeLocation.coverPhoto.src} />
              )}
              <p className="globe-tip">{activeLocation.photos.length} photos</p>
            </div>
          ) : null}
        </div>
      </div>

      {activeLocation && activeLocation.photos.length > 0 && (
        <PhotoLightbox photos={activeLocation.photos} />
      )}
    </section>
  );
}
