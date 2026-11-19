import type { Metadata } from "next";
import { McpDocs } from "@/components/mcp-docs";
import { NewsFrame, SITE } from "@/components/news-frame";
import { TOOLS } from "@/lib/mcp-tools";

export const metadata: Metadata = { title: "MCP API", description: "How to call the News Desk read-only MCP endpoint.", alternates: { canonical: "/mcp" } };

export default function McpPage() {
  return <NewsFrame><McpDocs name="News Desk" site={SITE} tools={TOOLS} /></NewsFrame>;
}
