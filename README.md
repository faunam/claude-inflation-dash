# claude-inflation dash
testing claude by making a small dashboard to track inflation

[View live page here](https://faunam.github.io/claude-inflation-dash/)

Charts of year-over-year % price change by month, each shown for the past 12 months and the past 20 years:

1. **CPI, PCE and PPI**, with a short definition of each.
2. **CPI by category**: the eight major groups of the CPI basket (housing, transportation, food & beverages, medical care, education & communication, recreation, apparel, other), with overall CPI as a dashed reference line and a table of the first and last month.

Data comes from [FRED](https://fred.stlouisfed.org/) (Federal Reserve Bank of St. Louis). All series are monthly and seasonally adjusted. The series IDs live in [`src/series.js`](src/series.js).

## Stack

- [Vite](https://vite.dev/) for the dev server and build, with plain JavaScript (no framework).
- [Chart.js](https://www.chartjs.org/) for the line charts.
- A Node script (`scripts/fetch-data.mjs`) downloads the series and computes year-over-year change into `public/data/inflation.json`.
- A GitHub Action (`.github/workflows/deploy.yml`) runs that script daily and on every push to `main`, builds the site and deploys it to GitHub Pages. No API key ever reaches the browser.

## Run locally

```sh
npm install
npm run fetch-data   # downloads from FRED into public/data/inflation.json
npm run dev          # http://localhost:5173
```

`fetch-data` works without an account by using FRED's public CSV download. If `FRED_API_KEY` is set (free at https://fred.stlouisfed.org/docs/api/api_key.html) it uses the official API instead.

## Deploy to GitHub Pages

1. In the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.
2. Optional: add a `FRED_API_KEY` repository secret under **Settings → Secrets and variables → Actions**.
3. Push to `main`, or run the **Refresh data and deploy** workflow by hand.
