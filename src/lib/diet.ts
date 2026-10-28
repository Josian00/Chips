import type { Chip } from './chips';

// Whether a chip is vegetarian and vegan, worked out from its English
// ingredient list. Anything that could go either way (cheese made with
// animal rennet, flavourings, some additives) makes the answer "unknown"
// rather than a guess. A `diet` block in the chip's frontmatter can settle it
// from the pack's own label, but can't contradict the ingredient list.
export type Status = 'yes' | 'no' | 'unknown';

export type Reason =
  // Rules out vegetarian (and so vegan).
  | 'animal'
  // Rule out vegan.
  | 'milk'
  | 'egg'
  | 'honey'
  | 'animalProduct'
  // Leave vegetarian or vegan unclear.
  | 'rennet'
  | 'flavouring'
  | 'additive'
  | 'noIngredients';

export interface Diet {
  vegetarian: Status;
  vegan: Status;
  // Why each answer is "no" or "unknown"; empty for "yes".
  vegetarianReasons: Reason[];
  veganReasons: Reason[];
  // True when the answer comes from the frontmatter rather than the list.
  declared: boolean;
  source?: { name: string; url?: string };
}

// The tag a chip gets on cards and in the filter, if any.
export type Tag = 'vegan' | 'vegetarian';

export function dietTag(diet: Diet): Tag | undefined {
  if (diet.vegan === 'yes') return 'vegan';
  if (diet.vegetarian === 'yes') return 'vegetarian';
  return undefined;
}

// Words that point to each reason, matched as whole words in lower case.
// `rennet` words also count as milk, so a cheese is never vegan.
const rules: Record<Exclude<Reason, 'noIngredients'>, string[]> = {
  animal: [
    'meat', 'beef', 'pork', 'chicken', 'turkey', 'poultry', 'lamb', 'mutton', 'veal', 'duck', 'bacon', 'ham',
    'lard', 'tallow', 'dripping', 'suet', 'gelatine', 'gelatin', 'collagen', 'animal fat', 'bone',
    'fish', 'anchovy', 'anchovies', 'tuna', 'salmon', 'shrimp', 'shrimps', 'prawn', 'prawns', 'crab', 'lobster',
    'squid', 'octopus', 'oyster', 'oysters', 'mussel', 'mussels', 'clam', 'clams', 'scallop', 'scallops',
    'bonito', 'katsuobushi', 'dashi', 'carmine', 'cochineal', 'e120', 'e441', 'e542', 'animal rennet',
  ],
  milk: [
    'milk', 'cream', 'butter', 'buttermilk', 'ghee', 'lactose', 'casein', 'caseinate', 'yoghurt', 'yogurt',
    'dairy', 'curd', 'kefir', 'skimmed', 'e966',
  ],
  egg: ['egg', 'eggs', 'albumen', 'albumin', 'lysozyme', 'e1105', 'mayonnaise'],
  honey: ['honey', 'royal jelly', 'propolis'],
  animalProduct: ['beeswax', 'shellac', 'lanolin', 'e901', 'e904', 'e913'],
  rennet: [
    'cheese', 'cheeses', 'whey', 'rennet', 'mascarpone', 'parmesan', 'parmigiano', 'grana padano', 'pecorino',
    'cheddar', 'gouda', 'emmental', 'mozzarella', 'romano',
  ],
  flavouring: ['flavouring', 'flavourings', 'flavoring', 'flavorings', 'flavour', 'flavours', 'flavor', 'flavors', 'aroma'],
  additive: [
    'mono- and diglycerides', 'mono and diglycerides', 'e471', 'e472', 'e631', 'e635', 'inosinate', 'e920',
    'cysteine', 'l-cysteine', 'vitamin d3', 'e1518', 'stearic acid', 'e570',
  ],
};

// Plant-based names that contain an animal word, removed before matching.
const plantNames = [
  'cocoa butter', 'shea butter', 'peanut butter', 'nut butter', 'butternut', 'butter bean', 'butter beans',
  'coconut milk', 'coconut cream', 'oat milk', 'soy milk', 'soya milk', 'rice milk', 'almond milk',
  'cream of tartar', 'milk thistle', 'eggplant', 'egg plant', 'cream soda', 'bean curd',
  'vegetable mono- and diglycerides', 'natural vegetable flavou?rings?', 'flavou?r enhancers?',
  'potato flavou?r', 'no artificial flavou?rs?',
];

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordPattern = (words: string[]) =>
  new RegExp(`(?<![\\p{L}\\p{N}])(?:${words.map(escape).join('|')})(?![\\p{L}\\p{N}])`, 'iu');
const patterns = Object.entries(rules).map(([reason, words]) => [reason as Reason, wordPattern(words)] as const);
const plantPattern = new RegExp(`(?<![\\p{L}\\p{N}])(?:${plantNames.join('|')})(?![\\p{L}\\p{N}])`, 'giu');

// The reasons found in an ingredient list, in the order of `rules`.
export function dietReasons(list: string[]): Reason[] {
  const text = list.join('\n').replace(plantPattern, ' ');
  const found = patterns.filter(([, pattern]) => pattern.test(text)).map(([reason]) => reason);
  if (found.includes('rennet') && !found.includes('milk')) found.splice(found.indexOf('rennet'), 0, 'milk');
  return found;
}

const notVegetarian: Reason[] = ['animal'];
const notVegan: Reason[] = ['animal', 'milk', 'egg', 'honey', 'animalProduct'];
const unclear: Reason[] = ['rennet', 'flavouring', 'additive', 'noIngredients'];

function status(reasons: Reason[], no: Reason[]): { status: Status; reasons: Reason[] } {
  const blocking = reasons.filter((reason) => no.includes(reason));
  if (blocking.length > 0) return { status: 'no', reasons: blocking };
  const unsure = reasons.filter((reason) => unclear.includes(reason));
  if (unsure.length > 0) return { status: 'unknown', reasons: unsure };
  return { status: 'yes', reasons: [] };
}

export function chipDiet(chip: Chip): Diet {
  const { ingredients, diet: declared } = chip.data;
  const found = ingredients ? dietReasons(ingredients.list) : ['noIngredients' as const];
  // Rennet only leaves vegetarian unclear; for vegan the milk already decides.
  const vegetarian = status(found, notVegetarian);
  const vegan = status(
    found.filter((reason) => reason !== 'rennet'),
    notVegan,
  );
  const result: Diet = {
    vegetarian: vegetarian.status,
    vegan: vegan.status,
    vegetarianReasons: vegetarian.reasons,
    veganReasons: vegan.reasons,
    declared: false,
  };
  if (!declared) return result;

  // The pack's label settles what the list leaves open, but a "yes" that the
  // list contradicts is a mistake in one or the other, so fail the build.
  const claim = (key: 'vegetarian' | 'vegan', value: boolean | undefined) => {
    if (value === undefined) return;
    if (value && result[key] === 'no') {
      const why = result[`${key}Reasons`].join(', ');
      throw new Error(`src/content/chips/${chip.id}.md says diet.${key}: true, but its ingredients say no (${why}).`);
    }
    result[key] = value ? 'yes' : 'no';
    if (value) result[`${key}Reasons`] = [];
    result.declared = true;
  };
  claim('vegetarian', declared.vegetarian ?? (declared.vegan ? true : undefined));
  claim('vegan', declared.vegan ?? (declared.vegetarian === false ? false : undefined));
  result.source = declared.source;
  return result;
}
