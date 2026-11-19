import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { HEADLINE, CPI_CATEGORIES, PRICES, PRICE_YEARS } from './series.js';
import { ICONS } from './icons.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const monthFmt = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const fmtMonth = (iso) => monthFmt.format(new Date(`${iso}T00:00:00Z`));
const fmtPct = (v) => (v == null ? '–' : `${v.toFixed(1)}%`);
const fmtUsd = (v) => (v == null ? '–' : `$${v.toFixed(2)}`);

// The `count` calendar months ending with the newest month any series has.
function lastMonths(series, count) {
  const latest = Object.values(series)
    .map((pts) => pts.at(-1)?.date)
    .filter(Boolean)
    .sort()
    .at(-1);
  const end = new Date(`${latest}T00:00:00Z`);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - count + 1 + i, 1));
    return d.toISOString().slice(0, 10);
  });
}
const lastTwelveMonths = (series) => lastMonths(series, 12);

function valuesFor(points, months, field = 'yoy') {
  const byDate = new Map((points ?? []).map((p) => [p.date, p[field]]));
  return months.map((m) => byDate.get(m) ?? null);
}

// Long windows label the x axis with a year every few Januaries.
function yearTicks(months, every) {
  return (_, i) => {
    const m = months[i];
    return m.endsWith('-01-01') && Number(m.slice(0, 4)) % every === 0 ? m.slice(0, 4) : null;
  };
}

