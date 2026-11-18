// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Home from "@/app/page";
import { StoryView } from "@/components/story-view";
import StoryPage, { generateMetadata, generateStaticParams } from "@/app/stories/[id]/page";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { SEED, STORAGE_KEY, storyStore } from "@/lib/news";
import nextConfig from "../next.config";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
const $ = <T extends Element = HTMLElement>(selector: string) => host.querySelector(selector) as T | null;
const texts = (selector: string) => [...host.querySelectorAll(selector)].map((el) => el.textContent);
const button = (text: string) => [...host.querySelectorAll("button")].find((b) => b.textContent?.trim().startsWith(text)) as HTMLButtonElement;
const click = (el: Element) => act(() => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
function type(el: HTMLInputElement, value: string) {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  storyStore.update(() => SEED);
  localStorage.clear();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("edition index", () => {
  it("server-renders every note as a link with its beat, read time and state, labelled as sample", () => {
    const html = renderToString(<Home />).replace(/<!-- -->/g, "");
    expect(html).toContain("sample notes, not live news");
    expect(html).toContain('href="/stories/small-models"');
    const text = html.replace(/<[^>]+>/g, "");
    expect(text).toContain("Signals · 4 min read · Unread · Saved");
    expect(text).toContain("4 unread · 1 saved for later");
    expect(html).toContain('href="https://bookchaowalit.com/"');
  });

  it("filters live by search and beat; chip counts follow the search; empty state leads back", () => {
    act(() => root.render(<Home />));
    expect($(".rs-count")!.textContent).toBe("5 notes");
    click(button("Products"));
    expect(texts(".rs-entry-link")).toHaveLength(2);
    expect($('.rs-chip[aria-pressed="true"]')!.textContent).toBe("Products2");
    type($<HTMLInputElement>('.rs-search input')!, "interface");
    expect(texts(".rs-chip")).toEqual(["All1", "Signals0", "Products1", "Research0", "Practice0"]);
    expect($(".rs-count")!.textContent).toBe("Showing 1 of 5 notes in Products for “interface”");
    click(button("Research"));
    expect($(".rs-empty h2")!.textContent).toBe("No note in this cut");
    click(button("Show every note"));
    expect(texts(".rs-entry-link")).toHaveLength(5);
    expect($<HTMLInputElement>('.rs-search input')!.value).toBe("");
  });
});

describe("note pages", () => {
  it("marks read and saves for later in this browser, with a status message", () => {
    act(() => root.render(<StoryView id="retrieval" />));
    expect($("h1")!.textContent).toBe("Retrieval is a product decision, not a search box");
    expect($('.rs-pager a[rel="prev"]')!.getAttribute("href")).toBe("/stories/calm-software");
    click(button("Mark as read"));
    expect(button("Mark unread").getAttribute("aria-pressed")).toBe("true");
    expect($('[role="status"].rs-count')!.textContent).toBe("Marked read in this browser.");
    click(button("Save for later"));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).find((s: { id: string }) => s.id === "retrieval")).toMatchObject({ read: true, saved: true });
    click(button("Mark unread"));
    click(button("Remove from saved"));
    expect($('[role="status"].rs-count')!.textContent).toBe("Removed from saved.");
  });

  it("renders every real note page and 404s an unknown id", async () => {
    for (const { id } of generateStaticParams()) {
      const html = renderToString(await StoryPage(params(id)));
      expect(html.match(/<h1/g)).toHaveLength(1);
      expect((await generateMetadata(params(id))).title).toBeTruthy();
    }
    expect(await generateMetadata(params("missing"))).toEqual({});
    await expect(StoryPage(params("missing"))).rejects.toThrow();
  });
});

describe("site files", () => {
  it("uses the site's own domain and sends /more-projects to the main site", async () => {
    expect(sitemap().map((u) => u.url)).toContain("https://news-aggregator.bookchaowalit.com/stories/shipping");
    expect(robots().sitemap).toBe("https://news-aggregator.bookchaowalit.com/sitemap.xml");
    expect(await nextConfig.redirects!()).toContainEqual({ source: "/more-projects", destination: "https://bookchaowalit.com/", permanent: true });
  });
});

