// @vitest-environment happy-dom
// happy-dom follows a link itself when the click was not prevented; keep it from loading anything.
// @vitest-environment-options {"settings":{"navigation":{"disableMainFrameNavigation":true}}}
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const { ClientNav } = await import("@/components/client-nav");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
function clickLink(href: string, init: MouseEventInit = {}, attrs: Record<string, string> = {}) {
  const a = document.createElement("a");
  a.href = href;
  for (const [k, v] of Object.entries(attrs)) a.setAttribute(k, v);
  a.textContent = "go";
  host.append(a);
  // Dispatched on the anchor itself: happy-dom follows a link it bubbles through before document listeners run.
  const event = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init });
  a.dispatchEvent(event);
  a.remove();
  window.history.replaceState(null, "", "/stories/calm-software");
  return event.defaultPrevented;
}

beforeEach(() => {
  push.mockClear();
  window.history.replaceState(null, "", "/stories/calm-software");
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(<ClientNav />));
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  window.history.replaceState(null, "", "/");
});

// Read / saved marks fall back to memory when storage is blocked; in-site links must not reload the document
// (a reload starts the store from the authored edition again), so they go through the client router.
describe("client navigation", () => {
  it("routes in-site links (previous / next, The edition) without a document load", () => {
    expect(clickLink("/stories/interfaces#beat=Products")).toBe(true);
    expect(push).toHaveBeenCalledWith("/stories/interfaces#beat=Products");
    expect(clickLink("/")).toBe(true);
    expect(push).toHaveBeenLastCalledWith("/");
  });

  it("leaves new-tab clicks, other sites, the API, downloads, same-page anchors and handled clicks alone", () => {
    expect(clickLink("/stories/interfaces", { ctrlKey: true })).toBe(false);
    expect(clickLink("/stories/interfaces", { metaKey: true })).toBe(false);
    expect(clickLink("/stories/interfaces", { button: 1 })).toBe(false);
    expect(clickLink("/stories/interfaces", {}, { target: "_blank" })).toBe(false);
    expect(clickLink("/stories/interfaces", {}, { download: "" })).toBe(false);
    expect(clickLink("https://bookchaowalit.com/")).toBe(false);
    expect(clickLink("/api/mcp")).toBe(false);
    expect(clickLink("#main")).toBe(false);
    host.addEventListener("click", (event) => event.preventDefault(), { once: true });
    clickLink("/stories/interfaces");
    expect(push).not.toHaveBeenCalled();
  });
});
