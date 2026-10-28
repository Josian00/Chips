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
    country: GB           # optional, for shops that only sell in one country
ingredients:              # optional "Ingredients" box under the review
  list:                   # one entry per ingredient, as printed on the pack
    - Dehydrated Potatoes
    - Vegetable Oils (Sunflower, Corn, Rice Bran)
    - Wheat Starch
    - Salt
  contains: [Wheat]       # allergens, highlighted in the list above
  mayContain: [Milk]      # "may contain" warnings
  source:                 # where you copied the list from
    name: Tesco product page
    url: https://www.tesco.com/groceries/en-GB/search?query=pringles%20original
  checked: 2026-10-19
  verified: true          # set once you've checked it against the bag
nutrition:                # optional, per 100 g as on EU labels
  energyKj: 2252
  energyKcal: 540
  fat: 33
  saturates: 3
  carbohydrate: 53
  sugars: 1.2
  fibre: 4               # optional
  protein: 5.8
  salt: 1.3
---

Your review goes here, in Markdown.
```

The newest review (by `reviewed` date) is featured in full on the home page, with the others suggested below it. Without an `image`, a coloured placeholder is drawn.

The fields are checked by the schema in `src/content.config.ts`, so a missing or mistyped field fails the build with a clear error.

## German version

The site is in English at `/Chips/` and in German at `/Chips/de/`; the EN/DE switch in the header jumps to the same page in the other language. Interface text lives in `src/i18n/ui.ts`, and the pages in `src/pages/[...lang]/` are built once per language.

To translate a review, add a file with the same name to `src/content/chips-de/`:

```md
---
title: "Pringles Original: gestapelt und salzig"  # optional, falls back to English
excerpt: Ein kurzer Teaser.                      # optional
flavour: Gesalzen                                # optional
country: USA                                     # optional
ingredients:                                     # optional, the German ingredient list
  - Kartoffeltrockenerzeugnis
  - Pflanzenöle (Sonnenblume, Mais, Reiskleie)
ingredientsTranslated: true   # leave out if you copied the list from a German pack
---

