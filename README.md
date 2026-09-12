<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e6e3433e-6362-4d70-9b85-2377fce00f85

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Live Internet Data

SMART TIME now has a server-side live-data layer:

- Gold/silver: Gold API (`https://api.gold-api.com`) — real-time endpoints without an API key.
- FX: Frankfurter / Central-bank-backed exchange-rate data.
- Crypto: CoinGecko simple-price endpoint.
- News: GNews; set `GNEWS_API_KEY` in the server environment.
- Football: API-Football; set `API_FOOTBALL_KEY` in the server environment.

Refresh cadence:
- Market: 60 seconds
- News: 5 minutes
- Live football: 15 seconds

The UI keeps its existing mock data as a graceful fallback when a provider is unavailable or not configured. API keys are server-side only and are never placed in browser code.


## Live V6
- Live weather via Open-Meteo with city geocoding.
- Weather ticker and modal show temperature, condition, humidity, wind speed, source and last update.
- Weather refreshes every 10 minutes; no API key is required by the app.

## V7 — Income & Bank Certificates
- Added monthly income records: salary, bonuses, and other income.
- Added bank certificate records with bank name, optional certificate number, duration, value, issue date, maturity date, profit date, profit amount, and profit frequency.
- Monthly total income is calculated as: salary + bonuses + other income + certificate profits.
- Added financial reports with Excel-compatible, Word-compatible, CSV export and print/PDF workflow.
- Income and bank certificates are included in the full JSON backup/restore.

## SMART TIME V8 — Real Services Foundation
V8 introduces a real server-side foundation using SQLite (`data/smart-time.db`) for persistent service state, API cache, future accounts/chat tables, and transport quote history.

### Service status
`GET /api/services/status` returns one of: `LIVE`, `OFFLINE`, `FALLBACK`, `NOT_CONFIGURED` for each service.

### Transport pricing policy
Until an official provider fare API is configured, transport prices are explicitly returned as `FALLBACK` estimates. SMART TIME no longer labels internal estimates as live provider fares.

### Secrets
Keep API keys in server `.env` variables only. Do not put secrets in `VITE_*` variables or frontend source code.