function lineChart(canvas, months, datasets, { fmt = fmtPct, yTick = (v) => `${v}%`, xTick = null, legend = true } = {}) {
  const text = css('--text-secondary');
  const grid = css('--grid');
  const xTicks = xTick
    ? { color: text, maxRotation: 0, autoSkip: false, callback: xTick }
    : { color: text, maxRotation: 0, autoSkipPadding: 12 };
  return new Chart(canvas, {
    type: 'line',
    data: { labels: months.map(fmtMonth), datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      spanGaps: true,
      interaction: { mode: 'index', intersect: false },
      elements: {
        line: { borderWidth: 2, tension: 0.25 },
        point: { radius: 0, hoverRadius: 5, hitRadius: 12, hoverBorderWidth: 2, hoverBorderColor: css('--surface-1') },
      },
      scales: {
        x: { grid: { display: false }, border: { color: grid }, ticks: xTicks },
        y: {
          grid: { color: grid },
          border: { display: false },
          ticks: { color: text, callback: yTick },
        },
      },
      plugins: {
        legend: {
          display: legend,
          position: 'top',
          align: 'start',
          labels: { color: css('--text-primary'), usePointStyle: true, pointStyle: 'line', boxWidth: 24, padding: 14 },
        },
        tooltip: {
          itemSort: (a, b) => (b.raw ?? -Infinity) - (a.raw ?? -Infinity),
          callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}` },
        },
      },
    },
  });
}

let charts = [];

function render(data) {
  charts.forEach((c) => c.destroy());
  const months = lastTwelveMonths(data.series);

  const headlineSets = HEADLINE.map((s, i) => ({
    label: s.label,
    data: valuesFor(data.series[s.id], months),
    borderColor: css(`--series-${i + 1}`),
    backgroundColor: css(`--series-${i + 1}`),
  }));

  const categorySets = CPI_CATEGORIES.map((s, i) => ({
    label: s.label,
    data: valuesFor(data.series[s.id], months),
    borderColor: css(`--series-${i + 1}`),
    backgroundColor: css(`--series-${i + 1}`),
  }));
  categorySets.push({
    label: 'All items (CPI)',
    data: valuesFor(data.series.CPIAUCSL, months),
    borderColor: css('--reference'),
    backgroundColor: css('--reference'),
    borderDash: [6, 4],
  });

  charts = [
    lineChart(document.getElementById('headline-chart'), months, headlineSets),
    lineChart(document.getElementById('category-chart'), months, categorySets),
  ];

  if (data.prices) {
    const priceMonths = lastMonths(data.prices, PRICE_YEARS * 12);
    const priceSets = PRICES.map((s, i) => ({
      label: s.label,
      data: valuesFor(data.prices[s.id], priceMonths, 'value'),
      borderColor: css(`--series-${i + 1}`),
      backgroundColor: css(`--series-${i + 1}`),
    }));
    charts.push(
      lineChart(document.getElementById('price-chart'), priceMonths, priceSets, {
        fmt: fmtUsd,
        yTick: (v) => `$${v.toFixed(2)}`,
        xTick: yearTicks(priceMonths, document.getElementById('price-chart').clientWidth < 600 ? 5 : 2),
        legend: false,
      }),
    );
  }
}

function renderDefinitions() {
  document.getElementById('definitions').innerHTML = HEADLINE.map(
    (s, i) => `<div style="--swatch: var(--series-${i + 1})">
      <dt>${s.label} <span>· ${s.name}</span></dt>
      <dd>${s.definition}</dd>
    </div>`,
  ).join('');
}

// Table view of the category chart: first and last month of the window.
function renderTable(data) {
  const months = lastTwelveMonths(data.series);
  const [first, last] = [months[0], months.at(-1)];
  const rows = [
    ...CPI_CATEGORIES.map((s, i) => ({ ...s, swatch: `<span class="swatch" style="background: var(--series-${i + 1})"></span>` })),
    { id: 'CPIAUCSL', label: 'All items (CPI)', swatch: '<span class="swatch ref"></span>' },
  ].map((s) => {
    const [a, b] = valuesFor(data.series[s.id], [first, last]);
    return `<tr><td>${s.swatch}${s.label}</td><td>${fmtPct(a)}</td><td>${fmtPct(b)}</td></tr>`;
  });
  document.getElementById('category-table').innerHTML = `
    <thead><tr><th>Category</th><th>${fmtMonth(first)}</th><th>${fmtMonth(last)}</th></tr></thead>
    <tbody>${rows.join('')}</tbody>`;
}

// Item headers with an icon, the latest price and the change over the window,
// plus a table of yearly average prices below the chart.
function renderPrices(data) {
  if (!data.prices) return;
  const months = lastMonths(data.prices, PRICE_YEARS * 12);
  const inWindow = (id) => (data.prices[id] ?? []).filter((p) => p.date >= months[0]);

  document.getElementById('price-items').innerHTML = PRICES.map((s, i) => {
    const pts = inWindow(s.id);
    const [first, last] = [pts[0], pts.at(-1)];
    const change = first && last ? Math.round((last.value / first.value - 1) * 100) : null;
    const since = first ? first.date.slice(0, 4) : '';
    return `<li style="--swatch: var(--series-${i + 1})">
      <span class="icon-badge">${ICONS[s.icon]}</span>
      <div>
        <h3>${s.label}</h3>
        <p class="detail">${s.detail}</p>
        <p class="price">${fmtUsd(last?.value)}<span> ${last ? fmtMonth(last.date) : ''}</span></p>
        ${change == null ? '' : `<p class="detail">${change >= 0 ? '+' : ''}${change}% since ${since}</p>`}
      </div>
    </li>`;
  }).join('');

  // Average of the months available in each calendar year, newest year first.
  const years = [...new Set(months.map((m) => m.slice(0, 4)))].reverse();
  const [firstMonth, latestMonth] = [months[0], months.at(-1)];
  const monthName = (iso) => fmtMonth(iso).split(' ')[0];
  const rows = years.map((y) => {
    const cells = PRICES.map((s) => {
      const vals = inWindow(s.id).filter((p) => p.date.startsWith(y)).map((p) => p.value);
      return `<td>${vals.length ? fmtUsd(vals.reduce((a, b) => a + b, 0) / vals.length) : '–'}</td>`;
    });
    let label = y;
    if (latestMonth.startsWith(y) && !latestMonth.endsWith('-12-01')) label += ` <span class="muted">(through ${monthName(latestMonth)})</span>`;
    else if (firstMonth.startsWith(y) && !firstMonth.endsWith('-01-01')) label += ` <span class="muted">(from ${monthName(firstMonth)})</span>`;
    return `<tr><td>${label}</td>${cells.join('')}</tr>`;
  });
  const head = PRICES.map(
    (s, i) => `<th><span class="th-icon" style="color: var(--series-${i + 1})">${ICONS[s.icon]}</span>${s.label} <span class="muted">/ ${s.unit}</span></th>`,
  ).join('');
  document.getElementById('price-table').innerHTML = `
    <caption>Yearly average price</caption>
    <thead><tr><th>Year</th>${head}</tr></thead>
    <tbody>${rows.join('')}</tbody>`;
}

async function main() {
  renderDefinitions();
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/inflation.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    document.getElementById('updated').textContent = `Data fetched ${new Date(data.updated).toLocaleDateString()}.`;
    render(data);
    renderTable(data);
    renderPrices(data);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => render(data));
  } catch (err) {
    const el = document.getElementById('error');
    el.hidden = false;
    el.textContent = `Couldn't load data/inflation.json (${err.message}). Run "npm run fetch-data" first.`;
  }
}

main();
