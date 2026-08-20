# Cadence Technical Whitepaper

**v1.0.2** | August 2026

Cadence turns GitHub commit history into a progress signal: how much you shipped,
how consistently, and where the work went. Live at
[cadence.heyitsmejosh.com](https://cadence.heyitsmejosh.com), with SwiftUI apps for
iOS and macOS on the same API.

## Problem

GitHub's own contribution graph answers "did you commit today" and nothing else. It
does not tell you which project absorbed the month, whether the streak is real work
or one-line touches, or what your best day actually looked like. Cadence computes
those from the raw commit stream.

## Data model

One source: the GitHub GraphQL API (`contributionsCollection`), fetched with a
personal access token held server side. A single query returns 365 days of daily
contribution counts plus per-repository commit totals, which is enough to derive
every metric without paginating the REST commits endpoint per repo.

Derived metrics:

- **total30** — commits in the trailing 30 days.
- **streak** — consecutive days with at least one commit, walking backward from today.
- **bestDay** — max daily count in the window, with its date.
- **daily** — `{date: count}` map, the heatmap source.
- **perRepo** — repositories ranked by commits in the trailing 30 days.

## API

| Endpoint | Returns |
|----------|---------|
| `GET /api/stats` | total30, streak, bestDay, daily map, perRepo |
| `GET /api/heatmap` | 365-day `{date: count}` map |
| `GET /api/projects` | repos sorted by commits in the last 30 days |

Serverless functions under `api/`. The token never reaches the client; the browser
and the native apps both talk only to these three endpoints, so all three clients
stay identical in behavior.

## Clients

| Platform | Stack | Notes |
|----------|-------|-------|
| Web | Vanilla JS + Chart.js | No build step, no framework |
| iOS | SwiftUI | Native charts, wired to the live API |
| macOS | SwiftUI | Same view models as iOS |

Hosting is Cloudflare Pages with the API functions alongside the static site.

## Design decisions

- **Server-side aggregation.** Metrics are computed once per request rather than in
  each client, so the web, iOS, and macOS numbers can never disagree.
- **No database.** GitHub is the system of record. Nothing is stored, so there is
  nothing to migrate, back up, or keep in sync.
- **One GraphQL call.** The contributions collection is the cheapest path to a year
  of history; the REST equivalent would be hundreds of requests.

## License

MIT 2026, Joshua Trommel
