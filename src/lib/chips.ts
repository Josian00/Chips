import { getCollection, type CollectionEntry } from 'astro:content';

export type Chip = CollectionEntry<'chips'>;

// All chips, newest review first.
export async function getChipsByDate(): Promise<Chip[]> {
  return (await getCollection('chips')).sort(
    (a, b) =>
      b.data.reviewed.valueOf() - a.data.reviewed.valueOf() || a.id.localeCompare(b.id),
  );
}

export function postTitle(chip: Chip): string {
  return chip.data.title ?? `${chip.data.brand} ${chip.data.name}`;
}

export function excerpt(chip: Chip): string {
  if (chip.data.excerpt) return chip.data.excerpt;
  const firstParagraph = (chip.body ?? '').trim().split(/\n\s*\n/)[0] ?? '';
  const text = firstParagraph.replace(/\s+/g, ' ').replace(/[*_`#>]/g, '');
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text;
}

export function readingMinutes(chip: Chip): number {
  const words = (chip.body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Other posts to suggest after `current`: same country or flavour first, then the newest.
export function suggestions(all: Chip[], current: Chip | undefined, count = 3): Chip[] {
  const others = all.filter((chip) => chip.id !== current?.id);
  if (!current) return others.slice(0, count);
  const related = (chip: Chip) =>
    Number(chip.data.country === current.data.country) +
    Number(chip.data.flavour === current.data.flavour);
  return others
    .map((chip, index) => ({ chip, index }))
    .sort((a, b) => related(b.chip) - related(a.chip) || a.index - b.index)
    .slice(0, count)
    .map(({ chip }) => chip);
}
