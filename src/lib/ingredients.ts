// Words that point to each allergen inside an ingredient name, so they can be
// highlighted the way labels print them in bold. Keys are lower case.
const allergenWords: Record<string, string[]> = {
  milk: ['milk', 'whey', 'lactose', 'butter', 'cream', 'cheese', 'mascarpone', 'yoghurt', 'yogurt', 'dairy', 'casein'],
  soy: ['soy', 'soya', 'soybean'],
  soya: ['soy', 'soya', 'soybean'],
  wheat: ['wheat', 'spelt'],
  gluten: ['wheat', 'barley', 'rye', 'oat', 'oats', 'spelt', 'gluten'],
  'cereals containing gluten': ['wheat', 'barley', 'rye', 'oat', 'oats', 'spelt', 'gluten'],
  egg: ['egg', 'eggs'],
  eggs: ['egg', 'eggs'],
  peanuts: ['peanut', 'peanuts'],
  nuts: ['almond', 'hazelnut', 'walnut', 'cashew', 'pecan', 'pistachio', 'macadamia', 'nut', 'nuts'],
  sesame: ['sesame'],
  mustard: ['mustard'],
  celery: ['celery', 'celeriac'],
  fish: ['fish', 'anchovy'],
  crustaceans: ['shrimp', 'prawn', 'crab', 'lobster'],
  molluscs: ['squid', 'oyster', 'mussel', 'clam'],
  sulphites: ['sulphite', 'sulfite', 'sulphur dioxide', 'sulfur dioxide'],
  lupin: ['lupin'],
};

export interface Segment {
  text: string;
  allergen: boolean;
}

// Splits an ingredient into plain and allergen parts, for the allergens the
// chip is listed as containing.
export function highlight(ingredient: string, contains: string[]): Segment[] {
  const words = [...new Set(contains.flatMap((name) => allergenWords[name.toLowerCase()] ?? [name]))];
  if (words.length === 0) return [{ text: ingredient, allergen: false }];
  const escaped = words.sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  // split() with a capture group alternates plain text and matches.
  return ingredient
    .split(pattern)
    .map((text, i) => ({ text, allergen: i % 2 === 1 }))
    .filter((segment) => segment.text !== '');
}
