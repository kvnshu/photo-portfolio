import { notFound } from "next/navigation";
import { getCategoryBySlug, getCollectionsForCategoryPage, getSiteData } from "../../../lib/content";
import CategoryGallery from "../../../components/CategoryGallery";

export async function generateStaticParams() {
  const { categories } = await getSiteData();
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }) {
  const { category } = await params;
  const categoryData = await getCategoryBySlug(category);

  if (!categoryData) {
    return { title: "Not Found" };
  }

  return { title: categoryData.name };
}

export default async function CategoryPage({ params }) {
  const { category } = await params;
  const categoryData = await getCategoryBySlug(category);

  if (!categoryData) {
    notFound();
  }

  const collections = await getCollectionsForCategoryPage(category);

  return (
    <div className="page-stack">
      <h1 className="category-header">{categoryData.name}</h1>
      <CategoryGallery collections={collections || []} />
    </div>
  );
}
