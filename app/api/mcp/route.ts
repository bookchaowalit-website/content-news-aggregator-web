import { NextResponse } from "next/server";
import { CATEGORIES, SEED, filterStories, isCategory, type Story } from "@/lib/news";

// Stateless JSON-RPC MCP endpoint over the same five authored sample stories the page shows. It is read-only:
// read/saved marks live in each visitor's browser and never reach the server, so they are not returned.

type RpcRequest = { id?: number | string | null; method?: string; params?: { name?: string; arguments?: Record<string, unknown> } };

const TOOLS = [
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

class RpcError extends Error {
  constructor(readonly code: number, message: string) {
    super(message);
  }
}

function publicStory(story: Story) {
  const { id, category, source, title, summary, why, time, readMinutes } = story;
  return { id, category, source, title, summary, why, time, readMinutes };
}

function callTool(name: string | undefined, args: Record<string, unknown> = {}) {
  switch (name) {
    case "list_stories": {
      if (args.category !== undefined && !isCategory(args.category)) throw new RpcError(-32602, `Unknown beat: ${String(args.category)}`);
      return { sample: true, stories: filterStories(SEED, args.category ?? "All", "").map(publicStory) };
    }
    case "get_story": {
      const story = SEED.find((entry) => entry.id === args.id);
      if (!story) throw new RpcError(-32602, `No story with id ${String(args.id)}`);
      return { sample: true, story: publicStory(story) };
    }
    case "search_stories":
      return { sample: true, stories: filterStories(SEED, "All", typeof args.query === "string" ? args.query : "").map(publicStory) };
    default:
      throw new RpcError(-32602, `Unknown tool: ${String(name)}`);
  }
}

export async function POST(request: Request) {
  let id: RpcRequest["id"] = null;
  try {
    const body = (await request.json()) as RpcRequest;
    id = body.id ?? null;
    let result: unknown;
    switch (body.method) {
      case "initialize":
        result = {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "News Desk", version: "1.0.0" },
        };
        break;
      case "tools/list":
        result = { tools: TOOLS };
        break;
      case "tools/call":
        result = callTool(body.params?.name, body.params?.arguments);
        break;
      default:
        throw new RpcError(-32601, `Unknown method: ${String(body.method)}`);
    }
    return NextResponse.json({ jsonrpc: "2.0", id, result });
  } catch (error) {
    const code = error instanceof RpcError ? error.code : -32700;
    const message = error instanceof RpcError ? error.message : "Parse error";
    return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } }, { status: 400 });
  }
}
