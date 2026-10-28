import prices from '../data/prices.json';
import { defaultLang, locales, type Lang } from '../i18n/ui';
import type { LocalChip } from './chips';

// One price someone recorded on Open Prices; see scripts/update-prices.mjs.
export interface PricePoint {
  id: number;
  date: string;
  price: number;
  currency: string;
  store: string | null;
  city: string | null;
  country: string | null;
}

export interface PriceSummary {
  latest: PricePoint;
  low: number;
  high: number;
  // Oldest first, all in the latest price's currency.
  points: PricePoint[];
}

const tracked = prices as Record<string, { barcode: string; history: PricePoint[] } | undefined>;

export function priceSummary(chip: LocalChip): PriceSummary | undefined {
  const history = tracked[chip.id]?.history ?? [];
  const latest = history[0];
  if (!latest) return undefined;
  const points = history.filter((point) => point.currency === latest.currency).reverse();
  const values = points.map((point) => point.price);
  return { latest, low: Math.min(...values), high: Math.max(...values), points };
}

// "€2.75" in English, "2,75 €" in German.
export function formatPrice(amount: number, currency: string, lang: Lang = defaultLang): string {
  return new Intl.NumberFormat(locales[lang], { style: 'currency', currency }).format(amount);
}
