---
name: News Desk
description: A printed sample briefing that helps a solo operator decide what deserves a closer look.
colors:
  paper: "#f1eadb"
  paper-deep: "#e4d8c4"
  ink: "#17211c"
  ink-soft: "#3f4b43"
  rule: "#a89e8c"
  muted: "#59645b"
  red: "#ad3d2d"
  red-deep: "#7f2c21"
  gold: "#9a7029"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(3.4rem, 8vw, 6.5rem)"
    fontWeight: 560
    lineHeight: 0.88
    letterSpacing: "-0.085em"
  body:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  data:
    fontFamily: "Source Code Pro, SFMono-Regular, Consolas, monospace"
    fontSize: "0.62rem"
    fontWeight: 400
    lineHeight: 1.4
spacing:
  frame: "1220px"
  section: "84px"
  content: "20px"
components:
  active-beat:
    backgroundColor: "{colors.red}"
    textColor: "{colors.paper}"
    padding: "10px 13px"
---

# Design System: News Desk

## Overview

**Creative North Star: “The printed briefing on a working desk.”**

News Desk treats a news aggregator as an editorial decision surface, not an endless feed. Warm paper, fine rules, a single red press mark, and a small edition stamp make the sample boundary visible. The lead story gets a reading surface; the rest of the edition stays in a deliberate row index. The calendar direction contributes its tear-off sense of time and a thin rule separating the edition from the queue, while the product truth keeps the content plainly labelled as deterministic sample material.

## Rules

- Paper is the ambient surface; ink is the reading voice; red marks selected/current action only.
- Use the data face for source, time, category, and count; keep headlines in the readable sans voice.
- Stories are editorial rows and a lead reading, never a same-size card wall.
- Saved/read state has text and controls; the red dot is supplemental, never the only signal.
- The edition stamp states the sample boundary so visual polish never implies live reporting.


---

## Storybook

Storybook 10 (`@storybook/nextjs-vite`) shows this design system with the app's real CSS, tokens and fonts.

```bash
npm run storybook        # http://localhost:6006
npm run build-storybook  # static build in storybook-static/ (CI: .github/workflows/storybook.yml)
```

- **Foundations/Tokens** reads every CSS custom property the app defines at runtime, so it never drifts from the code.
- **Design/DESIGN.md** renders this file.
- **Components/**, **Sections/** and **Pages/** show the UI with mock data only (no network, analytics off).
- Toolbar: locale, theme (light / dark, when the app has a dark theme), viewports 320 / 375 / 768 / 1440. The a11y panel runs axe (WCAG 2.2 AA).
- Rule: a new shared component or page section ships with a story in `stories/`.
