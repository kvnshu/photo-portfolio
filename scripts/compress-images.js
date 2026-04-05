import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const PHOTOS_DIR = "public/photos";
const BACKUP_DIR = "public/photos-original";
const MAX_WIDTH = 2400;
const MAX_HEIGHT = 2400;
const JPEG_QUALITY = 80;
const PNG_QUALITY = 80;

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"];

async function getAllImages(dir) {
  const images = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      images.push(...(await getAllImages(fullPath)));
    } else if (IMAGE_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
      images.push(fullPath);
    }
  }

  return images;
}

async function getFileSize(filePath) {
  const stats = await fs.stat(filePath);
  return stats.size;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

async function compressImage(imagePath) {
  const ext = path.extname(imagePath).toLowerCase();
  const originalSize = await getFileSize(imagePath);

  // Create backup path
  const relativePath = path.relative(PHOTOS_DIR, imagePath);
  const backupPath = path.join(BACKUP_DIR, relativePath);
  await fs.mkdir(path.dirname(backupPath), { recursive: true });

  // Copy original to backup
  await fs.copyFile(imagePath, backupPath);

  // Process image
  let pipeline = sharp(imagePath).rotate(); // Auto-rotate based on EXIF

  // Resize if larger than max dimensions
  const metadata = await sharp(imagePath).metadata();
  if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
    pipeline = pipeline.resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: "inside",
      withoutEnlargement: true
    });
  }

  // Compress based on format
  if (ext === ".png") {
    pipeline = pipeline.png({ quality: PNG_QUALITY, compressionLevel: 9 });
  } else {
    pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
  }

  // Write to temp file then replace original
  const tempPath = imagePath + ".tmp";
  await pipeline.toFile(tempPath);
  await fs.rename(tempPath, imagePath);

  const newSize = await getFileSize(imagePath);
  const savings = originalSize - newSize;
  const percent = ((savings / originalSize) * 100).toFixed(1);

  return { originalSize, newSize, savings, percent };
}

async function main() {
  console.log("🖼️  Image Compression Script");
  console.log("============================\n");

  // Check if photos directory exists
  try {
    await fs.access(PHOTOS_DIR);
  } catch {
    console.error(`Error: ${PHOTOS_DIR} directory not found`);
    process.exit(1);
  }

  // Get all images
  const images = await getAllImages(PHOTOS_DIR);
  console.log(`Found ${images.length} images to compress\n`);

  if (images.length === 0) {
    console.log("No images found.");
    return;
  }

  // Create backup directory
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  console.log(`Backing up originals to ${BACKUP_DIR}/\n`);

  let totalOriginal = 0;
  let totalNew = 0;

  for (let i = 0; i < images.length; i++) {
    const imagePath = images[i];
    const relativePath = path.relative(PHOTOS_DIR, imagePath);

    process.stdout.write(`[${i + 1}/${images.length}] ${relativePath}... `);

    try {
      const result = await compressImage(imagePath);
      totalOriginal += result.originalSize;
      totalNew += result.newSize;

      console.log(
        `${formatBytes(result.originalSize)} → ${formatBytes(result.newSize)} (-${result.percent}%)`
      );
    } catch (error) {
      console.log(`ERROR: ${error.message}`);
    }
  }

  const totalSavings = totalOriginal - totalNew;
  const totalPercent = ((totalSavings / totalOriginal) * 100).toFixed(1);

  console.log("\n============================");
  console.log("Summary:");
  console.log(`  Original: ${formatBytes(totalOriginal)}`);
  console.log(`  Compressed: ${formatBytes(totalNew)}`);
  console.log(`  Saved: ${formatBytes(totalSavings)} (${totalPercent}%)`);
  console.log(`\nOriginals backed up to: ${BACKUP_DIR}/`);
}

main().catch(console.error);
