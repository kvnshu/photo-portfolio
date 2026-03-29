# Kevin Xu Photography

File-based photography portfolio built with Next.js. The site includes:

- a premium home page for people, travel, and sports work
- a standard gallery and collection-detail experience
- an interactive travel globe powered by React Three Fiber
- filesystem-backed content with startup/build validation

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Content model

Public content lives in:

- `content/site.json` for site-wide copy, featured collections, and category blurbs
- `content/collections/*.json` for collection metadata and ordered photo entries
- `public/photos/...` for the actual image files

Each collection file includes:

- `slug`, `title`, `category`, `description`
- optional `location` for travel collections with `latitude` and `longitude`
- `coverPhotoId`
- `photos[]`

Each photo entry includes:

- `id`
- `src`
- `title`
- `alt`
- `caption`
- `date`

## Add new work

1. Put new files under `public/photos/<collection-name>/`.
2. Create or update a matching JSON file in `content/collections/`.
3. If you want the collection featured on the home page, add its slug to `featuredCollections` in `content/site.json`.
4. Run:

```bash
npm run validate
```

Validation checks for:

- missing image files
- duplicate collection slugs
- duplicate photo ids inside a collection
- invalid categories
- broken `coverPhotoId` references

## Delete work

1. Remove the photo entry from the relevant `content/collections/*.json` file.
2. If it was the cover image, update `coverPhotoId`.
3. Delete the corresponding file in `public/photos/...`.
4. Run `npm run validate`.

To delete an entire collection, remove its JSON file, remove the slug from `content/site.json` if featured, and delete that collection's image folder.

## Main routes

- `/` home page
- `/gallery` all collections
- `/category/people`
- `/category/travel`
- `/category/sports`
- `/travel` interactive globe
- `/collections/<slug>` collection detail and lightbox
- `/process` file-based update workflow
