// The edition's search and beat live in the URL fragment (#beat=…&q=…). Browsers never send a fragment in a request,
// so the query stays in this browser (READER.md: live search never reaches the server), while story links still carry
// the cut and Back returns to it. Read on the client only: the server snapshot is "", like a page with no cut.

const listeners = new Set<() => void>();

export function subscribeHash(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
  };
}

export const getHash = () => window.location.hash;
export const getServerHash = () => "";

/** The search and beat in a fragment such as `#beat=Products&q=interface` (the query is cut to 200 characters). */
export function parseDeskHash(hash: string): { q: string; beat: string } {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return { q: (params.get("q") ?? "").slice(0, 200), beat: params.get("beat") ?? "" };
}

/** The edition's search and beat as a fragment, or "" for the whole edition. */
export const deskState = (q = "", beat = "") => `#${new URLSearchParams({ ...(beat && beat !== "All" ? { beat } : {}), ...(q.trim() ? { q: q.trim() } : {}) })}`.replace(/^#$/, "");

/** Replace the fragment in place: no history entry per keystroke, no request, no hashchange scroll. */
export function writeDeskHash(fragment: string) {
  if (window.location.hash === fragment) return;
  window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}${fragment}`);
  for (const listener of listeners) listener();
}
