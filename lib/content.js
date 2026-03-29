import { cache } from "react";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "content");
const COLLECTIONS_DIR = path.join(CONTENT_DIR, "collections");
const SITE_FILE = path.join(CONTENT_DIR, "site.json");

const CATEGORY_LABELS = {
  people: { name: "People", shortLabel: "Portraits" },
  travel: { name: "Travel", shortLabel: "Destinations" },
  sports: { name: "Sports", shortLabel: "Action" }
};

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function toPublicFilePath(src) {
  return path.join(process.cwd(), "public", src.replace(/^\//, ""));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getPhotoDateRange(photos) {
  const dates = photos.map((photo) => photo.date).filter(Boolean);

  if (!dates.length) {
    return "Undated";
  }

  if (dates.length === 1) {
    return dates[0];
  }

  return `${dates[0]} - ${dates[dates.length - 1]}`;
}

function enrichCollection(collection) {
  const label = CATEGORY_LABELS[collection.category];
  const coverPhoto = collection.photos.find((photo) => photo.id === collection.coverPhotoId);

  assert(coverPhoto, `Collection "${collection.slug}" is missing a valid coverPhotoId.`);

  collection.photos.forEach((photo) => {
    assert(photo.id, `Collection "${collection.slug}" has a photo without an id.`);
    assert(photo.src, `Collection "${collection.slug}" photo "${photo.id}" is missing src.`);
    assert(photo.alt, `Collection "${collection.slug}" photo "${photo.id}" is missing alt text.`);
    assert(
      existsSync(toPublicFilePath(photo.src)),
      `Collection "${collection.slug}" references missing file "${photo.src}".`
    );
  });

  if (collection.location) {
    assert(
      Number.isFinite(collection.location.latitude) &&
        Number.isFinite(collection.location.longitude),
      `Collection "${collection.slug}" has invalid location coordinates.`
    );
  }

  return {
    ...collection,
    categoryLabel: label.name,
    categoryShortLabel: label.shortLabel,
    coverPhoto,
    photoDateRange: getPhotoDateRange(collection.photos)
  };
}

function validateAndLoadCollections() {
  const collectionFiles = readdirSync(COLLECTIONS_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort();

  const collections = collectionFiles.map((file) => readJson(path.join(COLLECTIONS_DIR, file)));
  const slugSet = new Set();

  collections.forEach((collection) => {
    assert(collection.slug, "Every collection must include a slug.");
    assert(!slugSet.has(collection.slug), `Duplicate collection slug "${collection.slug}".`);
    slugSet.add(collection.slug);
    assert(collection.title, `Collection "${collection.slug}" must include a title.`);
    assert(
      Object.hasOwn(CATEGORY_LABELS, collection.category),
      `Collection "${collection.slug}" uses invalid category "${collection.category}".`
    );
    assert(
      Array.isArray(collection.photos) && collection.photos.length > 0,
      `Collection "${collection.slug}" must contain at least one photo.`
    );

    const photoIds = new Set();
    collection.photos.forEach((photo) => {
      assert(
        !photoIds.has(photo.id),
        `Collection "${collection.slug}" contains duplicate photo id "${photo.id}".`
      );
      photoIds.add(photo.id);
    });
  });

  return collections.map(enrichCollection);
}

export const getSiteData = cache(async function getSiteData() {
  assert(existsSync(SITE_FILE), "Missing content/site.json.");

  const site = readJson(SITE_FILE);
  const collections = validateAndLoadCollections();

  const categories = site.categories.map((category) => ({
    ...category,
    ...CATEGORY_LABELS[category.slug]
  }));

  const collectionMap = new Map(collections.map((collection) => [collection.slug, collection]));
  const featuredCollections = site.featuredCollections.map((slug) => {
    const collection = collectionMap.get(slug);
    assert(collection, `Featured collection "${slug}" was not found.`);
    return collection;
  });

  return {
    site,
    categories,
    collections,
    featuredCollections,
    travelCollections: collections.filter((collection) => collection.category === "travel" && collection.location)
  };
});

export async function getCollectionsByCategory(category) {
  const { collections } = await getSiteData();
  return collections.filter((collection) => collection.category === category);
}

export async function getCategoryBySlug(category) {
  const { categories } = await getSiteData();
  return categories.find((entry) => entry.slug === category) ?? null;
}

export async function getCollectionBySlug(slug) {
  const { collections } = await getSiteData();
  return collections.find((collection) => collection.slug === slug) ?? null;
}

export async function getTravelCollections() {
  const { travelCollections } = await getSiteData();
  return travelCollections;
}
