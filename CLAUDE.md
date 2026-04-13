# Cadence

Code progress tracker — visualizes git commits across ~/Documents/Code repos.

## Structure
- `api/server.js` — Express API on :3001. Reads real git log via execFileSync.
- `web/index.html` — Dashboard. Fetches from localhost:3001.
- `ios/` — SwiftUI (TODO)
- `macos/` — SwiftUI (TODO)

## Dev
```bash
cd api && node server.js   # start API
open web/index.html        # open web
```

## Endpoints
- GET /api/stats — total30, streak, bestDay, daily map
- GET /api/heatmap — 365-day commit counts by date
- GET /api/projects — all repos sorted by commits30

## Links
- GitHub: https://github.com/nulljosh/cadence
- Live: cadence.heyitsmejosh.com
- License: MIT 2026 Joshua Trommel

## Next
- Wire real git log to iOS/macOS SwiftUI targets
- Vercel deploy (serverless functions for API)
- Domain: cadence.heyitsmejosh.com
