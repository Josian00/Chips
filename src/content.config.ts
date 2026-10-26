import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Each chip is a blog post: a Markdown file in src/content/chips/. The
// frontmatter holds the facts; the Markdown body is the review.
const chips = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chips' }),
  schema: z.object({
    name: z.string(),
    brand: z.string(),
    flavour: z.string(),
    country: z.string(),
    rating: z.number().min(0).max(10),
    reviewed: z.coerce.date(),
    // Optional post headline; defaults to "<brand> <name>".
    title: z.string().optional(),
    // Optional teaser shown on cards; defaults to the review's first paragraph.
    excerpt: z.string().optional(),
    // Optional photo, a path inside public/ (e.g. images/walkers.jpg).
    image: z.string().optional(),
    // Optional EAN/UPC barcode from the bag. When set, the daily price job
    // looks the chip up on Open Prices (prices.openfoodfacts.org).
    barcode: z.string().regex(/^\d{8,14}$/).optional(),
    // Optional online stores selling the chip, shown under "Where to buy".
    // `price` is a price you saw yourself; `checked` is when you saw it.
    stores: z
      .array(
        z.object({
          name: z.string(),
          url: z.url(),
          price: z.number().positive().optional(),
          currency: z.string().length(3).default('EUR'),
          checked: z.coerce.date().optional(),
        }),
      )
      .default([]),
  }),
});

export const collections = { chips };
