const steps = [
  "Add image files under public/photos/<collection-name>/.",
  "Create or edit the matching file in content/collections/.",
  "Set or update coverPhotoId so every collection has a valid cover.",
  "Run npm run validate before deploying or building.",
  "Delete work by removing the JSON entry first, then the file on disk."
];

export const metadata = {
  title: "Workflow"
};

export default function ProcessPage() {
  return (
    <div className="page-stack">
      <section className="page-intro">
        <p className="eyebrow">File-Based Workflow</p>
        <h1>How to add or remove work</h1>
        <p className="lede">
          The site has no browser admin panel, so editing access is controlled entirely by repo or
          server access. Public visitors only see the published portfolio.
        </p>
      </section>

      <section className="dual-panel">
        <article className="info-panel">
          <p className="eyebrow">Add Photos</p>
          <h2>Predictable structure, minimal friction</h2>
          <ol className="step-list">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>

        <article className="info-panel">
          <p className="eyebrow">Validation</p>
          <h2>Catch broken references before deploy</h2>
          <div className="code-card">
            <code>npm run validate</code>
          </div>
          <p>
            Validation fails fast if a collection references a missing file, an invalid category, or
            a cover image that no longer exists.
          </p>
          <div className="code-card">
            <code>npm run build</code>
          </div>
          <p>
            The production build also reads the content layer, so unresolved filesystem issues show up
            immediately instead of failing silently in production.
          </p>
        </article>
      </section>
    </div>
  );
}
