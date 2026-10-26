// Refreshes src/data/prices.json from Open Prices (https://prices.openfoodfacts.org),
// a free, open database of shop prices that needs no API key.
//
// For every chip with a `barcode:` in its frontmatter, fetch the newest
// prices recorded for that barcode and merge them into the chip's history.
// Run by .github/workflows/prices.yml once a day; run locally with
// `npm run prices`.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

const CHIPS_DIR = 'src/content/chips';
const PRICES_FILE = 'src/data/prices.json';
const API = 'https://prices.openfoodfacts.org/api/v1/prices';
// Keep the newest entries per chip so the file stays small.
const MAX_HISTORY = 100;

function barcodeOf(markdown) {
  const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  return frontmatter.match(/^barcode:\s*["']?(\d{8,14})["']?\s*$/m)?.[1];
}

async function fetchPrices(barcode) {
  const query = new URLSearchParams({ product_code: barcode, order_by: '-date', size: '50' });
  const response = await fetch(`${API}?${query}`, {
    headers: { 'User-Agent': 'ChipsBlog price tracker (https://github.com/Josian00/Chips)' },
  });
  if (!response.ok) throw new Error(`Open Prices returned ${response.status} for ${barcode}`);
  const { items = [] } = await response.json();
  return items.map((item) => ({
    id: item.id,
    date: item.date,
    price: Number(item.price),
    currency: item.currency,
    store: item.location?.osm_name ?? item.location?.website_url ?? null,
    city: item.location?.osm_address_city ?? null,
    country: item.location?.osm_address_country ?? null,
  }));
}

const prices = JSON.parse(await readFile(PRICES_FILE, 'utf8'));
let failures = 0;

for (const file of (await readdir(CHIPS_DIR)).filter((name) => name.endsWith('.md'))) {
  const id = basename(file, '.md');
  const barcode = barcodeOf(await readFile(join(CHIPS_DIR, file), 'utf8'));
  if (!barcode) continue;
  try {
    const known = new Map((prices[id]?.history ?? []).map((entry) => [entry.id, entry]));
    for (const entry of await fetchPrices(barcode)) known.set(entry.id, entry);
    const history = [...known.values()]
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
      .slice(0, MAX_HISTORY);
    prices[id] = { barcode, history };
    console.log(`${id}: ${history.length} prices`);
  } catch (error) {
    failures++;
    console.error(`${id}: ${error.message}`);
  }
}

const sorted = Object.fromEntries(Object.entries(prices).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(PRICES_FILE, `${JSON.stringify(sorted, null, 2)}\n`);
if (failures) process.exitCode = 1;
