import type { Lang } from '../i18n/ui';

// The 14 allergens EU labels must declare (Regulation (EU) No 1169/2011,
// Annex II), plus wheat, which packs often name on its own. For each: how to
// show it in every language, and what points to it inside an ingredient name,
// so it can be highlighted the way labels print it in bold. `words` only match
// whole words; `stems` are German and also match inside compound words like
// "Magermilchpulver" or "Weizenstärke". All lower case.
interface Allergen {
  label: Record<Lang, string>;
  words: string[];
  stems?: string[];
}

const glutenStems = ['weizen', 'gerste', 'roggen', 'hafer', 'dinkel', 'gluten'];

const allergens: Record<string, Allergen> = {
  gluten: {
    label: { en: 'Cereals containing gluten', de: 'Glutenhaltiges Getreide' },
    words: ['wheat', 'barley', 'rye', 'oat', 'oats', 'spelt', 'gluten'],
    stems: glutenStems,
  },
  wheat: { label: { en: 'Wheat', de: 'Weizen' }, words: ['wheat', 'spelt'], stems: ['weizen', 'dinkel'] },
  crustaceans: {
    label: { en: 'Crustaceans', de: 'Krebstiere' },
    words: ['shrimp', 'prawn', 'crab', 'lobster'],
    stems: ['garnele', 'krabbe', 'hummer', 'krebs'],
  },
  eggs: { label: { en: 'Eggs', de: 'Eier' }, words: ['egg', 'eggs', 'ei', 'eier'], stems: ['vollei', 'eigelb', 'eipulver', 'hühnerei'] },
  fish: { label: { en: 'Fish', de: 'Fisch' }, words: ['fish', 'anchovy'], stems: ['fisch', 'sardelle'] },
  peanuts: { label: { en: 'Peanuts', de: 'Erdnüsse' }, words: ['peanut', 'peanuts'], stems: ['erdnuss', 'erdnüsse'] },
  soy: { label: { en: 'Soy', de: 'Soja' }, words: ['soy', 'soya', 'soybean'], stems: ['soja'] },
  milk: {
    label: { en: 'Milk', de: 'Milch' },
    words: ['milk', 'whey', 'cream', 'cheese', 'yoghurt', 'yogurt', 'dairy', 'casein'],
    stems: ['milch', 'molke', 'lactose', 'laktose', 'butter', 'sahne', 'rahm', 'käse', 'joghurt', 'kasein', 'mascarpone', 'quark'],
  },
  nuts: {
    label: { en: 'Nuts', de: 'Schalenfrüchte' },
    words: ['almond', 'hazelnut', 'walnut', 'cashew', 'pecan', 'pistachio', 'macadamia', 'nut', 'nuts', 'nuss', 'nüsse'],
    stems: ['mandel', 'haselnuss', 'walnuss', 'cashew', 'pekannuss', 'paranuss', 'pistazie', 'macadamia'],
  },
  celery: { label: { en: 'Celery', de: 'Sellerie' }, words: ['celery', 'celeriac'], stems: ['sellerie'] },
  mustard: { label: { en: 'Mustard', de: 'Senf' }, words: ['mustard'], stems: ['senf'] },
  sesame: { label: { en: 'Sesame', de: 'Sesam' }, words: ['sesame'], stems: ['sesam'] },
  sulphites: {
    label: { en: 'Sulphites', de: 'Sulfite' },
    words: ['sulphite', 'sulfite', 'sulphites', 'sulfites', 'sulphur dioxide', 'sulfur dioxide'],
    stems: ['sulfit', 'schwefeldioxid', 'disulfit'],
  },
  lupin: { label: { en: 'Lupin', de: 'Lupinen' }, words: ['lupin'], stems: ['lupine'] },
  molluscs: {
    label: { en: 'Molluscs', de: 'Weichtiere' },
    words: ['squid', 'oyster', 'mussel', 'clam'],
    stems: ['tintenfisch', 'kalmar', 'auster', 'muschel'],
  },
};

// Names you can use in `contains` and `mayContain`, in English or German.
const aliases: Record<string, string> = {
  'cereals containing gluten': 'gluten',
  'glutenhaltiges getreide': 'gluten',
  weizen: 'wheat',
  egg: 'eggs',
  eier: 'eggs',
  ei: 'eggs',
  soya: 'soy',
  soja: 'soy',
  soybeans: 'soy',
  milch: 'milk',
  peanut: 'peanuts',
  'erdnüsse': 'peanuts',
  'tree nuts': 'nuts',
  'schalenfrüchte': 'nuts',
  fisch: 'fish',
  krebstiere: 'crustaceans',
  sellerie: 'celery',
  senf: 'mustard',
  sesam: 'sesame',
  sulfites: 'sulphites',
  sulfite: 'sulphites',
  lupine: 'lupin',
  lupinen: 'lupin',
  weichtiere: 'molluscs',
};

function lookup(name: string): Allergen | undefined {
  const key = name.toLowerCase();
  return allergens[aliases[key] ?? key];
}

// "Milk" → "Milch" on German pages. Unknown names are shown as written.
export function allergenName(name: string, lang: Lang): string {
  return lookup(name)?.label[lang] ?? name;
}

export interface Segment {
  text: string;
  allergen: boolean;
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const longestFirst = (a: string, b: string) => b.length - a.length;

// Splits an ingredient into plain and allergen parts, for the allergens the
// chip is listed as containing.
export function highlight(ingredient: string, contains: string[]): Segment[] {
  const found = contains.map((name) => lookup(name) ?? { words: [name.toLowerCase()], stems: [] });
  const words = [...new Set(found.flatMap((a) => a.words))].sort(longestFirst).map(escape);
  const stems = [...new Set(found.flatMap((a) => a.stems ?? []))].sort(longestFirst).map(escape);
  const parts = [
    // Unicode-aware word boundaries, so "cheese" in "Cheese Powder" matches but "nut" in "nutmeg" does not.
    ...(words.length ? [`(?<![\\p{L}\\p{N}])(?:${words.join('|')})(?![\\p{L}\\p{N}])`] : []),
    ...(stems.length ? [`(?:${stems.join('|')})`] : []),
  ];
  if (parts.length === 0) return [{ text: ingredient, allergen: false }];
  const pattern = new RegExp(`(${parts.join('|')})`, 'giu');
  // split() with a capture group alternates plain text and matches.
  return ingredient
    .split(pattern)
    .map((text, i) => ({ text, allergen: i % 2 === 1 }))
    .filter((segment) => segment.text !== '');
}
