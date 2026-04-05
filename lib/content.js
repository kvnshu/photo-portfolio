import { cache } from "react";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "content");
const PHOTOS_DIR = path.join(process.cwd(), "public", "photos");
const SITE_FILE = path.join(CONTENT_DIR, "site.json");
const TRAVEL_LOCATIONS_FILE = path.join(CONTENT_DIR, "travel-locations.json");

const CATEGORIES = ["people", "travel", "sports"];

const CATEGORY_INFO = {
  people: { name: "People", shortLabel: "Portraits" },
  travel: { name: "Travel", shortLabel: "Destinations" },
  sports: { name: "Sports", shortLabel: "Action" }
};

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

function filenameToAlt(filename) {
  return path.basename(filename, path.extname(filename))
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function scanPhotosInDirectory(dirPath, urlPrefix) {
  if (!existsSync(dirPath)) return [];

  const photos = [];
  const entries = readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isFile() && isImageFile(entry.name)) {
      photos.push({
        src: `${urlPrefix}/${entry.name}`,
        alt: filenameToAlt(entry.name)
      });
    } else if (entry.isDirectory()) {
      // Recurse into subdirectories
      photos.push(...scanPhotosInDirectory(fullPath, `${urlPrefix}/${entry.name}`));
    }
  }

  return photos;
}

function getPhotosForCategory(category) {
  const categoryDir = path.join(PHOTOS_DIR, category);
  return scanPhotosInDirectory(categoryDir, `/photos/${category}`);
}

function getTravelLocationsWithPhotos() {
  if (!existsSync(TRAVEL_LOCATIONS_FILE)) return [];

  const locations = readJson(TRAVEL_LOCATIONS_FILE);
  const travelDir = path.join(PHOTOS_DIR, "travel");

  return Object.entries(locations).map(([folder, data]) => {
    const folderPath = path.join(travelDir, folder);
    const photos = scanPhotosInDirectory(folderPath, `/photos/travel/${folder}`);

    return {
      slug: folder,
      label: data.label,
      lat: data.lat,
      lng: data.lng,
      photos,
      coverPhoto: photos[0] || null
    };
  }).filter((loc) => loc.photos.length > 0);
}

export const getSiteData = cache(async function getSiteData() {
  const site = readJson(SITE_FILE);

  const categories = CATEGORIES.map((slug) => ({
    slug,
    ...CATEGORY_INFO[slug],
    description: site.categories?.find((c) => c.slug === slug)?.description || ""
  }));

  return { site, categories };
});

export async function getPhotosForCategoryPage(category) {
  if (!CATEGORIES.includes(category)) return null;
  return getPhotosForCategory(category);
}

export async function getCategoryBySlug(category) {
  const { categories } = await getSiteData();
  return categories.find((c) => c.slug === category) ?? null;
}

export async function getTravelLocations() {
  return getTravelLocationsWithPhotos();
}

export async function getCoverPhotoForCategory(category) {
  const photos = getPhotosForCategory(category);
  return photos[0] || null;
}
