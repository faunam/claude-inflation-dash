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
import { HEADLINE, CPI_CATEGORIES } from './series.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const monthFmt = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const fmtMonth = (iso) => monthFmt.format(new Date(`${iso}T00:00:00Z`));
const fmtPct = (v) => (v == null ? '–' : `${v.toFixed(1)}%`);

// The 12 calendar months ending with the newest month any series has.
function lastTwelveMonths(series) {
  const latest = Object.values(series)
    .map((pts) => pts.at(-1)?.date)
    .filter(Boolean)
    .sort()
    .at(-1);
  const end = new Date(`${latest}T00:00:00Z`);
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 11 + i, 1));
    return d.toISOString().slice(0, 10);
  });
}

function valuesFor(points, months) {
  const byDate = new Map(points.map((p) => [p.date, p.yoy]));
  return months.map((m) => byDate.get(m) ?? null);
}

function lineChart(canvas, months, datasets) {
  const text = css('--text-secondary');
  const grid = css('--grid');
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
        x: { grid: { display: false }, border: { color: grid }, ticks: { color: text, maxRotation: 0, autoSkipPadding: 12 } },
        y: {
          grid: { color: grid },
          border: { display: false },
          ticks: { color: text, callback: (v) => `${v}%` },
        },
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'start',
          labels: { color: css('--text-primary'), usePointStyle: true, pointStyle: 'line', boxWidth: 24, padding: 14 },
        },
        tooltip: {
          itemSort: (a, b) => (b.raw ?? -Infinity) - (a.raw ?? -Infinity),
          callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${fmtPct(ctx.raw)}` },
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

async function main() {
  renderDefinitions();
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/inflation.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    document.getElementById('updated').textContent = `Data fetched ${new Date(data.updated).toLocaleDateString()}.`;
    render(data);
    renderTable(data);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => render(data));
  } catch (err) {
    const el = document.getElementById('error');
    el.hidden = false;
    el.textContent = `Couldn't load data/inflation.json (${err.message}). Run "npm run fetch-data" first.`;
  }
}

main();
