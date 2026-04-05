import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { getSiteData } from "../lib/content";

export async function generateMetadata() {
  const { site } = await getSiteData();

  return {
    title: site.name,
    description: site.tagline
  };
}

export default async function RootLayout({ children }) {
  const { site } = await getSiteData();

  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link className="brand" href="/">KX</Link>
          <nav className="site-nav" aria-label="Primary">
            <Link href="/category/people">People</Link>
            <Link href="/travel">Travel</Link>
            <Link href="/category/sports">Sports</Link>
          </nav>
        </header>

        <div className="page-shell">
          <main>{children}</main>

          {site.footerNote ? (
            <footer className="site-footer">
              <p>{site.footerNote}</p>
            </footer>
          ) : null}
        </div>
      </body>
    </html>
  );
}
