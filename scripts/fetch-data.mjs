// Downloads inflation series from FRED (Federal Reserve Bank of St. Louis)
// and writes public/data/inflation.json with year-over-year % changes.
//
// With FRED_API_KEY set, it uses the official FRED API. Without a key it uses
// FRED's public CSV download endpoint, which needs no account.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SERIES, PRICES, PRICE_YEARS } from '../src/series.js';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/data/inflation.json');
const API_KEY = process.env.FRED_API_KEY;

// Enough history for the 12-month window plus the 12 months before it.
const start = new Date();
start.setUTCMonth(start.getUTCMonth() - 36);
const isoMonth = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
const START = isoMonth(start);

// Average prices cover a longer window, plus one spare year.
const priceStart = new Date();
priceStart.setUTCFullYear(priceStart.getUTCFullYear() - PRICE_YEARS - 1);
const PRICE_START = isoMonth(priceStart);

async function get(url) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'inflation-dash' } });
    if (res.ok) return res;
    if (attempt >= 4) throw new Error(`${res.status} ${res.statusText} for ${url.replace(/api_key=[^&]+/, 'api_key=***')}`);
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
  }
}

async function observations(id, from = START) {
  if (API_KEY) {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${API_KEY}&file_type=json&observation_start=${from}`;
    const json = await (await get(url)).json();
    return json.observations.map((o) => ({ date: o.date, value: Number(o.value) }));
  }
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}&cosd=${from}`;
  const lines = (await (await get(url)).text()).trim().split(/\r?\n/).slice(1);
  return lines.map((line) => {
    const [date, value] = line.split(',');
    return { date, value: Number(value) };
  });
}

function withYoY(obs) {
  const byDate = new Map(obs.map((o) => [o.date, o.value]));
  return obs
    .filter((o) => Number.isFinite(o.value) && o.value > 0)
    .map(({ date, value }) => {
      const prior = byDate.get(`${Number(date.slice(0, 4)) - 1}${date.slice(4)}`);
      const yoy = prior > 0 ? Math.round((value / prior - 1) * 10000) / 100 : null;
      return { date, value, yoy };
    })
    .filter((o) => o.yoy !== null);
}

const series = {};
for (const s of SERIES) {
  const points = withYoY(await observations(s.id));
  if (!points.length) throw new Error(`No year-over-year data for ${s.id}`);
  series[s.id] = points;
  console.log(`${s.id.padEnd(9)} ${points.length} months, latest ${points.at(-1).date}: ${points.at(-1).yoy}%`);
}

// Average prices stay as dollar values. Months FRED reports as missing are dropped.
const prices = {};
for (const s of PRICES) {
  const points = (await observations(s.id, PRICE_START)).filter((o) => Number.isFinite(o.value) && o.value > 0);
  if (!points.length) throw new Error(`No price data for ${s.id}`);
  prices[s.id] = points;
  console.log(`${s.id.padEnd(13)} ${points.length} months, latest ${points.at(-1).date}: $${points.at(-1).value}`);
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify({ updated: new Date().toISOString(), source: 'FRED, Federal Reserve Bank of St. Louis', series, prices }, null, 1));
console.log(`Wrote ${OUT}`);
