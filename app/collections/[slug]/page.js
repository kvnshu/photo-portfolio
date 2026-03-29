import { notFound } from "next/navigation";
import PhotoLightbox from "../../../components/PhotoLightbox";
import { getCollectionBySlug, getSiteData } from "../../../lib/content";

export async function generateStaticParams() {
  const { collections } = await getSiteData();
  return collections.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    return {
      title: "Not Found"
    };
  }

  return {
    title: collection.title,
    description: collection.description
  };
}

export default async function CollectionPage({ params }) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    notFound();
  }

  return <PhotoLightbox collection={collection} />;
}
