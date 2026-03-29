#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const COLLECTIONS_DIR = path.join(process.cwd(), "content", "collections");

const CATEGORY_ICONS = {
  people: "👤",
  travel: "✈️",
  sports: "⚽"
};

function main() {
  const files = readdirSync(COLLECTIONS_DIR).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.log("No collections found.");
    return;
  }

  const collections = files.map((f) => {
    const data = JSON.parse(readFileSync(path.join(COLLECTIONS_DIR, f), "utf8"));
    return data;
  });

  // Group by category
  const byCategory = {};
  for (const c of collections) {
    if (!byCategory[c.category]) {
      byCategory[c.category] = [];
    }
    byCategory[c.category].push(c);
  }

  console.log(`\n📸 Collections (${collections.length} total)\n`);

  for (const [category, items] of Object.entries(byCategory)) {
    const icon = CATEGORY_ICONS[category] || "📁";
    console.log(`${icon} ${category.charAt(0).toUpperCase() + category.slice(1)}`);

    for (const c of items) {
      const photoCount = c.photos?.length || 0;
      const locationInfo = c.location ? ` 📍 ${c.location.label}` : "";
      const coverStatus = c.coverPhotoId === "REPLACE_WITH_PHOTO_ID" ? " ⚠️ needs cover" : "";
      console.log(`   ${c.slug} (${photoCount} photos)${locationInfo}${coverStatus}`);
    }
    console.log();
  }
}

main();
