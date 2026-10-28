import { getCollection, type CollectionEntry } from 'astro:content';
import { defaultLang, locales, type Lang } from '../i18n/ui';
import { chipDiet, type Diet } from './diet';

export type Chip = CollectionEntry<'chips'>;

// A chip as shown in one language: the English facts with any translated
// text laid over them. `entry` is the Markdown entry whose body is the review
// (the English one when no translation exists yet, then `translated` is false).
export interface LocalChip {
  id: string;
  lang: Lang;
  data: Chip['data'];
  entry: CollectionEntry<'chips' | 'chipsDe'>;
  translated: boolean;
  ingredientsTranslated: boolean;
  // Vegetarian and vegan status, from the English ingredient list.
  diet: Diet;
}

async function translations(lang: Lang) {
  if (lang === 'de') return getCollection('chipsDe');
  return [];
}

// All chips in `lang`, newest review first.
export async function getChipsByDate(lang: Lang = defaultLang): Promise<LocalChip[]> {
  const chips = await getCollection('chips');
  const translated = new Map((await translations(lang)).map((entry) => [entry.id, entry]));
  for (const id of translated.keys()) {
    if (!chips.some((chip) => chip.id === id)) {
      throw new Error(`src/content/chips-${lang}/${id}.md has no matching src/content/chips/${id}.md`);
    }
  }
  return chips
    .map((chip): LocalChip => {
      const local = translated.get(chip.id);
      const text = local?.data;
      return {
        id: chip.id,
        lang,
        data: {
          ...chip.data,
          title: text?.title ?? chip.data.title,
          excerpt: local ? text?.excerpt : chip.data.excerpt,
          flavour: text?.flavour ?? chip.data.flavour,
          country: text?.country ?? chip.data.country,
          ingredients:
            chip.data.ingredients && text?.ingredients
              ? { ...chip.data.ingredients, list: text.ingredients }
              : chip.data.ingredients,
        },
        entry: local ?? chip,
        translated: lang === defaultLang || local !== undefined,
        ingredientsTranslated: text?.ingredients !== undefined && text.ingredientsTranslated,
        diet: chipDiet(chip),
      };
    })
    .sort((a, b) => b.data.reviewed.valueOf() - a.data.reviewed.valueOf() || a.id.localeCompare(b.id));
}

export function postTitle(chip: LocalChip): string {
  return chip.data.title ?? `${chip.data.brand} ${chip.data.name}`;
}

export function excerpt(chip: LocalChip): string {
  if (chip.data.excerpt) return chip.data.excerpt;
  const firstParagraph = (chip.entry.body ?? '').trim().split(/\n\s*\n/)[0] ?? '';
  const text = firstParagraph.replace(/\s+/g, ' ').replace(/[*_`#>]/g, '');
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text;
}

export function readingMinutes(chip: LocalChip): number {
  const words = (chip.entry.body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatDate(date: Date, lang: Lang = defaultLang): string {
  return date.toLocaleDateString(locales[lang], { day: 'numeric', month: 'long', year: 'numeric' });
}

// Other posts to suggest after `current`: same country or flavour first, then the newest.
export function suggestions(all: LocalChip[], current: LocalChip | undefined, count = 3): LocalChip[] {
  const others = all.filter((chip) => chip.id !== current?.id);
  if (!current) return others.slice(0, count);
  const related = (chip: LocalChip) =>
    Number(chip.data.country === current.data.country) +
    Number(chip.data.flavour === current.data.flavour);
  return others
    .map((chip, index) => ({ chip, index }))
    .sort((a, b) => related(b.chip) - related(a.chip) || a.index - b.index)
    .slice(0, count)
    .map(({ chip }) => chip);
}