Die deutsche Rezension.
```

The facts (rating, stores, barcode, allergens, nutrition) stay in the English file. Until a review is translated, its German page shows the English text with a note. Dates and prices follow the language (`12. Oktober 2026`, `2,75 €`).

## Ingredients and allergens

A chip with `ingredients` gets an "Ingredients" box under its review. Allergens named in `contains` are highlighted in the list (for Milk, words like whey, cheese and butter are highlighted too; see `src/lib/ingredients.ts`). Until `verified: true` is set, the box says the list hasn't been checked against the bag yet, and it always tells readers with allergies to read the pack.

`contains` and `mayContain` take the 14 EU allergens (plus Wheat) in English or German, e.g. `Milk` or `Milch`, and show them in the page's language. German lists are highlighted too, including inside compound words like *Magermilchpulver*. With `nutrition`, a "Nutrition per 100 g" table is shown in the order EU labels use.

## Prices and store links

Each chip can list online stores in `stores`; they appear in a "Where to buy" box next to the fact box.

Chips with a `barcode` also get a price tracker. `.github/workflows/prices.yml` runs once a day (or by hand from the Actions tab), fetches the newest prices for each barcode from [Open Prices](https://prices.openfoodfacts.org), a free and open price database from Open Food Facts, and saves them to `src/data/prices.json`. If anything changed it commits the file and redeploys the site. Run it locally with `npm run prices`. Open Prices is crowdsourced, so a chip only shows prices once someone has recorded one there; you can add your own receipts at <https://prices.openfoodfacts.org>.
## Impressum and privacy policy

A website run from Germany usually needs an Impressum (§ 5 DDG, § 18 MStV) and a privacy policy (GDPR), even a hobby blog once it isn't purely private. Draft pages are at `/impressum/` and `/datenschutz/` (and their German versions under `/de/`). Fill in your name, a postal address and an email in `src/lib/legal.ts`; until then the pages show a draft notice and the footer leaves out their links. The privacy policy covers GitHub Pages hosting, Umami, Giscus and shop links. If you add another service, add it there too. These are templates, not legal advice.

The fonts are bundled with the site (via Fontsource) rather than loaded from Google Fonts, which German courts have ruled needs consent.

## Reader comments

Each chip page has a comment section powered by [Giscus](https://giscus.app). Comments are stored as GitHub Discussions in this repo, so there is no server or database to run. Readers sign in with GitHub to comment, which keeps out anonymous spam bots, and you moderate on GitHub.

The section stays hidden until it is set up once:

1. In **Settings → General → Features**, tick **Discussions**.
2. In the **Discussions** tab, use the `General` category (or create one with the **Announcement** format, so only you and Giscus can start threads, and update `category` and `categoryId` to match).
3. Install the [Giscus app](https://github.com/apps/giscus) on this repo only.
4. On [giscus.app](https://giscus.app), enter `Josian00/Chips` pick the category, then copy `data-repo-id` and `data-category-id` into `src/components/Comments.astro`.

Giscus loads only after a reader clicks "Show comments", since it sends their IP address to giscus.app and GitHub. The English and German page of a chip share one comment thread.

To moderate: hide, edit or delete a comment from the discussion on GitHub, lock a discussion to close its comments, or block a user under **Settings → Moderation options**. **Interaction limits** there can restrict commenting to existing contributors during a spam wave.

## Visitor analytics

Visits are tracked with [Umami Cloud](https://umami.is) (free for up to 100k events a month). It shows page views, visitors and visits, visit length and bounce rate, referrers and UTM campaigns, browser, OS, device type, screen size, language, and country, region and city. On top of that the site sends two events:

- `Store link`: a click on a "Where to buy" link, with the `store` and `chip` it was for.
- `Outbound link`: a click on any other link that leaves the site, with its `url` and the `page` it was on.

Umami sets no cookies and does not store IP addresses or other personal data, so it generally needs no cookie banner under GDPR. Browsers that send Do Not Track are not counted. The footer says that visits are counted, and links to Umami's privacy page. If you add a privacy policy, mention Umami there too.

Tracking stays off until it is set up once:

1. Sign up at [cloud.umami.is](https://cloud.umami.is) and add a website with the domain `josian00.github.io`.
2. Copy its **Website ID** into `websiteId` in `src/lib/analytics.ts`.

Only visits on `josian00.github.io` are counted, so local `npm run dev` sessions don't show up. If the site moves to another domain, update `domains` there too. To hide your own visits on the live site, run `localStorage.setItem('umami.disabled', 1)` once in your browser's console.

## Project layout

| Path | What it is |
| --- | --- |
| `src/content/chips/` | One Markdown file per chip |
| `src/content/chips-de/` | German translations of the reviews |
| `src/i18n/ui.ts` | Interface text in English and German |
| `src/content.config.ts` | Schema for chip entries |
| `src/pages/[...lang]/index.astro` | Home page (newest post in full, then suggestions) |
| `src/pages/[...lang]/chips/index.astro` | Table of all chips |
| `src/pages/[...lang]/chips/[id].astro` | Blog post for one chip, with "You might also like" |
| `src/pages/[...lang]/impressum/`, `datenschutz/` | Legal pages, filled from `src/lib/legal.ts` |
| `src/components/` | Post, card, photo, fact box, rating and comments pieces |
| `src/lib/chips.ts` | Sorting, excerpts and suggestion logic |
| `src/lib/analytics.ts`, `src/components/Analytics.astro` | Umami analytics setup and outbound link tracking |
| `src/lib/prices.ts`, `src/data/prices.json` | Tracked price history and formatting |
| `scripts/update-prices.mjs` | Fetches prices from Open Prices |
| `src/layouts/Base.astro` | Shared layout and styles |

## Deploy

`.github/workflows/deploy.yml` builds and publishes the site on every push to `main`. To turn it on once, go to **Settings → Pages** in the GitHub repo and set **Source** to **GitHub Actions**. The site is then served at <https://josian00.github.io/Chips/>.

If the repo is renamed or moved to a custom domain, update `site` and `base` in `astro.config.mjs`.
