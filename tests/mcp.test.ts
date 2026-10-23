import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/mcp/route";

function rpc(body: unknown) {
  return POST(new Request("http://localhost/api/mcp", { method: "POST", body: JSON.stringify(body) }));
}

const ids = (stories: { id: string }[]) => stories.map((story) => story.id);

describe("MCP route", () => {
  it("echoes the JSON-RPC request id and names the server", async () => {
    const body = await (await rpc({ jsonrpc: "2.0", id: 7, method: "initialize" })).json();
    expect(body.id).toBe(7);
    expect(body.result.serverInfo.name).toBe("News Desk");
  });

  it("lists the three read-only tools over the sample edition", async () => {
    const body = await (await rpc({ jsonrpc: "2.0", id: "t", method: "tools/list" })).json();
    expect(body.id).toBe("t");
    expect(body.result.tools.map((tool: { name: string }) => tool.name)).toEqual(["list_stories", "get_story", "search_stories"]);
  });

  it("list_stories returns the five authored sample stories, filtered by beat when asked", async () => {
    const all = await (await rpc({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "list_stories" } })).json();
    expect(ids(all.result.stories)).toEqual(["small-models", "calm-software", "retrieval", "shipping", "interfaces"]);
    expect(all.result.sample).toBe(true);
    const products = await (await rpc({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "list_stories", arguments: { category: "Products" } } })).json();
    expect(ids(products.result.stories)).toEqual(["calm-software", "interfaces"]);
  });

  it("search_stories matches headline, summary, source or beat", async () => {
    const body = await (await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "search_stories", arguments: { query: "memory" } } })).json();
    expect(ids(body.result.stories)).toEqual(["retrieval"]);
  });

  it("get_story returns one story and errors on an unknown id or beat", async () => {
    const found = await (await rpc({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "get_story", arguments: { id: "shipping" } } })).json();
    expect(found.result.story.title).toBe("Shipping small is a way to protect attention");
    const missing = await (await rpc({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "get_story", arguments: { id: "nope" } } })).json();
    expect(missing.id).toBe(5);
    expect(missing.error.code).toBe(-32602);
    const badBeat = await (await rpc({ jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "list_stories", arguments: { category: "Sports" } } })).json();
    expect(badBeat.error.code).toBe(-32602);
  });

  it("refuses an unknown tool instead of pretending to run it", async () => {
    const res = await rpc({ jsonrpc: "2.0", id: 8, method: "tools/call", params: { name: "get_data" } });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.result).toBeUndefined();
    expect(body.error.code).toBe(-32602);
  });

  it("answers an unknown method with method-not-found and bad JSON with a parse error", async () => {
    expect((await (await rpc({ jsonrpc: "2.0", id: 9, method: "resources/list" })).json()).error.code).toBe(-32601);
    const bad = await (await POST(new Request("http://localhost/api/mcp", { method: "POST", body: "{nope" }))).json();
    expect(bad.error.code).toBe(-32700);
    expect(bad.id).toBeNull();
  });
});
