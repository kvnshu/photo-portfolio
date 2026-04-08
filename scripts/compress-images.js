import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const PHOTOS_DIR = "public/photos";
const BACKUP_DIR = "public/photos-original";
const SITE_JSON = "content/site.json";

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

async function convertToWebP(imagePath) {
  const originalSize = await getFileSize(imagePath);

  // Create backup path (keep original extension in backup)
  const relativePath = path.relative(PHOTOS_DIR, imagePath);
  const backupPath = path.join(BACKUP_DIR, relativePath);
  await fs.mkdir(path.dirname(backupPath), { recursive: true });

  // Copy original to backup
  await fs.copyFile(imagePath, backupPath);

  // Convert to lossless WebP
  const webpPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, ".webp");

  await sharp(imagePath)
    .rotate() // Auto-rotate based on EXIF
    .webp({ lossless: true })
    .toFile(webpPath);

  // Remove original file
  await fs.unlink(imagePath);

  const newSize = await getFileSize(webpPath);
  const savings = originalSize - newSize;
  const percent = ((savings / originalSize) * 100).toFixed(1);

  return { originalSize, newSize, savings, percent, webpPath };
}

async function main() {
  console.log("🖼️  Lossless WebP Conversion Script");
  console.log("====================================\n");

  // Check if photos directory exists
  try {
    await fs.access(PHOTOS_DIR);
  } catch {
    console.error(`Error: ${PHOTOS_DIR} directory not found`);
    process.exit(1);
  }

  // Get all images
  const images = await getAllImages(PHOTOS_DIR);
  console.log(`Found ${images.length} images to convert\n`);

  if (images.length === 0) {
    console.log("No images found.");
    return;
  }

  // Create backup directory
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  console.log(`Backing up originals to ${BACKUP_DIR}/\n`);

  let totalOriginal = 0;
  let totalNew = 0;
  const convertedFiles = [];

  for (let i = 0; i < images.length; i++) {
    const imagePath = images[i];
    const relativePath = path.relative(PHOTOS_DIR, imagePath);

    process.stdout.write(`[${i + 1}/${images.length}] ${relativePath}... `);

    try {
      const result = await convertToWebP(imagePath);
      totalOriginal += result.originalSize;
      totalNew += result.newSize;
      convertedFiles.push({
        original: relativePath,
        webp: path.relative(PHOTOS_DIR, result.webpPath)
      });

      console.log(
        `${formatBytes(result.originalSize)} → ${formatBytes(result.newSize)} (-${result.percent}%)`
      );
    } catch (error) {
      console.log(`ERROR: ${error.message}`);
    }
  }

  const totalSavings = totalOriginal - totalNew;
  const totalPercent = ((totalSavings / totalOriginal) * 100).toFixed(1);

  console.log("\n====================================");
  console.log("Summary:");
  console.log(`  Original: ${formatBytes(totalOriginal)}`);
  console.log(`  Converted: ${formatBytes(totalNew)}`);
  console.log(`  Saved: ${formatBytes(totalSavings)} (${totalPercent}%)`);
  console.log(`  Format: Lossless WebP (no quality loss)`);
  console.log(`\nOriginals backed up to: ${BACKUP_DIR}/`);

  // Update site.json references
  try {
    const siteContent = await fs.readFile(SITE_JSON, "utf8");
    const updatedContent = siteContent.replace(/\.(jpg|jpeg|png)"/gi, '.webp"');
    await fs.writeFile(SITE_JSON, updatedContent);
    console.log(`\nUpdated image references in ${SITE_JSON}`);
  } catch (error) {
    console.log(`\nNote: Could not update ${SITE_JSON}: ${error.message}`);
  }
}

main().catch(console.error);
