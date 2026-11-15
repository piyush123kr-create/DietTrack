# Protein & Carb Tracker

A single-file web app (`index.html`) to track daily protein, carbs and calories with Indian meal suggestions.

## Features
- Daily targets split across breakfast, lunch, snacks and dinner (plus fruits)
- Indian meal suggestions with quantity +/- and a tick-to-confirm checklist
- Custom foods by count (roti, cup, bowl) or by weight (g), with auto-filled nutrition
- Calendar/date picker, weight and BP log, calorie totals
- Water and steps tracking (manual, plus experimental phone step counting while the page is open)
- Health report tab: day score, vitals, focus for tomorrow, 7-day trend and an optional AI summary
- Optional AI suggestions and per-user accounts (see below)

## Run
Open `index.html` in a browser. Data is stored in `localStorage`.

## Test
```
npm install
npm test
```
Tests cover the nutrition database (reference ranges + kcal sanity), the calculation engine, the suggestion engine, the UI flows and the account sync logic.

## Notes
"Ask Claude" suggestions and per-user cloud accounts use the claude.ai artifact runtime (`window.claude`). Outside claude.ai (for example on GitHub Pages) they switch off automatically and the app runs in local-only mode.
Nutrition values are approximate for typical home-style servings and are not medical advice.
