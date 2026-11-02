import type { Chip } from './chips';

// Whether a chip is vegetarian and vegan. A `diet` field in the chip's
// frontmatter sets it by hand; otherwise it is worked out from the ingredient
// lists (the English one and, if there is one, the German one). Anything that
// could go either way (cheese made with animal rennet, flavourings, some
// additives, a word that only looks like an animal ingredient) makes the
// answer "unknown" rather than a guess.
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
  | 'spelling'
  | 'noIngredients';

export interface Diet {
  vegetarian: Status;
  vegan: Status;
  // Why each answer is "no" or "unknown"; empty for "yes".
  vegetarianReasons: Reason[];
  veganReasons: Reason[];
  // True when the answer was set by hand rather than worked out.
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

type Category = Exclude<Reason, 'spelling' | 'noIngredients'>;

// What points to each category. Everything is compared after `normalize()`,
// so write it in lower case without accents (käse → kase, ß → ss).
// `words` match a whole word, also in the plural (egg → eggs, cheeses) and,
// for words of 5 letters or more, with one typo (chese, flavoring). Several
// words match as a phrase. `parts` also match inside a word, for German
// compounds like Magermilchpulver or Hähnchenfleisch.
// Cheese and whey (`rennet`) also count as milk, so a cheese is never vegan.
const rules: Record<Category, { words: string[]; parts?: string[]; except?: string[] }> = {
  animal: {
    words: [
      'meat', 'beef', 'pork', 'chicken', 'turkey', 'poultry', 'lamb', 'mutton', 'veal', 'duck', 'bacon', 'ham',
      'lard', 'tallow', 'dripping', 'suet', 'gelatine', 'gelatin', 'collagen', 'animal fat', 'bone', 'broth',
      'fish', 'anchovy', 'anchovies', 'tuna', 'salmon', 'shrimp', 'prawn', 'crab', 'lobster', 'squid', 'octopus',
      'oyster', 'mussel', 'clam', 'scallop', 'bonito', 'katsuobushi', 'dashi', 'carmine', 'cochineal',
      'e120', 'e441', 'e542', 'animal rennet', 'worcester', 'worcestershire',
      // German, French, Dutch, Spanish, Italian
      'rind', 'pute', 'lab', 'tierisches lab', 'viande', 'poulet', 'boeuf', 'porc', 'poisson', 'vlees', 'kip',
      'vis', 'carne', 'pollo', 'pescado', 'pesce', 'manzo', 'maiale',
    ],
    parts: [
      'fleisch', 'huhn', 'huhner', 'hahnchen', 'rinder', 'schwein', 'speck', 'schinken', 'schmalz', 'talg',
      'gelatine', 'fisch', 'sardelle', 'garnele', 'krabbe', 'karmin', 'knochen',
    ],
    // Hühnerei is egg, not chicken.
    except: ['huhnerei'],
  },
  milk: {
    words: [
      'milk', 'cream', 'butter', 'buttermilk', 'ghee', 'lactose', 'casein', 'caseinate', 'yoghurt', 'yogurt',
      'dairy', 'curd', 'kefir', 'skimmed', 'milk solids', 'e966',
      // Abbreviations: skimmed and whole milk powder
      'smp', 'wmp',
      'lait', 'beurre', 'creme', 'melk', 'boter', 'leche', 'mantequilla', 'nata', 'latte', 'burro', 'panna',
    ],
    parts: ['milch', 'sahne', 'rahm', 'butter', 'joghurt', 'laktose', 'lactose', 'kasein', 'quark', 'buttermilch'],
  },
  egg: {
    words: ['egg', 'albumen', 'albumin', 'lysozyme', 'e1105', 'mayonnaise', 'ei', 'eier', 'oeuf', 'huevo', 'uovo'],
    parts: ['eigelb', 'eiklar', 'eiweisspulver', 'vollei', 'eipulver', 'huhnerei', 'mayonnaise'],
  },
  honey: { words: ['honey', 'royal jelly', 'propolis', 'miel', 'honing', 'miele'], parts: ['honig'] },
  animalProduct: {
    words: ['beeswax', 'shellac', 'lanolin', 'e901', 'e904', 'e913'],
    parts: ['bienenwachs', 'schellack'],
  },
  rennet: {
    words: [
      'cheese', 'whey', 'rennet', 'mascarpone', 'parmesan', 'parmigiano', 'grana padano', 'pecorino', 'cheddar',
      'gouda', 'emmental', 'emmentaler', 'mozzarella', 'romano',
      // Whey protein concentrate
      'wpc',
      'fromage', 'lactoserum', 'kaas', 'wei', 'queso', 'suero', 'formaggio', 'siero',
    ],
    parts: ['kase', 'molke'],
  },
  flavouring: {
    words: [
      'flavouring', 'flavoring', 'flavour', 'flavor', 'aroma', 'arome', 'aromi', 'aromas',
      // Abbreviations seen on packs
      'flav', 'flavg', 'flvr', 'flavoured', 'flavored',
    ],
    parts: ['aromen', 'aromastoff', 'aromaextrakt', 'raucharoma', 'butteraroma', 'kasearoma'],
  },
  additive: {
    words: [
      'mono and diglycerides', 'monoglycerides', 'diglycerides', 'e471', 'e472', 'e631', 'e635', 'inosinate',
      'e920', 'cysteine', 'l cysteine', 'vitamin d3', 'e1518', 'stearic acid', 'e570',
    ],
    parts: ['inosinat', 'glyceride'],
  },
};

// Plant-based names and wording that contain one of the words above, removed
// before matching ("cocoa butter", "Kokosmilch", "Milchsäure" = lactic acid).
// `qualifiers` remove the word right after them: "vegan cheese", "plant based
// milk", "vegetable fat"; `free` removes the word before: "dairy free".
const plantPhrases = [
  'cocoa butter', 'shea butter', 'peanut butter', 'nut butter', 'butternut', 'butter bean', 'butter beans',
  'coconut milk', 'coconut cream', 'oat milk', 'soy milk', 'soya milk', 'rice milk', 'almond milk',
  'cream of tartar', 'milk thistle', 'eggplant', 'egg plant', 'cream soda', 'bean curd', 'lactic acid',
  'flavour enhancer', 'flavor enhancer', 'flavour enhancers', 'flavor enhancers', 'potato flavour',
  'no artificial flavours', 'no artificial flavors', 'free from',
];
// Allergen warnings sometimes copied into the list; everything after them goes.
const warnings = ['may contain', 'can contain', 'kann spuren', 'kann enthalten', 'peut contenir', 'kan sporen'];
const plantParts = [
  'kakaobutter', 'sheabutter', 'erdnussbutter', 'kokosmilch', 'hafermilch', 'sojamilch', 'mandelmilch',
  'reismilch', 'milchsaure', 'lactat', 'laktat', 'geschmacksverstarker', 'kokosnusscreme',
];
const qualifiers = ['vegan', 'vegetarian', 'plant based', 'plant', 'vegetable', 'non dairy', 'pflanzlich', 'pflanzliche', 'pflanzlicher', 'pflanzliches'];
// Rennet that makes cheese vegetarian; when named, cheese and whey are no longer unclear.
const vegetarianRennet = ['microbial rennet', 'vegetarian rennet', 'vegetable rennet', 'non animal rennet', 'mikrobielles lab', 'mikrobiellem lab'];

// Real ingredients one typo away from a word above, never treated as a typo.
const lookalikes = new Set([
  'button', 'batter', 'butters', 'better', 'wheat', 'cheesy', 'creamy', 'flavours', 'flavors', 'aromatic',
  'chickpea', 'chickpeas', 'cracker', 'crackers', 'gelling', 'cellulose', 'mullet', 'salmonella', 'turmeric',
  'cumin', 'clams', 'honeydew', 'rapeseed', 'yeast', 'malt', 'maltodextrin', 'buttery', 'curds', 'cream',
  'milled', 'cheeses', 'muttons', 'lambs', 'emulsifier', 'emulsifiers', 'mango', 'crepe', 'bitter', 'butler',
  'kafir', 'daily', 'aromat',
]);

// Lower case, without accents, E numbers as "e471" whatever the spelling
// (E 471, E-471, INS 471, E471(i)), punctuation and "&" as spaces.
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/(?<![\p{L}\p{N}])(?:e|ins)\s*[-.]?\s*(\d{3,4})(?:\s*[a-f])?(?:\s*\(\s*[ivx]+\s*\))?(?![\p{N}])/gu, ' e$1 ')
    .replace(/&|\+/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

// "eggs" → "egg", "cheeses" → "cheese", "anchovies" → "anchovy".
function singular(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && /(?:ches|shes|sses|xes)$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

// Edit distance with swapped letters counted as one edit, stopping early
// once it exceeds `max`.
function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows = [Array.from({ length: b.length + 1 }, (_, j) => j)];
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(rows[i - 1]![j]! + 1, row[j - 1]! + 1, rows[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) row[j] = Math.min(row[j]!, rows[i - 2]![j - 2]! + 1);
    }
    if (Math.min(...row) > max) return max + 1;
    rows.push(row);
  }
  return rows[a.length]![b.length]!;
}

