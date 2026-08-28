<img src="icon.svg" width="80">

# Cadence
![version](https://img.shields.io/badge/version-v1.0.2-blue)

Code progress tracker. Visualizes GitHub commit history via the GraphQL API.

## Platforms
- **web** — Dashboard at [cadence.heyitsmejosh.com](https://cadence.heyitsmejosh.com) (Chart.js)
- **iOS** — SwiftUI, wired to live API
- **macOS** — SwiftUI, wired to live API

## Stack
Vercel serverless functions (`api/`) + vanilla JS web. MIT 2026 Joshua Trommel.

## API
- `GET /api/stats` — total30, streak, bestDay, daily map, perRepo
- `GET /api/heatmap` — 365-day {date: count} map
- `GET /api/projects` — repos sorted by commits in last 30 days

## Whitepaper

[Technical whitepaper](WHITEPAPER.md)

## API and agent tools

[`docs/API.md`](docs/API.md) documents the HTTP surface (where there is one) and
the WebMCP tools this app registers on `document.modelContext`, so an in-browser
agent can drive it. Tools are split into read-only, reversible writes, and the
few that require human confirmation.

## Architecture

<img src="architecture.svg" width="600">
