import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Each chip is a Markdown file in src/content/chips/. The frontmatter holds
// the facts; the Markdown body is the review.
const chips = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chips' }),
  schema: z.object({
    name: z.string(),
    brand: z.string(),
    flavour: z.string(),
    country: z.string(),
    rating: z.number().min(0).max(10),
    reviewed: z.coerce.date(),
  }),
});

export const collections = { chips };
