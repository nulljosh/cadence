# Cadence Technical Whitepaper

**v1.0.2** | August 2026

How much did you ship? GitHub's own graph won't tell you, so Cadence exists to
read your commits and answer directly: how much, how steadily, and where the
time went. Live at
[cadence.heyitsmejosh.com](https://cadence.heyitsmejosh.com), with SwiftUI apps for
iOS and macOS on the same API, so the answer looks the same wherever you check it.

## Problem

GitHub's own contribution graph answers "did you commit today" and nothing else. It
does not tell you which project absorbed the month, whether the streak is real work
or one-line touches, or what your best day actually looked like, and those are the
questions that actually matter for judging your own output. Cadence computes
those from the raw commit stream instead of settling for a green square.

## Data model

One source: the GitHub GraphQL API (`contributionsCollection`), fetched with a
personal access token held server side, since a token in the browser would be a
token anyone could read from the page source. A single query returns 365 days of
daily contribution counts plus per-repository commit totals, which is enough to
derive every metric without paginating the REST commits endpoint per repo, the
slower path that would multiply one request into hundreds.

Derived metrics:

- **total30**: commits in the trailing 30 days.
- **streak**: consecutive days with at least one commit, walking backward from today.
- **bestDay**: max daily count in the window, with its date.
- **daily**: `{date: count}` map, the heatmap source.
- **perRepo**: repositories ranked by commits in the trailing 30 days.

## API

| Endpoint | Returns |
|----------|---------|
| `GET /api/stats` | total30, streak, bestDay, daily map, perRepo |
| `GET /api/heatmap` | 365-day `{date: count}` map |
| `GET /api/projects` | repos sorted by commits in the last 30 days |

Serverless functions under `api/`. The token never reaches the client, because
leaking it would hand out read access to private repo data; the browser
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
  each client, so the web, iOS, and macOS numbers can never disagree, a real risk if
  three separate implementations each rolled up streaks their own way.
- **No database.** GitHub is the system of record. Nothing is stored, so there is
  nothing to migrate, back up, or keep in sync, and Cadence can never show a number
  that's gone stale relative to the real history.
- **One GraphQL call.** The contributions collection is the cheapest path to a year
  of history; the REST equivalent would be hundreds of requests, one per repo, for
  data that costs one round trip through GraphQL.

## License

MIT 2026, Joshua Trommel
