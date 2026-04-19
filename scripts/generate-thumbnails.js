/**
 * Thumbnail Generator for Photo Portfolio
 *
 * This script:
 * 1. Downloads full-size images from R2 (via rclone)
 * 2. Generates 800px wide thumbnails using Sharp
 * 3. Saves thumbnails locally for upload to R2
 *
 * Prerequisites:
 * - rclone configured with 'r2' remote
 * - Sharp installed (npm install sharp)
 *
 * Usage:
 *   npm run generate-thumbnails
 *
 * After running:
 *   rclone sync ./public/thumbs r2:photo-portfolio/thumbs --progress
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const R2_BUCKET = "r2:photo-portfolio/photos";
const LOCAL_PHOTOS_DIR = "./temp-photos";
const THUMBS_OUTPUT_DIR = "./public/thumbs";
const THUMB_WIDTH = 800;
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

async function downloadFromR2() {
  console.log("📥 Downloading images from R2...");
  console.log(`   Source: ${R2_BUCKET}`);
  console.log(`   Destination: ${LOCAL_PHOTOS_DIR}`);

  mkdirSync(LOCAL_PHOTOS_DIR, { recursive: true });

  try {
    execSync(`rclone sync ${R2_BUCKET} ${LOCAL_PHOTOS_DIR} --progress`, {
      stdio: "inherit"
    });
    console.log("✅ Download complete\n");
  } catch (error) {
    console.error("❌ Failed to download from R2:", error.message);
    process.exit(1);
  }
}

async function generateThumbnail(inputPath, outputPath) {
  const outputDir = path.dirname(outputPath);
  mkdirSync(outputDir, { recursive: true });

  await sharp(inputPath)
    .resize(THUMB_WIDTH, null, {
      withoutEnlargement: true,
      fit: "inside"
    })
    .jpeg({ quality: 80, progressive: true })
    .toFile(outputPath);
}

async function processDirectory(dir, relativePath = "") {
  const entries = readdirSync(dir, { withFileTypes: true });
  let processed = 0;
  let skipped = 0;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      const result = await processDirectory(fullPath, relPath);
      processed += result.processed;
      skipped += result.skipped;
    } else if (entry.isFile() && isImageFile(entry.name)) {
      // Change extension to .jpg for thumbnails
      const thumbName = path.basename(entry.name, path.extname(entry.name)) + ".jpg";
      const outputPath = path.join(THUMBS_OUTPUT_DIR, relativePath, thumbName);

      // Skip if thumbnail already exists and is newer than source
      if (existsSync(outputPath)) {
        const srcStat = statSync(fullPath);
        const thumbStat = statSync(outputPath);
        if (thumbStat.mtime > srcStat.mtime) {
          skipped++;
          continue;
        }
      }

      try {
        await generateThumbnail(fullPath, outputPath);
        processed++;
        process.stdout.write(`\r🖼️  Generated: ${processed} thumbnails (skipped ${skipped} existing)`);
      } catch (error) {
        console.error(`\n❌ Failed to process ${relPath}:`, error.message);
      }
    }
  }

  return { processed, skipped };
}

async function main() {
  console.log("🚀 Thumbnail Generator\n");
  console.log(`   Thumbnail width: ${THUMB_WIDTH}px`);
  console.log(`   Output format: JPEG (quality 80, progressive)\n`);

  // Step 1: Download from R2
  await downloadFromR2();

  // Step 2: Generate thumbnails
  console.log("🔄 Generating thumbnails...");
  mkdirSync(THUMBS_OUTPUT_DIR, { recursive: true });

  const { processed, skipped } = await processDirectory(LOCAL_PHOTOS_DIR);

  console.log(`\n\n✅ Done! Generated ${processed} thumbnails, skipped ${skipped} existing\n`);
  console.log("📤 Next step - upload thumbnails to R2:");
  console.log(`   rclone sync ${THUMBS_OUTPUT_DIR} r2:photo-portfolio/thumbs --progress\n`);
  console.log("🧹 Optional - clean up temp folder:");
  console.log(`   rm -rf ${LOCAL_PHOTOS_DIR}\n`);
}

main().catch(console.error);