// "chese" for cheese, "flavourng" for flavouring, "mlik" for milk: one edit
// for words of 5+ letters, two for 9+, and only swapped letters for 4.
const sorted = (word: string) => [...word].sort().join('');
function isTypo(word: string, known: string): boolean {
  if (known.length === 4) return word.length === 4 && sorted(word) === sorted(known) && distance(word, known, 1) === 1;
  const max = known.length >= 9 ? 2 : 1;
  return known.length >= 5 && distance(word, known, max) <= max;
}

const phraseText = (phrases: string[]) => phrases.map((phrase) => normalize(phrase));
const removePhrases = new RegExp(`(?<= |^)(?:${phraseText(plantPhrases).join('|')})(?= |$)`, 'g');
const removeQualified = new RegExp(
  `(?<= |^)(?:(?:${phraseText(qualifiers).join('|')}) [a-z0-9]+|[a-z0-9]+ free|non [a-z0-9]+)(?= |$)`,
  'g',
);
const cutWarnings = new RegExp(`(?<= |^)(?:${phraseText(warnings).join('|')}) .*$`);
const categories = Object.entries(rules).map(([category, { words, parts = [], except = [] }]) => {
  const all = words.map(normalize);
  return {
    category: category as Category,
    words: new Set(all.filter((word) => !word.includes(' '))),
    phrases: all.filter((word) => word.includes(' ')),
    parts: parts.map(normalize),
    except: [...plantParts, ...except],
  };
});
const allWords = new Set(categories.flatMap(({ words }) => [...words]));

