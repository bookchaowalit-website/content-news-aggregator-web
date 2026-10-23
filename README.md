# News Desk (news aggregator demo)

A calm reading desk over five authored sample stories: filter by beat, search headline, summary, source or beat,
pick a lead story to read its "why read it" note, and mark it read or save it for later. Read and saved marks stay
in this browser (`localStorage`). There is no live feed behind it.

Live: https://news-aggregator.bookchaowalit.com (deployed by Vercel CLI; it can lag `main`, see `PRODUCT.md`).

## What it does not do

- No RSS, Hacker News, Reddit or any other feed; no AI relevance scoring or deduplication. The five stories are
  fixed sample copy dated "Edition 01".
- No account, shared queue or sync between devices.

## Run

```bash
npm ci
npm run dev
```

## Checks

```bash
npm test           # Vitest: edition rules and storage, MCP route, home page render, Sentry scrubbing
npm run lint
npm run typecheck
npm run build
```

CI (`.github/workflows/ci.yml`) runs the shared Node workflow (with a line-coverage gate) and the shared security
scan on every push and PR to `main`.

## Code map

- `lib/news.ts`: the five sample stories, beat filter and search, queue counts, read/saved updates, the lead-story
  pick, parsing of saved marks (only boolean read/saved of known ids; story text always comes from the code) and
  the `localStorage` store the page reads with `useSyncExternalStore`.
- `app/page.tsx`: the desk page.
- `app/api/mcp/route.ts`: stateless JSON-RPC endpoint with read-only tools `list_stories`, `get_story` and
  `search_stories` over the same sample stories (results carry `sample: true`; read/saved marks are not on the server).
- `lib/sentry.ts` + `instrumentation*.ts`: error reporting to Sentry, errors only, personal data stripped; off when
  `NEXT_PUBLIC_SENTRY_DSN` is unset.
- `app/more-projects/page.tsx`: shared portfolio link page (copied per repository, not a package).
- `DESIGN.md`: the visual system.
