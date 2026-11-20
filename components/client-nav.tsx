"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * In-site links go through the client router instead of loading a new document. Read / saved marks fall back to memory
 * when the browser blocks localStorage, and a document load would start them from the authored edition again; routing
 * on the client keeps the same store for the whole visit. New-tab clicks, other sites, /api and downloads keep the
 * browser's own behaviour. A same-page anchor (the skip link to #main) focuses and scrolls to its target without
 * touching the fragment, which holds the edition cut (#beat=…&q=…). The Reader shell stays plain anchors (copied verbatim).
 */
export function ClientNav() {
  const router = useRouter();
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/api/")) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) {
        const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
        if (!target) return;
        event.preventDefault();
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.scrollIntoView?.();
        target.focus({ preventScroll: true });
        return;
      }
      event.preventDefault();
      router.push(`${url.pathname}${url.search}${url.hash}`);
    };
    // Bubble phase: a click that a component already handled (defaultPrevented) is left alone.
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [router]);
  return null;
}