export interface Guess {
  word: string;
  like: string;
  category: Category;
}

// What an ingredient list contains: the categories found for sure, and words
// that only look like one (a likely typo) for the build to warn about.
export function dietReasons(lists: string[][]): { found: Category[]; guesses: Guess[]; vegetarianRennet: boolean } {
  const found = new Set<Category>();
  const guesses: Guess[] = [];
  const texts = lists.flat().map(normalize);
  const vegRennet = texts.some((text) => vegetarianRennet.some((phrase) => text.includes(normalize(phrase))));
  for (const original of texts) {
    const text = original.replace(cutWarnings, ' ').replace(removePhrases, ' ').replace(removeQualified, ' ').replace(/ +/g, ' ').trim();
    const padded = ` ${text} `;
    const words = text.split(' ').filter(Boolean);
    for (const { category, words: exact, phrases, parts, except } of categories) {
      const hit =
        phrases.some((phrase) => padded.includes(` ${phrase} `)) ||
        words.some((word) => {
          if (exact.has(word) || exact.has(singular(word))) return true;
          const stripped = except.reduce((rest, plant) => rest.replace(plant, ' '), word);
          return parts.some((part) => stripped.includes(part));
        });
      if (hit) found.add(category);
    }
    // Typos: a word close to a known word (see isTypo) that isn't a known
    // word or lookalike itself.
    for (const word of words) {
      if (word.length < 4 || /\d/.test(word) || allWords.has(word) || allWords.has(singular(word)) || lookalikes.has(word)) continue;
      for (const { category, words: exact } of categories) {
        const like = [...exact].find((known) => isTypo(singular(word), known));
        if (like && !found.has(category)) guesses.push({ word, like, category });
      }
    }
  }
  if (found.has('rennet')) found.add('milk');
  if (vegRennet) found.delete('rennet');
  const order = Object.keys(rules) as Category[];
  return { found: order.filter((category) => found.has(category)), guesses, vegetarianRennet: vegRennet };
}

