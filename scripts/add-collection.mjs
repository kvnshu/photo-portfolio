#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const COLLECTIONS_DIR = path.join(process.cwd(), "content", "collections");
const PHOTOS_DIR = path.join(process.cwd(), "public", "photos");

const CATEGORIES = {
  1: { slug: "people", name: "People", photosDir: "people" },
  2: { slug: "travel", name: "Travel", photosDir: "travel" },
  3: { slug: "sports", name: "Sports", photosDir: "sports" }
};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getExistingSlugs() {
  return readdirSync(COLLECTIONS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  console.log("\n📸 Add New Collection\n");

  // Title
  const title = await rl.question("Collection title: ");
  if (!title.trim()) {
    console.log("❌ Title is required.");
    rl.close();
    process.exit(1);
  }

  // Slug
  const suggestedSlug = slugify(title);
  const existingSlugs = getExistingSlugs();
  let slug = await rl.question(`URL slug [${suggestedSlug}]: `);
  slug = slug.trim() || suggestedSlug;

  if (existingSlugs.includes(slug)) {
    console.log(`❌ Slug "${slug}" already exists. Choose a different name.`);
    rl.close();
    process.exit(1);
  }

  // Category
  console.log("\nCategory:");
  console.log("  1. People (portraits)");
  console.log("  2. Travel (destinations)");
  console.log("  3. Sports (action)");
  const categoryChoice = await rl.question("Choose [1-3]: ");
  const category = CATEGORIES[categoryChoice];

  if (!category) {
    console.log("❌ Invalid category choice.");
    rl.close();
    process.exit(1);
  }

  // Description
  const description = await rl.question("\nShort description: ");

  // Location (travel only)
  let location = null;
  if (category.slug === "travel") {
    console.log("\n📍 Travel collections can show on the map.");
    const addLocation = await rl.question("Add map location? [Y/n]: ");
    if (addLocation.toLowerCase() !== "n") {
      const label = await rl.question("Location name (e.g., Reykjavik, Iceland): ");
      const lat = await rl.question("Latitude (e.g., 64.1466): ");
      const lng = await rl.question("Longitude (e.g., -21.9426): ");

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        location = { label, latitude, longitude };
      } else {
        console.log("⚠️  Invalid coordinates, skipping location.");
      }
    }
  }

  // Create photos directory
  const photosDirName = slugify(title.split(" ").slice(0, 2).join("-")) || slug;
  const photosPath = path.join(PHOTOS_DIR, category.photosDir, photosDirName);

  if (!existsSync(photosPath)) {
    mkdirSync(photosPath, { recursive: true });
    console.log(`\n✅ Created photos directory: public/photos/${category.photosDir}/${photosDirName}/`);
  }

  // Build collection object
  const collection = {
    slug,
    title: title.trim(),
    category: category.slug,
    description: description.trim() || `A ${category.name.toLowerCase()} collection.`,
    coverPhotoId: "REPLACE_WITH_PHOTO_ID",
    ...(location && { location }),
    photos: []
  };

  // Write JSON file
  const jsonPath = path.join(COLLECTIONS_DIR, `${slug}.json`);
  writeFileSync(jsonPath, JSON.stringify(collection, null, 2) + "\n");

  rl.close();

  console.log(`✅ Created collection: content/collections/${slug}.json`);
  console.log("\n📋 Next steps:");
  console.log(`   1. Add photos to: public/photos/${category.photosDir}/${photosDirName}/`);
  console.log(`   2. Run: npm run add-photo ${slug}`);
  console.log(`   3. Update coverPhotoId in the JSON file`);
  console.log(`   4. Run: npm run validate`);
  console.log();
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
