# Cadence

Code progress tracker — visualizes GitHub commits via GraphQL API.

## Structure
- `api/_lib.js` — shared `ghGraphQL` helper + `CACHE` header constant
- `api/stats.js` — total30, streak, bestDay, daily map, perRepo (365-day window)
- `api/heatmap.js` — 365-day {date: count} map
- `api/projects.js` — repos sorted by commits30
- `web/index.html` — dashboard (Chart.js, vanilla JS)

## Dev
```bash
open web/index.html   # static, fetches from live API
```

## Links
- GitHub: https://github.com/nulljosh/cadence
- Live: cadence.heyitsmejosh.com
- License: MIT 2026 Joshua Trommel

## Notes
- `api/` uses ES modules (`"type": "module"` in `api/package.json`)
- Files prefixed `_` in `api/` are shared modules, not Vercel endpoints
- Stats endpoint queries 365d for accurate streak; filters last 30d for total30
