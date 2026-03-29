import { notFound } from "next/navigation";
import { getCategoryBySlug, getCollectionsByCategory, getSiteData } from "../../../lib/content";
import CollectionCard from "../../../components/CollectionCard";

export async function generateStaticParams() {
  const { categories } = await getSiteData();
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }) {
  const { category } = await params;
  const categoryData = await getCategoryBySlug(category);

  if (!categoryData) {
    return {
      title: "Not Found"
    };
  }

  return {
    title: categoryData.name
  };
}

export default async function CategoryPage({ params }) {
  const { category } = await params;
  const categoryData = await getCategoryBySlug(category);

  if (!categoryData) {
    notFound();
  }

  const collections = await getCollectionsByCategory(category);

  return (
    <div className="page-stack">
      <section className="page-intro">
        <p className="eyebrow">{categoryData.shortLabel}</p>
        <h1>{categoryData.name}</h1>
        <p className="lede">{categoryData.description}</p>
      </section>

      <div className="collection-grid">
        {collections.map((collection) => (
          <CollectionCard key={collection.slug} collection={collection} />
        ))}
      </div>
    </div>
  );
}
