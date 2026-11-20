// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Home from "@/app/page";
import { StoryView } from "@/components/story-view";
import { DeskView } from "@/components/desk-view";
import McpPage from "@/app/mcp/page";
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
  it("server-renders every note as a link with its beat, read time and state, labelled as sample", async () => {
    const html = renderToString(await Home()).replace(/<!-- -->/g, "");
    expect(html).toContain("sample notes, not live news");
    expect(html).toContain('href="/stories/small-models"');
    const text = html.replace(/<[^>]+>/g, "");
    expect(text).toContain("Signals · 4 min read · Unread · Saved");
    expect(text).toContain("4 unread · 1 saved for later");
    expect(html).toContain('href="https://bookchaowalit.com/"');
  });

  it("filters live by search and beat; chip counts follow the search; empty state leads back", () => {
    act(() => root.render(<DeskView />));
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

describe("follow-ups", () => {
  it("keeps search and beat in the URL fragment (never sent to the server) and in story links; Back returns to the same cut", async () => {
    // The pages take no search params: the cut lives in #fragment, which browsers never send in a request.
    expect(Home.length).toBe(0);
    window.history.replaceState(null, "", "/#q=small&beat=Nope");
    act(() => root.render(<DeskView />));
    expect($<HTMLInputElement>(".rs-search input")!.value).toBe("small");
    expect(window.location.search).toBe("");
    click(button("Practice"));
    expect(window.location.search).toBe("");
    expect(window.location.hash).toBe("#beat=Practice&q=small");
    expect($(".rs-entry-link")!.getAttribute("href")).toBe("/stories/shipping#beat=Practice&q=small");
    type($<HTMLInputElement>(".rs-search input")!, "small ");
    expect($<HTMLInputElement>(".rs-search input")!.value).toBe("small ");
    act(() => root.unmount());
    root = createRoot(host);
    window.history.replaceState(null, "", "/stories/calm-software#beat=Products");
    act(() => root.render(<StoryView id="calm-software" />));
    expect($(".rs-back")!.getAttribute("href")).toBe("/#beat=Products");
    expect($('.rs-pager a[rel="next"]')!.getAttribute("href")).toBe("/stories/interfaces#beat=Products");
    window.history.replaceState(null, "", "/stories/calm-software#beat=Products&q=interface");
    act(() => root.unmount());
    root = createRoot(host);
    act(() => root.render(<StoryView id="calm-software" />));
    expect($(".rs-back")!.getAttribute("href")).toBe("/#beat=Products&q=interface");
    expect($(".rs-pager")).toBeNull();
    // A cut that does not hold the note falls back to the whole edition.
    act(() => root.unmount());
    root = createRoot(host);
    act(() => root.render(<StoryView id="retrieval" />));
    expect($(".rs-back")!.getAttribute("href")).toBe("/");
    window.history.replaceState(null, "", "/");
  });

  it("gives each note its own share title, description and URL", async () => {
    const meta = await generateMetadata(params("shipping"));
    expect(meta.openGraph).toMatchObject({ url: "https://news-aggregator.bookchaowalit.com/stories/shipping", title: "Shipping small is a way to protect attention", type: "article" });
  });

  it("links the footer to an MCP how-to page with the real tools", () => {
    act(() => root.render(<McpPage />));
    expect($('.rs-foot a[href="/mcp"]')!.textContent).toBe("MCP API");
    expect(texts("tbody code")).toEqual(["list_stories", "get_story", "search_stories"]);
  });

  it("says /api/mcp is a custom JSON-RPC subset, not a full MCP server", () => {
    act(() => root.render(<McpPage />));
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/answers Model Context Protocol/);
    expect(text).toContain("Not a full MCP server");
    expect(text).toContain("result.stories");
    expect(text).toMatch(/standard MCP\s+clients expect/);
  });
});

describe("site files", () => {
  it("uses the site's own domain and sends /more-projects to the main site", async () => {
    expect(sitemap().map((u) => u.url)).toContain("https://news-aggregator.bookchaowalit.com/stories/shipping");
    expect(robots().sitemap).toBe("https://news-aggregator.bookchaowalit.com/sitemap.xml");
    expect(await nextConfig.redirects!()).toContainEqual({ source: "/more-projects", destination: "https://bookchaowalit.com/", permanent: true });
  });
});

