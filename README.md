# Chips

A blog-style database of chips and crisps, with a rating and review for each one. Built with [Astro](https://astro.build) as a static site and deployed to GitHub Pages.

## Run it locally

Requires Node.js 22.22 or newer.

```sh
npm install
npm run dev      # dev server at http://localhost:4321/Chips/
npm run build    # static build into dist/
npm run preview  # serve the built site
```

## Add a chip

Create a Markdown file in `src/content/chips/`. The file name becomes the URL slug (`src/content/chips/pringles-original.md` → `/Chips/chips/pringles-original/`).

```md
---
name: Original
brand: Pringles
flavour: Salted
country: United States
rating: 7        # 0 to 10, decimals allowed
reviewed: 2026-10-19
---

Your review goes here, in Markdown.
```

The fields are checked by the schema in `src/content.config.ts`, so a missing or mistyped field fails the build with a clear error.

## Project layout

| Path | What it is |
| --- | --- |
| `src/content/chips/` | One Markdown file per chip |
| `src/content.config.ts` | Schema for chip entries |
| `src/pages/index.astro` | Home page (top rated and latest) |
| `src/pages/chips/index.astro` | Table of all chips |
| `src/pages/chips/[id].astro` | Detail page for one chip |
| `src/layouts/Base.astro` | Shared layout and styles |

## Deploy

`.github/workflows/deploy.yml` builds and publishes the site on every push to `main`. To turn it on once, go to **Settings → Pages** in the GitHub repo and set **Source** to **GitHub Actions**. The site is then served at <https://josian00.github.io/Chips/>.

If the repo is renamed or moved to a custom domain, update `site` and `base` in `astro.config.mjs`.
