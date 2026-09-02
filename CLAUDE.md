# Cadence

Code progress tracker, visualizes GitHub commits via GraphQL API.

## Structure
- `api/_lib.js`: shared `ghGraphQL` helper + `CACHE` header constant
- `api/stats.js`: total30, streak, bestDay, daily map, perRepo (365-day window)
- `api/heatmap.js`: 365-day {date: count} map
- `api/projects.js`: repos sorted by commits30; journal uses `defaultBranchRef.target.history.totalCount` (not contribution graph, which inflates from history rewrites)
- `web/index.html`: dashboard (Chart.js, vanilla JS)

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

## App icon

`Sources/Assets.xcassets/AppIcon.appiconset`, generated from `icon.svg` 2026-08-30, cadence had
no asset catalog at all before that, so both targets built with no icon. Both targets set
`ASSETCATALOG_COMPILER_APPICON_NAME`; on macOS that setting is what wires the catalog up at all.
The universal 1024 is flattened (iOS rejects alpha); the ten `mac_*.png` idiom sizes exist because
macOS gets no icon from a universal entry.

Regenerate with `rsvg-convert -w 1024 -h 1024`, the explicit size is required, or rsvg uses the
SVG's intrinsic size and the art lands small on a 1024 canvas.
