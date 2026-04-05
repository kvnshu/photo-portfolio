import { notFound } from "next/navigation";
import { getCategoryBySlug, getPhotosForCategoryPage, getSiteData } from "../../../lib/content";
import PhotoLightbox from "../../../components/PhotoLightbox";

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

  const photos = await getPhotosForCategoryPage(category);

  return (
    <div className="page-stack">
      <section className="page-intro">
        <p className="eyebrow">{categoryData.shortLabel}</p>
        <h1>{categoryData.name}</h1>
        {categoryData.description && <p className="lede">{categoryData.description}</p>}
      </section>

      {photos && photos.length > 0 ? (
        <PhotoLightbox photos={photos} />
      ) : (
        <p className="empty-state">No photos yet.</p>
      )}
    </div>
  );
}
