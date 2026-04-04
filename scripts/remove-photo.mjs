#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { readdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";

const COLLECTIONS_DIR = path.join(process.cwd(), "content", "collections");
const PHOTOS_DIR = path.join(process.cwd(), "public");

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

  console.log("\n🗑️  Remove Photo from Collection\n");

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
    console.log(`Collection: ${collection.title}`);
  } else {
    console.log("Collections:");
    collections.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.title} (${c.slug}) - ${c.photos.length} photos`);
    });
    const choice = await rl.question("\nChoose collection [number]: ");
    collection = collections[parseInt(choice) - 1];

    if (!collection) {
      console.log("Invalid choice.");
      rl.close();
      process.exit(1);
    }
  }

  if (collection.photos.length === 0) {
    console.log("\nNo photos in this collection.");
    rl.close();
    return;
  }

  // Show photos
  console.log(`\nPhotos in "${collection.title}":`);
  collection.photos.forEach((p, i) => {
    const coverMark = p.id === collection.coverPhotoId ? " [cover]" : "";
    console.log(`  ${i + 1}. ${p.title || p.id}${coverMark}`);
    console.log(`      ${p.src}`);
  });

  const photoChoice = await rl.question("\nRemove photo [number]: ");
  const choiceNum = parseInt(photoChoice);

  if (choiceNum < 1 || choiceNum > collection.photos.length) {
    console.log("Invalid choice.");
    rl.close();
    process.exit(1);
  }

  const photoToRemove = collection.photos[choiceNum - 1];

  // Confirm
  const confirm = await rl.question(`\nRemove "${photoToRemove.title || photoToRemove.id}"? [y/N]: `);
  if (confirm.toLowerCase() !== "y") {
    console.log("Cancelled.");
    rl.close();
    return;
  }

  // Ask about file deletion
  const deleteFile = await rl.question("Also delete the image file? [y/N]: ");

  // Remove from collection
  collection.photos = collection.photos.filter((p) => p.id !== photoToRemove.id);

  // Handle cover photo
  if (collection.coverPhotoId === photoToRemove.id) {
    if (collection.photos.length > 0) {
      console.log(`\nCover photo removed. Available photos for new cover:`);
      collection.photos.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.title || p.id}`);
      });
      const newCoverChoice = await rl.question("Choose new cover [number]: ");
      const newCoverNum = parseInt(newCoverChoice);
      if (newCoverNum >= 1 && newCoverNum <= collection.photos.length) {
        collection.coverPhotoId = collection.photos[newCoverNum - 1].id;
      } else {
        collection.coverPhotoId = collection.photos[0].id;
        console.log(`Defaulting to: ${collection.photos[0].title || collection.photos[0].id}`);
      }
    } else {
      collection.coverPhotoId = "REPLACE_WITH_PHOTO_ID";
    }
  }

  // Remove internal fields before saving
  delete collection.file;

  // Save
  const jsonPath = path.join(COLLECTIONS_DIR, `${collection.slug}.json`);
  writeFileSync(jsonPath, JSON.stringify(collection, null, 2) + "\n");

  console.log(`\nRemoved "${photoToRemove.title || photoToRemove.id}" from ${collection.title}`);
  console.log(`Collection now has ${collection.photos.length} photo(s).`);

  // Delete file if requested
  if (deleteFile.toLowerCase() === "y") {
    try {
      const filePath = path.join(PHOTOS_DIR, photoToRemove.src.replace(/^\//, ""));
      unlinkSync(filePath);
      console.log(`Deleted file: ${photoToRemove.src}`);
    } catch (err) {
      console.log(`Could not delete file: ${err.message}`);
    }
  }

  const removeAnother = await rl.question("\nRemove another photo? [y/N]: ");
  if (removeAnother.toLowerCase() === "y") {
    rl.close();
    process.argv[2] = collection.slug;
    await main();
    return;
  }

  rl.close();
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