const notVegetarian: Reason[] = ['animal'];
const notVegan: Reason[] = ['animal', 'milk', 'egg', 'honey', 'animalProduct'];
const unclear: Reason[] = ['rennet', 'flavouring', 'additive', 'spelling', 'noIngredients'];
// A typo for one of these leaves vegetarian unclear too, not just vegan.
const affectsVegetarian: Category[] = ['animal', 'rennet', 'flavouring', 'additive'];

function status(reasons: Reason[], no: Reason[]): { status: Status; reasons: Reason[] } {
  const blocking = reasons.filter((reason) => no.includes(reason));
  if (blocking.length > 0) return { status: 'no', reasons: blocking };
  const unsure = [...new Set(reasons.filter((reason) => unclear.includes(reason)))];
  if (unsure.length > 0) return { status: 'unknown', reasons: unsure };
  return { status: 'yes', reasons: [] };
}

// The `diet` frontmatter field: a shorthand or the long form.
export type DeclaredDiet =
  | 'vegan'
  | 'vegetarian'
  | 'not-vegetarian'
  | { vegetarian?: boolean; vegan?: boolean; source?: { name: string; url?: string } };

function expand(declared: DeclaredDiet) {
  if (declared === 'vegan') return { vegetarian: true, vegan: true };
  if (declared === 'vegetarian') return { vegetarian: true };
  if (declared === 'not-vegetarian') return { vegetarian: false, vegan: false };
  return {
    vegetarian: declared.vegetarian ?? (declared.vegan ? true : undefined),
    vegan: declared.vegan ?? (declared.vegetarian === false ? false : undefined),
    source: declared.source,
  };
}

// Each page build looks the chips up again, so warn about each problem once.
const warned = new Set<string>();
function warn(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[diet] ${message}`);
}

// `otherLists` are the chip's translated ingredient lists, checked as well.
export function chipDiet(chip: Chip, otherLists: string[][] = []): Diet {
  const { ingredients, diet: declared } = chip.data;
  const where = `src/content/chips/${chip.id}.md`;
  const lists = [...(ingredients ? [ingredients.list] : []), ...otherLists];
  const { found, guesses } = lists.length > 0 ? dietReasons(lists) : { found: [], guesses: [] };
  for (const guess of guesses) {
    warn(`${where}: "${guess.word}" looks like "${guess.like}", so the diet is shown as unclear. Fix the spelling or set \`diet\` by hand.`);
  }
  const base: Reason[] = lists.length > 0 ? found : ['noIngredients'];
  const vegetarian = status(
    [...base, ...(guesses.some((guess) => affectsVegetarian.includes(guess.category)) ? ['spelling' as const] : [])],
    notVegetarian,
  );
  // Rennet only leaves vegetarian unclear; for vegan the milk already decides.
  const vegan = status([...base.filter((reason) => reason !== 'rennet'), ...(guesses.length ? ['spelling' as const] : [])], notVegan);
  const result: Diet = {
    vegetarian: vegetarian.status,
    vegan: vegan.status,
    vegetarianReasons: vegetarian.reasons,
    veganReasons: vegan.reasons,
    declared: false,
  };
  if (!declared) return result;

  // Set by hand: that wins. If the ingredients clearly say otherwise, warn in
  // the build log, since the list or the tag is probably wrong.
  const manual = expand(declared);
  for (const key of ['vegetarian', 'vegan'] as const) {
    const value = manual[key];
    if (value === undefined) continue;
    if (value && result[key] === 'no') {
      warn(`${where}: diet says ${key}, but the ingredients say no (${result[`${key}Reasons`].join(', ')}).`);
    }
    result[key] = value ? 'yes' : 'no';
    result[`${key}Reasons`] = value ? [] : result[`${key}Reasons`].filter((reason) => !unclear.includes(reason));
    result.declared = true;
  }
  result.source = manual.source;
  return result;
}
