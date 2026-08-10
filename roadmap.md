# Cadence roadmap

## Finish the Cloudflare migration (in progress)

Source was recovered 2026-08-10 from the live Vercel deployment via the deployment
files API — there was no local repo or GitHub remote before that. Repo is now
`nulljosh/cadence` (private).

**Done:**
- `functions/_adapter.js` wraps the Vercel `(req, res)` handlers in `api/` so they run
  on Pages Functions unchanged. `functions/api/{stats,projects,heatmap}.js` are 3-line
  wrappers over it.
- `wrangler.toml` with `nodejs_compat` + `pages_build_output_dir = "web"`.
- `GITHUB_TOKEN` set as a Pages secret. Note: `vercel env pull` returns `[SENSITIVE]`
  for it, not the real value — the token in use came from `gh auth token`.
- Added the `User-Agent` header in `api/_lib.js` that GitHub requires. Node's fetch
  sends one implicitly; the Workers runtime does not.
- Verified 200 on `https://cadence-cm8.pages.dev`: `/api/stats`, `/api/heatmap`.

**Left:**
1. `/api/projects` returns 500 — `Cannot read properties of undefined (reading 'user')`,
   i.e. the GraphQL response has no `data`. Only this endpoint's query has the
   `journalRepo: repository(owner: "nulljosh", name: "journal")` sub-query, so start
   there: run the query in isolation against the API and check whether the token can
   see that repo. `api/projects.js` is the only file involved.
2. Once it passes, flip DNS: `cadence.heyitsmejosh.com` is currently an **A record**
   (`76.76.21.21`, Vercel) — replace it with a proxied CNAME to `cadence-cm8.pages.dev`,
   attach the custom domain to the Pages project, then verify through a Cloudflare edge
   IP (the local resolver caches the old Vercel answer for 15+ min).
3. Delete the `cadence` Vercel project only after that check passes.

Cadence is still live on Vercel and untouched, so there is no outage while this sits.

## Also recovered

`Sources/` holds a SwiftUI iOS + macOS app (`Cadence.xcodeproj`, `project.yml`) that
existed nowhere locally. Never built or verified this session — build it before
assuming it compiles.
