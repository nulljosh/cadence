# Cadence API

Base URL: `https://cadence.heyitsmejosh.com`

Three read-only JSON endpoints over GitHub activity. No auth, no writes. Edge
cached for 5 minutes (`s-maxage=300, stale-while-revalidate=600`).

## `GET /api/stats`

```json
{
  "total30": 412,
  "activeProjects": 14,
  "bestDay": 39,
  "streak": 6,
  "daily": { "2026-08-27": 12 },
  "perRepo": { "epiphany": 88 }
}
```

`daily` is commit counts keyed by `YYYY-MM-DD`; `streak` counts consecutive days
with at least one commit, ending today.

## `GET /api/projects`

Array, sorted by 30-day commit count descending:

```json
[{ "name": "epiphany", "commits30": 88, "lastCommitAgo": "3h ago", "status": "active" }]
```

## `GET /api/heatmap`

Daily commit counts keyed by `YYYY-MM-DD`, for the contribution grid.

```bash
curl https://cadence.heyitsmejosh.com/api/stats
```

## WebMCP

With the dashboard open, cadence registers three read-only tools on
`document.modelContext` — `get_commit_stats`, `get_projects` (filter with
`status`, cap with `limit`) and `get_heatmap` — over the same routes.
Source: `web/webmcp.js`. Nothing here changes state, so no tool requires
confirmation.
