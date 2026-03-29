import { getSiteData } from "../lib/content.js";

async function main() {
  const { collections, travelCollections } = await getSiteData();

  console.log(`Validated ${collections.length} collections.`);
  console.log(`Travel map includes ${travelCollections.length} mapped collections.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
