#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const COLLECTIONS_DIR = path.join(process.cwd(), "content", "collections");
const PHOTOS_DIR = path.join(process.cwd(), "public", "photos");

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getCollections() {
  return readdirSync(COLLECTIONS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const data = JSON.parse(readFileSync(path.join(COLLECTIONS_DIR, f), "utf8"));
      return { file: f, ...data };
    });
}

function findPhotosInDirectory(category) {
  const categoryDir = path.join(PHOTOS_DIR, category);
  if (!existsSync(categoryDir)) return [];

  const results = [];
  const subdirs = readdirSync(categoryDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const subdir of subdirs) {
    const fullPath = path.join(categoryDir, subdir);
    const files = readdirSync(fullPath).filter((f) =>
      /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(f)
    );
    for (const file of files) {
      results.push({
        src: `/photos/${category}/${subdir}/${file}`,
        filename: file,
        subdir
      });
    }
  }
  return results;
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });
  const collections = getCollections();

  console.log("\n📷 Add Photo to Collection\n");

  // Collection selection
  const targetSlug = process.argv[2];
  let collection;

  if (targetSlug) {
    collection = collections.find((c) => c.slug === targetSlug);
    if (!collection) {
      console.log(`❌ Collection "${targetSlug}" not found.`);
      console.log("Available collections:");
      collections.forEach((c) => console.log(`   - ${c.slug}`));
      rl.close();
      process.exit(1);
    }
    console.log(`Collection: ${collection.title}`);
  } else {
    console.log("Collections:");
    collections.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.title} (${c.slug}) - ${c.photos.length} photos`);
    });
    const choice = await rl.question("\nChoose collection [number]: ");
    collection = collections[parseInt(choice) - 1];

    if (!collection) {
      console.log("❌ Invalid choice.");
      rl.close();
      process.exit(1);
    }
  }

  // Find available photos
  const existingIds = new Set(collection.photos.map((p) => p.id));
  const existingSrcs = new Set(collection.photos.map((p) => p.src));
  const availablePhotos = findPhotosInDirectory(collection.category)
    .filter((p) => !existingSrcs.has(p.src));

  if (availablePhotos.length > 0) {
    console.log(`\n📁 Found ${availablePhotos.length} photo(s) not yet in collection:`);
    availablePhotos.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.src}`);
    });
    console.log(`  ${availablePhotos.length + 1}. Enter path manually`);

    const photoChoice = await rl.question("\nChoose photo [number]: ");
    const choiceNum = parseInt(photoChoice);

    let photoSrc;
    if (choiceNum > 0 && choiceNum <= availablePhotos.length) {
      photoSrc = availablePhotos[choiceNum - 1].src;
    } else {
      photoSrc = await rl.question("Photo path (e.g., /photos/people/portraits/image.jpg): ");
    }

    if (!photoSrc.startsWith("/")) {
      photoSrc = "/" + photoSrc;
    }

    // Verify file exists
    const fullPath = path.join(process.cwd(), "public", photoSrc.replace(/^\//, ""));
    if (!existsSync(fullPath)) {
      console.log(`❌ File not found: ${fullPath}`);
      rl.close();
      process.exit(1);
    }

    // Generate ID
    const filename = path.basename(photoSrc, path.extname(photoSrc));
    let suggestedId = slugify(filename);
    let idCounter = 1;
    while (existingIds.has(suggestedId)) {
      suggestedId = `${slugify(filename)}-${idCounter++}`;
    }

    const photoId = (await rl.question(`Photo ID [${suggestedId}]: `)).trim() || suggestedId;

    if (existingIds.has(photoId)) {
      console.log(`❌ ID "${photoId}" already exists in this collection.`);
      rl.close();
      process.exit(1);
    }

    // Photo details
    const title = await rl.question("Title: ");
    const alt = await rl.question("Alt text (accessibility): ");
    const caption = await rl.question("Caption (optional): ");
    const date = await rl.question("Date (e.g., March 2025): ");

    const photo = {
      id: photoId,
      src: photoSrc,
      title: title.trim() || photoId,
      alt: alt.trim() || `Photo: ${title.trim() || photoId}`,
      ...(caption.trim() && { caption: caption.trim() }),
      ...(date.trim() && { date: date.trim() })
    };

    // Add to collection
    collection.photos.push(photo);

    // Check if this should be the cover
    if (collection.coverPhotoId === "REPLACE_WITH_PHOTO_ID" || !collection.coverPhotoId) {
      const setCover = await rl.question("Set as cover photo? [Y/n]: ");
      if (setCover.toLowerCase() !== "n") {
        collection.coverPhotoId = photoId;
      }
    }

    // Remove internal fields before saving
    delete collection.file;

    // Save
    const jsonPath = path.join(COLLECTIONS_DIR, `${collection.slug}.json`);
    writeFileSync(jsonPath, JSON.stringify(collection, null, 2) + "\n");

    console.log(`\n✅ Added "${photo.title}" to ${collection.title}`);
    console.log(`   Collection now has ${collection.photos.length} photo(s).`);

    const addAnother = await rl.question("\nAdd another photo? [y/N]: ");
    if (addAnother.toLowerCase() === "y") {
      rl.close();
      // Re-run with same collection
      process.argv[2] = collection.slug;
      await main();
      return;
    }
  } else {
    console.log(`\n⚠️  No new photos found in public/photos/${collection.category}/`);
    console.log("Add image files first, then run this command again.");
  }

  rl.close();
  console.log("\n💡 Run `npm run validate` to verify your changes.\n");
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
