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
          // Optional ISO country code of a store that only sells there (e.g.
          // DE, GB, US), shown next to its name. Leave out for shops that
          // ship EU-wide.
          country: z.string().length(2).toUpperCase().optional(),
        }),
      )
      .default([]),
    // Optional ingredients, shown in an "Ingredients" box under the review.
    // `contains` and `mayContain` name allergens as the label does (e.g. Milk).
    // `source` says where the list was copied from; set `verified: true` once
    // you have checked it against the bag yourself.
    ingredients: z
      .object({
        list: z.array(z.string()).min(1),
        contains: z.array(z.string()).default([]),
        mayContain: z.array(z.string()).default([]),
        source: z.object({ name: z.string(), url: z.url().optional() }).optional(),
        checked: z.coerce.date().optional(),
        verified: z.boolean().default(false),
      })
      .optional(),
    // Optional vegetarian and vegan status as the pack states it (e.g. a
    // "Suitable for vegetarians" logo). Without it, the status is worked out
    // from `ingredients`, and anything unclear (cheese, whey, flavourings) is
    // shown as unclear. A `true` that the ingredients contradict fails the build.
    diet: z
      .object({
        vegetarian: z.boolean().optional(),
        vegan: z.boolean().optional(),
        source: z.object({ name: z.string(), url: z.url().optional() }).optional(),
      })
      .optional(),
    // Optional nutrition declaration per 100 g, in the order EU labels print
    // it (Regulation (EU) No 1169/2011). Values in grams, energy in kJ and kcal.
    nutrition: z
      .object({
        energyKj: z.number().nonnegative(),
        energyKcal: z.number().nonnegative(),
        fat: z.number().nonnegative(),
        saturates: z.number().nonnegative(),
        carbohydrate: z.number().nonnegative(),
        sugars: z.number().nonnegative(),
        fibre: z.number().nonnegative().optional(),
        protein: z.number().nonnegative(),
        salt: z.number().nonnegative(),
      })
      .optional(),
  }),
});

// German translations: a Markdown file in src/content/chips-de/ with the same
// file name as the English chip. The facts (rating, stores, barcode, ...) stay
// in the English file; this one only holds text. Every field is optional and
// falls back to English, and the Markdown body is the German review.
const chipsDe = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chips-de' }),
  schema: z.object({
    title: z.string().optional(),
    excerpt: z.string().optional(),
    flavour: z.string().optional(),
    country: z.string().optional(),
    // The ingredient list in German, one entry per ingredient. Set
    // `ingredientsTranslated: true` when you translated it yourself rather
    // than copying it from a German pack.
    ingredients: z.array(z.string()).min(1).optional(),
    ingredientsTranslated: z.boolean().default(false),
  }),
});

export const collections = { chips, chipsDe };
