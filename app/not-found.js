import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-intro">
      <p className="eyebrow">Not Found</p>
      <h1>That collection or category does not exist.</h1>
      <p className="lede">
        The route may have been removed from the filesystem, or the slug may not match the content
        metadata.
      </p>
      <Link className="button-primary" href="/category/people">
        Back to people
      </Link>
    </div>
  );
}
