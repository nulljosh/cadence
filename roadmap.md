# Cadence roadmap

## Cloudflare migration — DONE 2026-08-17

Live at https://cadence.heyitsmejosh.com off Pages project `cadence` (`cadence-cm8.pages.dev`).
`/api/stats`, `/api/heatmap`, `/api/projects` all 200. Vercel project deleted.

Two bugs were in the way, neither the one this file predicted:
- `/api/projects` 500: GraphQL type mismatch, not a token/permission problem.
  `history(since:)` takes a `GitTimestamp`, but `$from` was declared `DateTime!`.
  One bad variable fails the whole query, so `data` came back empty and
  `data.user` threw. Fixed with a separate `$since: GitTimestamp!` variable.
- All three endpoints 500: `process.env.GITHUB_TOKEN` was always undefined.
  nodejs_compat only auto-populates `process.env` from compatibility_date
  2025-04-01 onward and this project is pinned to 2025-01-01, so assigning to
  it silently no-ops. `_adapter.js` now passes the binding via
  `globalThis.__ghToken`, which `api/_lib.js` prefers over `process.env`.

## Also recovered

`Sources/` holds a SwiftUI iOS + macOS app (`Cadence.xcodeproj`, `project.yml`) that
existed nowhere locally. Never built or verified this session — build it before
assuming it compiles.
