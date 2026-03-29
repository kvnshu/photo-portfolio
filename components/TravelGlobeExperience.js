"use client";
import Link from "next/link";
import maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

const MONOCHROME_STYLE = {
  version: 8,
  sources: {
    "carto-light": {
      type: "raster",
      tiles: [
        "https://basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
    },
    "carto-labels": {
      type: "raster",
      tiles: [
        "https://basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
      ],
      tileSize: 256
    }
  },
  layers: [
    {
      id: "base",
      type: "raster",
      source: "carto-light"
    },
    {
      id: "labels",
      type: "raster",
      source: "carto-labels"
    }
  ]
};

export default function TravelGlobeExperience({ collections }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerMapRef = useRef(new Map());
  const hasAutoFitRef = useRef(false);
  const [activeSlug, setActiveSlug] = useState(collections[0]?.slug ?? null);

  const activeCollection =
    collections.find((collection) => collection.slug === activeSlug) ?? collections[0] ?? null;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

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

    collections.forEach((collection) => {
      const element = document.createElement("button");
      element.className = "maplibre-pin";
      element.type = "button";
      element.setAttribute("aria-label", `Open ${collection.title}`);
      element.addEventListener("click", () => setActiveSlug(collection.slug));

      const marker = new maplibregl.Marker({ element, anchor: "bottom" })
        .setLngLat([collection.location.longitude, collection.location.latitude])
        .addTo(map);

      markerMapRef.current.set(collection.slug, { element, marker });
    });

    const bounds = new maplibregl.LngLatBounds();
    collections.forEach((collection) => {
      bounds.extend([collection.location.longitude, collection.location.latitude]);
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
  }, [collections]);

  useEffect(() => {
    markerMapRef.current.forEach(({ element }, slug) => {
      element.classList.toggle("active", slug === activeSlug);
    });

    if (activeCollection && mapRef.current && hasAutoFitRef.current) {
      mapRef.current.easeTo({
        center: [activeCollection.location.longitude, activeCollection.location.latitude],
        duration: 1200,
        zoom: 2.1
      });
    }
  }, [activeCollection, activeSlug]);

  return (
    <section className="globe-shell map-shell">
      <div className="globe-layout map-layout">
        <div className="travel-map-frame">
          <div className="travel-map-surface" ref={mapContainerRef} />
        </div>

        <div>
          <div className="marker-list">
            {collections.map((collection) => (
              <button
                className={collection.slug === activeCollection?.slug ? "active" : ""}
                key={collection.slug}
                onClick={() => setActiveSlug(collection.slug)}
                type="button"
              >
                <span>{collection.location.label}</span>
                <h3>{collection.title}</h3>
                <p>{collection.description}</p>
              </button>
            ))}
          </div>

          {activeCollection ? (
            <div className="detail-panel">
              <span>Selected collection</span>
              <h2>{activeCollection.title}</h2>
              <p>{activeCollection.description}</p>
              <img alt={activeCollection.coverPhoto.alt} src={activeCollection.coverPhoto.src} />
              <p className="globe-tip">
                {activeCollection.location.label} • {activeCollection.photos.length} photos
              </p>
              <Link className="button-primary" href={`/collections/${activeCollection.slug}`}>
                Open collection
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
