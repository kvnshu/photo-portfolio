import { cache } from "react";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "content");
const SITE_FILE = path.join(CONTENT_DIR, "site.json");
const TRAVEL_LOCATIONS_FILE = path.join(CONTENT_DIR, "travel-locations.json");
const COLLECTIONS_FILE = path.join(CONTENT_DIR, "collections.json");
const PHOTOS_MANIFEST_FILE = path.join(CONTENT_DIR, "photos-manifest.json");

// Image CDN base URL - R2 dev domain for production and local
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

const CATEGORIES = ["people", "travel", "sports"];

const CATEGORY_INFO = {
  people: { name: "People" },
  travel: { name: "Travel" },
  sports: { name: "Sports" }
};

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function folderToTitle(folder) {
  return folder
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function filenameToAlt(filename) {
  return path.basename(filename, path.extname(filename))
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractDateFromFilename(filename) {
  const match = filename.match(/(\d{8})/);
  if (match) {
    const dateStr = match[1];
    const year = parseInt(dateStr.slice(0, 4), 10);
    const month = parseInt(dateStr.slice(4, 6), 10) - 1;
    const day = parseInt(dateStr.slice(6, 8), 10);
    return new Date(year, month, day);
  }
  return null;
}

// Load photos manifest from JSON (generated from R2 via rclone)
function getPhotosManifest() {
  if (!existsSync(PHOTOS_MANIFEST_FILE)) return [];
  return readJson(PHOTOS_MANIFEST_FILE);
}

// Get photos for a specific folder path from manifest
function getPhotosInFolder(folderPath) {
  const manifest = getPhotosManifest();
  // folderPath is like "people/portraits" or "travel/alaska"
  const prefix = folderPath + "/";

  const photos = manifest
    .filter(item => item.Path.startsWith(prefix) && !item.Path.slice(prefix.length).includes("/"))
    .map(item => {
      const dateFromFilename = extractDateFromFilename(item.Name);
      const modTime = new Date(item.ModTime);

      return {
        src: `${IMAGE_BASE_URL}/photos/${item.Path}`,
        alt: filenameToAlt(item.Name),
        date: dateFromFilename || modTime
      };
    });

  // Sort by date, newest first
  return photos.sort((a, b) => b.date - a.date);
}

// Get all unique collection folders for a category
function getCollectionFolders(category) {
  const manifest = getPhotosManifest();
  const prefix = category + "/";
  const folders = new Set();

  for (const item of manifest) {
    if (item.Path.startsWith(prefix)) {
      const relativePath = item.Path.slice(prefix.length);
      const folderName = relativePath.split("/")[0];
      if (folderName && relativePath.includes("/")) {
        folders.add(folderName);
      }
    }
  }

  return Array.from(folders);
}

function getCollectionsConfig() {
  if (!existsSync(COLLECTIONS_FILE)) return {};
  return readJson(COLLECTIONS_FILE);
}

function getCollectionsForCategory(category) {
  const collectionFolders = getCollectionFolders(category);
  if (collectionFolders.length === 0) return [];

  const collectionsConfig = getCollectionsConfig();
  const categoryConfig = collectionsConfig[category] || {};

  const collections = [];

  for (const folderName of collectionFolders) {
    const photos = getPhotosInFolder(`${category}/${folderName}`);

    if (photos.length > 0) {
      const newestDate = photos[0].date;

      const collectionConfig = categoryConfig[folderName] || {};
      const customCover = collectionConfig.coverPhoto;
      const coverPhoto = customCover
        ? photos.find(p => p.src.endsWith(customCover)) || photos[0]
        : photos[0];

      collections.push({
        slug: folderName,
        title: folderToTitle(folderName),
        photos,
        coverPhoto,
        date: newestDate
      });
    }
  }

  return collections.sort((a, b) => a.slug.localeCompare(b.slug));
}

function getTravelLocationsWithPhotos() {
  if (!existsSync(TRAVEL_LOCATIONS_FILE)) return [];

  const locations = readJson(TRAVEL_LOCATIONS_FILE);

  const results = Object.entries(locations).map(([folder, data]) => {
    const photos = getPhotosInFolder(`travel/${folder}`);

    if (photos.length === 0) return null;

    const customCover = data.coverPhoto;
    const coverPhoto = customCover
      ? photos.find(p => p.src.endsWith(customCover)) || photos[0]
      : photos[0];

    return {
      slug: folder,
      label: data.label,
      lat: data.lat,
      lng: data.lng,
      photos,
      coverPhoto,
      date: photos[0].date
    };
  }).filter(Boolean);

  return results.sort((a, b) => b.date - a.date);
}

export const getSiteData = cache(async function getSiteData() {
  const site = readJson(SITE_FILE);

  const categories = CATEGORIES.map((slug) => {
    const siteCategory = site.categories?.find((c) => c.slug === slug) || {};
    const coverPhoto = siteCategory.coverPhoto
      ? `${IMAGE_BASE_URL}${siteCategory.coverPhoto}`
      : undefined;
    return {
      slug,
      ...CATEGORY_INFO[slug],
      coverPhoto
    };
  });

  return { site, categories };
});

export async function getCollectionsForCategoryPage(category) {
  if (!CATEGORIES.includes(category)) return null;
  return getCollectionsForCategory(category);
}

export async function getCategoryBySlug(category) {
  const { categories } = await getSiteData();
  return categories.find((c) => c.slug === category) ?? null;
}

export async function getTravelLocations() {
  return getTravelLocationsWithPhotos();
}

export async function getCoverPhotoForCategory(category) {
  const collections = getCollectionsForCategory(category);
  return collections[0]?.photos[0] || null;
}
