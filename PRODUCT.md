# News Desk (news aggregator demo) — Product truth

> Inferred from the code and copy (no user interview). Checked against the portfolio card claims review
> (`portfolio-site-web/docs/audits/CARD-CLAIMS-REVIEW-2026-10.md`, row `news-aggregator`) on 2026-10-23.

## What it is

A client-side reading desk over five authored sample stories, labelled on the page as "CURATED SAMPLE · NOT LIVE
NEWS". Read and saved marks live in the visitor's browser (`localStorage`, key `news-desk-v2`).

## Who it is for

Solo operators and builders who want to see a small, calm reading queue: what is worth a closer look and why,
rather than an endless feed.

## What works today

1. Five sample stories across four beats (Signals, Products, Research, Practice), each with source, time, read
   length, summary and a "why read it" note.
2. Filter by beat (with per-beat counts) and search headline, summary, source or beat (case-insensitive).
3. Pick a lead story; mark it read/unread or save it for later. The queue shows unread and saved counts.
4. Marks survive a reload in the same browser. Only boolean read/saved marks of known stories are taken from
   storage, so corrupt or edited data cannot break the page or change the story text; if storage is blocked, marks
   last for the visit only.
5. `/api/mcp` answers JSON-RPC `initialize`, `tools/list` and `tools/call` with read-only tools `list_stories`
   (optional beat), `get_story` and `search_stories` over the same sample stories; unknown tools, ids or beats
   get JSON-RPC errors.
6. Front-end and server errors go to Sentry (errors only, personal data stripped) when `NEXT_PUBLIC_SENTRY_DSN` is set.

## What does not work (and must not be claimed)

- No RSS, Hacker News or Reddit feeds, no AI relevance scoring, no deduplication and no time saving to claim (the
  portfolio card was corrected to Prototype in the 2026-10 review).
- No adding stories, accounts, shared queue or sync.

## Live URL and deploy state

- Live: https://news-aggregator.bookchaowalit.com (HTTP 200 on 2026-10-23).
- The Vercel project `bookchaowalit-news-aggregator-frontend` is deployed only by CLI. Its last production deploy is
  the CVE patch (2026-10-23, CLI, commit 80622c5). Its Git link names the old repository
  `bookchaowalit/bookchaowalit-news-aggregator-frontend`, so a push to `main` does not deploy: the L2 work (tests,
  Sentry, lib store, truthful MCP tools) stays undeployed until the owner reconnects Vercel Git to this repository
  (owner action D9). `NEXT_PUBLIC_SENTRY_DSN` is already set on the Vercel project (Sentry project
  `content-news-aggregator-web`, org `personal-yu0`).

## Boundaries

- Browser-only apart from the stateless, read-only `/api/mcp` route.
