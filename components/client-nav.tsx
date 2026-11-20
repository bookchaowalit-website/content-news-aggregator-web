"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * In-site links go through the client router instead of loading a new document. Read / saved marks fall back to memory
 * when the browser blocks localStorage, and a document load would start them from the authored edition again; routing
 * on the client keeps the same store for the whole visit. New-tab clicks, other sites, /api, downloads and same-page
 * anchors (the skip link) keep the browser's own behaviour. The Reader shell stays plain anchors (copied verbatim).
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
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
      event.preventDefault();
      router.push(`${url.pathname}${url.search}${url.hash}`);
    };
    // Bubble phase: a click that a component already handled (defaultPrevented) is left alone.
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [router]);
  return null;
}
