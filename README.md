# Chips

A food blog about chips and crisps, with a rating and review for each one. Built with [Astro](https://astro.build) as a static site and deployed to GitHub Pages.

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
title: "Pringles Original: stacked and salty"   # optional headline
excerpt: A short teaser for cards.              # optional, defaults to the first paragraph
image: images/pringles-original.jpg             # optional photo in public/
name: Original
brand: Pringles
flavour: Salted
country: United States
rating: 7        # 0 to 10, decimals allowed
reviewed: 2026-10-19
barcode: "5053990101597"  # optional EAN/UPC from the bag, turns on price tracking
stores:                   # optional "Where to buy" links
  - name: Tesco
    url: https://www.tesco.com/groceries/en-GB/search?query=pringles%20original
    price: 2.75           # optional price you saw yourself
    currency: GBP         # defaults to EUR
    checked: 2026-10-19   # optional date you saw it
---

Your review goes here, in Markdown.
```

The newest review (by `reviewed` date) is featured in full on the home page, with the others suggested below it. Without an `image`, a coloured placeholder is drawn.

The fields are checked by the schema in `src/content.config.ts`, so a missing or mistyped field fails the build with a clear error.

## Prices and store links

Each chip can list online stores in `stores`; they appear in a "Where to buy" box next to the fact box.

Chips with a `barcode` also get a price tracker. `.github/workflows/prices.yml` runs once a day (or by hand from the Actions tab), fetches the newest prices for each barcode from [Open Prices](https://prices.openfoodfacts.org), a free and open price database from Open Food Facts, and saves them to `src/data/prices.json`. If anything changed it commits the file and redeploys the site. Run it locally with `npm run prices`. Open Prices is crowdsourced, so a chip only shows prices once someone has recorded one there; you can add your own receipts at <https://prices.openfoodfacts.org>.
## Reader comments

Each chip page has a comment section powered by [Giscus](https://giscus.app). Comments are stored as GitHub Discussions in this repo, so there is no server or database to run. Readers sign in with GitHub to comment, which keeps out anonymous spam bots, and you moderate on GitHub.

The section stays hidden until it is set up once:

1. In **Settings → General → Features**, tick **Discussions**.
2. In the **Discussions** tab, use the `General` category (or create one with the **Announcement** format, so only you and Giscus can start threads, and update `category` and `categoryId` to match).
3. Install the [Giscus app](https://github.com/apps/giscus) on this repo only.
4. On [giscus.app](https://giscus.app), enter `Josian00/Chips` pick the category, then copy `data-repo-id` and `data-category-id` into `src/components/Comments.astro`.

To moderate: hide, edit or delete a comment from the discussion on GitHub, lock a discussion to close its comments, or block a user under **Settings → Moderation options**. **Interaction limits** there can restrict commenting to existing contributors during a spam wave.

## Visitor analytics

Visits are tracked with [Umami Cloud](https://umami.is) (free for up to 100k events a month). It shows page views, visitors and visits, visit length and bounce rate, referrers and UTM campaigns, browser, OS, device type, screen size, language, and country, region and city. On top of that the site sends two events:

- `Store link`: a click on a "Where to buy" link, with the `store` and `chip` it was for.
- `Outbound link`: a click on any other link that leaves the site, with its `url` and the `page` it was on.

Umami sets no cookies and does not store IP addresses or other personal data, so it generally needs no cookie banner under GDPR. The footer says that visits are counted, and links to Umami's privacy page. If you add a privacy policy, mention Umami there too.

Tracking stays off until it is set up once:

1. Sign up at [cloud.umami.is](https://cloud.umami.is) and add a website with the domain `josian00.github.io`.
2. Copy its **Website ID** into `websiteId` in `src/lib/analytics.ts`.

Only visits on `josian00.github.io` are counted, so local `npm run dev` sessions don't show up. If the site moves to another domain, update `domains` there too. To hide your own visits on the live site, run `localStorage.setItem('umami.disabled', 1)` once in your browser's console.

## Project layout

| Path | What it is |
| --- | --- |
| `src/content/chips/` | One Markdown file per chip |
| `src/content.config.ts` | Schema for chip entries |
| `src/pages/index.astro` | Home page (newest post in full, then suggestions) |
| `src/pages/chips/index.astro` | Table of all chips |
| `src/pages/chips/[id].astro` | Blog post for one chip, with "You might also like" |
| `src/components/` | Post, card, photo, fact box, rating and comments pieces |
| `src/lib/chips.ts` | Sorting, excerpts and suggestion logic |
| `src/lib/analytics.ts`, `src/components/Analytics.astro` | Umami analytics setup and outbound link tracking |
| `src/lib/prices.ts`, `src/data/prices.json` | Tracked price history and formatting |
| `scripts/update-prices.mjs` | Fetches prices from Open Prices |
| `src/layouts/Base.astro` | Shared layout and styles |

## Deploy

`.github/workflows/deploy.yml` builds and publishes the site on every push to `main`. To turn it on once, go to **Settings → Pages** in the GitHub repo and set **Source** to **GitHub Actions**. The site is then served at <https://josian00.github.io/Chips/>.

If the repo is renamed or moved to a custom domain, update `site` and `base` in `astro.config.mjs`.
