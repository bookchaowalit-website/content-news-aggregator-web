# Design

Since 2026-11-19 News Desk uses the shared Reader shell (see `READER.md`): Geist via `next/font`, the
`--rs-*` tokens in `app/reader-shell.css` (light and dark, WCAG 2.2 AA), one h1 per page, 44px targets
and a forced-colors fallback. The newsprint look (9–10px mono labels, #59645b on paper-deep at 4.39:1,
2.2:1 rules, 34–37px buttons, a masthead and sidebar that pushed every story below the first view on
phones) is retired.

- `/` — eyebrow "sample notes, not live news", h1, lede; live search (a `role="search"` box, no form),
  beat chips (buttons with `aria-pressed`, counts follow the search), result count, unread/saved line,
  then every note as a row (beat, read time, read/saved state, title, summary) and two empty states.
- `/stories/<id>` — header (beat, source, read time, time label), "Why read it", Mark as read / Save for
  later (this browser only, with a status message) and previous / next.
- The footer says the notes are authored samples with no feed or outside sources behind them.
