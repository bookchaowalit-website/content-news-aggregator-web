import type { ReactNode } from "react";
import { Reader, ReaderFoot, ReaderTop } from "@/components/reader-shell";

export const SITE = "https://news-aggregator.bookchaowalit.com";
const SOURCE = "https://github.com/bookchaowalit-website/content-news-aggregator-web";

export function NewsFrame({ children }: { children: ReactNode }) {
  return (
    <Reader>
      <ReaderTop name="News Desk" tagline="Sample edition" links={[{ href: "/", label: "Edition 01" }]} />
      <main id="main" className="rs-main">{children}</main>
      <ReaderFoot
        source={SOURCE}
        links={[{ href: "/mcp", label: "MCP API" }]}
        note="Five authored sample notes, plainly labelled: no live feed or outside sources sit behind them. Read and saved marks stay in this browser."
      />
    </Reader>
  );
}
