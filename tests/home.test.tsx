import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("home page", () => {
  it("renders the desk with its sample-edition labels", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("What deserves a closer look?");
    expect(html).toContain("CURATED SAMPLE · NOT LIVE NEWS");
    expect(html).toContain("This desk contains five deterministic sample notes. There is no feed connection behind it.");
    expect(html).toContain("Sample content, plainly labelled.");
  });

  it("leads with the first story and shows the queue counts and every beat", () => {
    const html = renderToString(<Home />);
    expect(html).toMatch(/<h2 id="story-title">Small models are changing what a useful tool can be<\/h2>/);
    expect(html).toMatch(/<span>Unread<\/span><strong>04<\/strong>/);
    expect(html).toMatch(/<span>Saved for later<\/span><strong>01<\/strong>/);
    expect(html).toMatch(/5<!-- --> OF <!-- -->5<!-- --> NOTES/);
    for (const beat of ["Signals", "Products", "Research", "Practice"]) expect(html).toContain(`<span>${beat}</span>`);
  });
});
