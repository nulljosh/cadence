# Architecture

Cadence shows you how much you have actually been coding. It reads your public GitHub history and turns it into the numbers you care about: your current streak of days in a row with work committed, your best single day, which projects you have been living in this month, and a year-long calendar where each day is shaded by how busy it was.

It runs in a browser, on iPhone and Mac, and in the terminal.

## How it runs

**Web:** You open cadence.heyitsmejosh.com. The page loads, asks the server for your numbers, and draws the charts. There are three requests it can make: one for the headline stats (streak, totals, best day, and a breakdown by project), one for the year calendar, and one for which projects are most active. It signs in to GitHub with a token that can only read, and only sees public repositories.

**iOS/macOS:** The app asks for the same three sets of numbers and draws them natively. The Mac version spreads out into a wider dashboard. Both follow light and dark mode.

**Terminal:** Run `cadence-tui` and it prints the same stats as text.

## API

The server side is a handful of small functions that can run on either Cloudflare or Vercel; the code is the same either way. All three of them ask GitHub for the data. GitHub's own contributions feed gives days but not commit counts, so Cadence asks by repository and by search instead, which does return counts. Answers are held for five minutes before being fetched fresh, and for ten minutes after that a stale answer is served instantly while a new one is fetched in the background.

| File | What it owns |
|---|---|
| `api/_lib.js` | Shared utilities. `ghGraphQL()` makes GitHub GraphQL requests (sets User-Agent, checks response status, parses errors, times out after 10 seconds). `CACHE` is the cache-control header constant (5 min + SWR). `EXCLUDED` is the set of repos to skip in stats (e.g., 'journal' for personal notes). `repoStatus()` classifies repos by commit count (active > 20, stable 6-20, slow < 5 per 30d). |
| `api/stats.js` | `GET /api/stats`. Queries 365 days of commit history, finds the longest streak of consecutive days with commits, identifies the best day (most commits), totals commits in the last 30 days, and counts per-repo. Returns `{total30, streak, bestDay, dailyMap, perRepo}`. |
| `api/heatmap.js` | `GET /api/heatmap`. Returns a 365-day map of `{date, count}` entries for the heatmap visualization. One entry per calendar day, 0 if no commits. |
| `api/projects.js` | `GET /api/projects`. Lists repos sorted by commit count in the last 30 days, descending. Includes status (active/stable/slow) and total commit count. Excludes repos in the `EXCLUDED` set. |
| `functions/_adapter.js` | Adapter for Vercel Functions (if running there instead of Cloudflare). Maps the Vercel event/response API to the Cloudflare Worker API so the endpoint code is identical. |
| `functions/api/` | Cloudflare Workers versions of the same three endpoints, deployed to `cadence.heyitsmejosh.com`. Uses `wrangler deploy`. |

## Web

| File | What it owns |
|---|---|
| `web/index.html` | Dashboard. Four panels: total commits, current streak, best day, and a Chart.js heatmap showing all 365 days. Also lists active repos by commit count. Fetches from `/api/stats` and `/api/heatmap` on load. Styled for desktop and mobile (responsive grid). Dark theme by default. |
| `web/sw.js` | Service worker. Caches the dashboard HTML and Chart.js library for offline viewing (though data will be stale). |
| `web/webmcp.js` | Model Context Protocol tools. Registers `getStats` and `getHeatmap` tools so agents can query the data. |
| `public/index.html` | Alternative landing page (rarely used; `web/index.html` is the main one). |

## iOS and macOS

| File | What it owns |
|---|---|
| `Sources/iOS/CadenceApp.swift` | iOS app entry point. Single `WindowGroup` with a navigation stack. |
| `Sources/macOS/CadenceApp.swift` | macOS app entry point. Same views as iOS but with a column-based layout for larger screens. Window defaults to 1100x600. |
| `Sources/Models.swift` | Data structures. `Stats` (total30, streak, bestDay, dailyMap, perRepo), `HeatmapEntry` (date, count), `Project` (name, commits, status). Codable so URLSession can decode API responses directly. |
| `Sources/NetworkManager.swift` | Network layer. Fetches from the three API endpoints and caches results in memory for the app session. Retries on network failure. |
| `Sources/DashboardView.swift` | Main UI. Displays the four stat cards (total, streak, best day) and a heatmap grid (7 columns for days of week, rows for weeks). Tap a date to see details if available. |
| `Sources/HeatmapView.swift` | Heatmap visualization. Renders a color-coded grid where cell darkness maps to commit count (0 = gray, 1-5 = light, 6+ = dark). Sunday-Saturday rows. |
| `Sources/ProjectListView.swift` | List of repos sorted by recent commit count, with status badges (active/stable/slow). Tap to sort or filter. |
| `Package.swift` | Swift Package Manager manifest. iOS and macOS targets. TUI executable target. |

## TUI

| File | What it owns |
|---|---|
| `tui/main.swift` | Command-line interface. Fetches from the three endpoints and prints stats to stdout. `cadence-tui` alone shows the dashboard; flags control output format (JSON, CSV, etc.). |

## Kotlin Multiplatform

| File | What it owns |
|---|---|
| `kmp/shared/src/commonMain/kotlin/com/nulljosh/cadence/CadenceClient.kt` | Shared Kotlin code. Makes HTTP requests to the three API endpoints, decodes responses, and exposes methods like `getStats()` and `getHeatmap()`. Used by both Android and desktop. |
| `kmp/composeApp/src/commonMain/kotlin/com/nulljosh/cadence/AppScreen.kt` | Shared Compose UI for Android and desktop. Displays the four stat cards and heatmap grid. Calls `CadenceClient` to fetch data. |
| `kmp/composeApp/src/androidMain/kotlin/com/nulljosh/cadence/MainActivity.kt` | Android entry point. Boots the Compose app. |
| `kmp/composeApp/src/desktopMain/kotlin/com/nulljosh/cadence/Main.kt` | Desktop (JVM) entry point. Boots the Compose app as a window. |

## Testing

| File | What it owns |
|---|---|
| `test.mjs` | Test suite. Verifies API endpoint responses (stats shape, heatmap entries, project list). Run with `node test.mjs`. |

## GitHub authentication

The API uses a GitHub personal access token (`GITHUB_TOKEN` environment variable). In the browser, the token is passed via a Cloudflare environment variable (secrets.json or wrangler.toml) so it is never exposed to client code. On iOS/macOS and TUI, the token is read from the environment or from a keychain/credential manager.

## Excluded repos

`api/_lib.js` defines `EXCLUDED` as the set of repos to skip. Currently includes 'journal' (personal notes, not code output). Add repos here if they inflate stats unfairly (e.g., auto-generated commits, notes-only repos).

## Gotchas

- **GitHub API rate limit:** The GraphQL endpoint is rate-limited (60 requests per hour for unauthenticated, 5000 for authenticated). Each call to `/api/stats` or `/api/heatmap` makes one GraphQL request. The cache-control header (5 min) keeps most users under the limit.
- **Streak calculation:** A streak is consecutive *calendar* days with at least one commit, not consecutive commits. The 365-day window starts from today and goes back a year. Timezone differences can cause edge cases (a commit at 11:59 PM in one timezone is tomorrow in UTC). GitHub timestamps are in UTC.
- **Repository count:** The API pulls all repositories the authenticated user owns or has contributed to. Listing repos with a GraphQL query is slower than the REST endpoint but gives commit counts directly without a second call.
- **Null checks:** A user with no commits in 365 days has `dailyMap: {}` (empty), `streak: 0`, `bestDay: 0`. Charts handle this gracefully.
