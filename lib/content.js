import { cache } from "react";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "content");
const PHOTOS_DIR = path.join(process.cwd(), "public", "photos");
const SITE_FILE = path.join(CONTENT_DIR, "site.json");
const TRAVEL_LOCATIONS_FILE = path.join(CONTENT_DIR, "travel-locations.json");

const CATEGORIES = ["people", "travel", "sports"];

const CATEGORY_INFO = {
  people: { name: "People" },
  travel: { name: "Travel" },
  sports: { name: "Sports" }
};

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
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

function scanPhotosInFolder(folderPath, urlPrefix) {
  if (!existsSync(folderPath)) return [];

  const entries = readdirSync(folderPath, { withFileTypes: true });
  const photos = [];

  for (const entry of entries) {
    if (entry.isFile() && isImageFile(entry.name)) {
      const fullPath = path.join(folderPath, entry.name);
      const stats = statSync(fullPath);

      photos.push({
        src: `${urlPrefix}/${entry.name}`,
        alt: filenameToAlt(entry.name),
        date: stats.mtime
      });
    }
  }

  // Sort by date, newest first
  return photos.sort((a, b) => b.date - a.date);
}

function getCollectionsForCategory(category) {
  const categoryDir = path.join(PHOTOS_DIR, category);
  if (!existsSync(categoryDir)) return [];

  const entries = readdirSync(categoryDir, { withFileTypes: true });
  const collections = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const folderPath = path.join(categoryDir, entry.name);
      const photos = scanPhotosInFolder(folderPath, `/photos/${category}/${entry.name}`);

      if (photos.length > 0) {
        // Use the newest photo date as the collection date
        const newestDate = photos[0].date;

        collections.push({
          slug: entry.name,
          title: folderToTitle(entry.name),
          photos,
          date: newestDate
        });
      }
    }
  }

  // Sort collections alphabetically
  return collections.sort((a, b) => a.slug.localeCompare(b.slug));
}

function getTravelLocationsWithPhotos() {
  if (!existsSync(TRAVEL_LOCATIONS_FILE)) return [];

  const locations = readJson(TRAVEL_LOCATIONS_FILE);
  const travelDir = path.join(PHOTOS_DIR, "travel");

  const results = Object.entries(locations).map(([folder, data]) => {
    const folderPath = path.join(travelDir, folder);
    const photos = scanPhotosInFolder(folderPath, `/photos/travel/${folder}`);

    if (photos.length === 0) return null;

    return {
      slug: folder,
      label: data.label,
      lat: data.lat,
      lng: data.lng,
      photos,
      coverPhoto: photos[0],
      date: photos[0].date
    };
  }).filter(Boolean);

  return results.sort((a, b) => b.date - a.date);
}

export const getSiteData = cache(async function getSiteData() {
  const site = readJson(SITE_FILE);

  const categories = CATEGORIES.map((slug) => {
    const siteCategory = site.categories?.find((c) => c.slug === slug) || {};
    return {
      slug,
      ...CATEGORY_INFO[slug],
      coverPhoto: siteCategory.coverPhoto
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
