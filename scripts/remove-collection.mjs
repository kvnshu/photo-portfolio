#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { readdirSync, readFileSync, writeFileSync, unlinkSync, rmSync, existsSync } from "node:fs";
import path from "node:path";

const COLLECTIONS_DIR = path.join(process.cwd(), "content", "collections");
const SITE_JSON = path.join(process.cwd(), "content", "site.json");
const PHOTOS_DIR = path.join(process.cwd(), "public", "photos");

function getCollections() {
  return readdirSync(COLLECTIONS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const data = JSON.parse(readFileSync(path.join(COLLECTIONS_DIR, f), "utf8"));
      return { file: f, ...data };
    });
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });
  const collections = getCollections();

  console.log("\n🗑️  Remove Collection\n");

  if (collections.length === 0) {
    console.log("No collections found.");
    rl.close();
    return;
  }

  // Collection selection
  const targetSlug = process.argv[2];
  let collection;

  if (targetSlug) {
    collection = collections.find((c) => c.slug === targetSlug);
    if (!collection) {
      console.log(`Collection "${targetSlug}" not found.`);
      console.log("Available collections:");
      collections.forEach((c) => console.log(`   - ${c.slug}`));
      rl.close();
      process.exit(1);
    }
  } else {
    console.log("Collections:");
    collections.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.title} (${c.slug}) - ${c.photos.length} photos`);
    });
    const choice = await rl.question("\nRemove collection [number]: ");
    collection = collections[parseInt(choice) - 1];

    if (!collection) {
      console.log("Invalid choice.");
      rl.close();
      process.exit(1);
    }
  }

  console.log(`\nCollection: ${collection.title}`);
  console.log(`  Category: ${collection.category}`);
  console.log(`  Photos: ${collection.photos.length}`);

  // Confirm
  const confirm = await rl.question(`\nRemove "${collection.title}"? This cannot be undone. [y/N]: `);
  if (confirm.toLowerCase() !== "y") {
    console.log("Cancelled.");
    rl.close();
    return;
  }

  // Remove from site.json featuredCollections if present
  const siteData = JSON.parse(readFileSync(SITE_JSON, "utf8"));
  if (siteData.featuredCollections?.includes(collection.slug)) {
    siteData.featuredCollections = siteData.featuredCollections.filter(
      (slug) => slug !== collection.slug
    );
    writeFileSync(SITE_JSON, JSON.stringify(siteData, null, 2) + "\n");
    console.log(`Removed from featured collections.`);
  }

  // Delete collection JSON
  const jsonPath = path.join(COLLECTIONS_DIR, collection.file);
  unlinkSync(jsonPath);
  console.log(`Deleted: content/collections/${collection.file}`);

  // Ask about photo directory
  if (collection.photos.length > 0) {
    // Try to determine the photo directory from the first photo
    const firstPhotoSrc = collection.photos[0].src;
    const match = firstPhotoSrc.match(/^\/photos\/([^/]+\/[^/]+)\//);
    if (match) {
      const photoDir = path.join(PHOTOS_DIR, match[1]);
      if (existsSync(photoDir)) {
        const deletePhotos = await rl.question(`\nAlso delete photos directory (${match[1]})? [y/N]: `);
        if (deletePhotos.toLowerCase() === "y") {
          rmSync(photoDir, { recursive: true });
          console.log(`Deleted: public/photos/${match[1]}`);
        }
      }
    }
  }

  console.log(`\nCollection "${collection.title}" removed.`);
  rl.close();
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
