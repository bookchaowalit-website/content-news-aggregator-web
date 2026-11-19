import { CATEGORIES } from "@/lib/news";

// The MCP tools /api/mcp serves; the /mcp page documents the same list.

export const TOOLS = [
  {
    name: "list_stories",
    description: "List the sample edition's stories, optionally for one beat",
    inputSchema: { type: "object", properties: { category: { type: "string", enum: CATEGORIES } } },
  },
  { name: "get_story", description: "Get one sample story by id", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
  {
    name: "search_stories",
    description: "Search headlines, summaries, sources and beats",
    inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  },
];
