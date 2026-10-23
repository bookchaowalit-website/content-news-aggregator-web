import { describe, expect, it, vi } from "vitest";
import {
  SEED,
  STORAGE_KEY,
  countBy,
  createStoryStore,
  filterStories,
  parseSavedStories,
  pickSelected,
  queueCounts,
  serializeStories,
  updateStory,
} from "@/lib/news";

const ids = (stories: { id: string }[]) => stories.map((story) => story.id);

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return { data, getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) };
}

describe("edition rules", () => {
  it("filters by beat and searches headline, summary, source and beat without case", () => {
    expect(ids(filterStories(SEED, "Products", ""))).toEqual(["calm-software", "interfaces"]);
    expect(ids(filterStories(SEED, "All", "STUDIO MEMO"))).toEqual(["shipping"]);
    expect(ids(filterStories(SEED, "All", "research"))).toEqual(["retrieval"]);
    expect(ids(filterStories(SEED, "Research", "attention"))).toEqual([]);
    expect(filterStories(SEED, "All", "   ")).toEqual(SEED);
  });

  it("counts stories per beat and the reading queue", () => {
    expect(countBy(SEED, "All")).toBe(5);
    expect(countBy(SEED, "Products")).toBe(2);
    expect(countBy(SEED, "Practice")).toBe(1);
    expect(queueCounts(SEED)).toEqual({ unread: 4, saved: 1 });
  });

  it("toggles read and saved on one story only", () => {
    const next = updateStory(SEED, "retrieval", { read: true, saved: true });
    expect(next.find((story) => story.id === "retrieval")).toMatchObject({ read: true, saved: true });
    expect(queueCounts(next)).toEqual({ unread: 3, saved: 2 });
    expect(next.filter((story) => story.id !== "retrieval")).toEqual(SEED.filter((story) => story.id !== "retrieval"));
  });

  it("keeps the chosen lead story even when the filter hides it, else falls back to the first visible", () => {
    expect(pickSelected(SEED, [], "shipping")?.id).toBe("shipping");
    expect(pickSelected(SEED, filterStories(SEED, "Research", ""), "gone")?.id).toBe("retrieval");
    expect(pickSelected(SEED, [], "gone")?.id).toBe("small-models");
    expect(pickSelected([], [], "x")).toBeUndefined();
  });
});

describe("parseSavedStories", () => {
  it("returns null for missing, malformed or non-array JSON", () => {
    expect(parseSavedStories(null)).toBeNull();
    expect(parseSavedStories("")).toBeNull();
    expect(parseSavedStories("{bad")).toBeNull();
    expect(parseSavedStories('{"id":"retrieval"}')).toBeNull();
  });

  it("takes only boolean read/saved flags of known ids and keeps the authored text", () => {
    const raw = JSON.stringify([
      { id: "retrieval", read: true, saved: "yes", title: "Hacked headline" },
      { id: "unknown", read: true },
      null,
      { id: "small-models", saved: false },
    ]);
    const stories = parseSavedStories(raw)!;
    expect(ids(stories)).toEqual(ids(SEED));
    const retrieval = stories.find((story) => story.id === "retrieval")!;
    expect(retrieval.read).toBe(true);
    expect(retrieval.saved).toBe(false);
    expect(retrieval.title).toBe("Retrieval is a product decision, not a search box");
    expect(stories.find((story) => story.id === "small-models")?.saved).toBe(false);
  });

  it("round-trips the stories the page writes", () => {
    const changed = updateStory(SEED, "shipping", { read: true });
    expect(parseSavedStories(serializeStories(changed))).toEqual(changed);
  });
});

describe("createStoryStore", () => {
  it("serves the authored edition on the server, when nothing is saved and when the save is corrupt", () => {
    expect(createStoryStore(() => fakeStorage()).getServerSnapshot()).toBe(SEED);
    expect(createStoryStore(() => fakeStorage()).getSnapshot()).toBe(SEED);
    expect(createStoryStore(() => fakeStorage({ [STORAGE_KEY]: '{"not":"a list"}' })).getSnapshot()).toBe(SEED);
  });

  it("returns the same array while storage is unchanged", () => {
    const store = createStoryStore(() => fakeStorage({ [STORAGE_KEY]: serializeStories(SEED) }));
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  it("writes flag changes to storage and notifies subscribers", () => {
    const storage = fakeStorage();
    const store = createStoryStore(() => storage);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.update((current) => updateStory(current, "interfaces", { saved: true }));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(queueCounts(parseSavedStories(storage.data.get(STORAGE_KEY) ?? null)!).saved).toBe(2);
    unsubscribe();
    store.update((current) => current);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("keeps working in memory when storage throws", () => {
    const blocked = () => {
      throw new Error("blocked");
    };
    const store = createStoryStore(() => ({ getItem: blocked, setItem: blocked }));
    store.update((current) => updateStory(current, "retrieval", { read: true }));
    expect(queueCounts(store.getSnapshot()).unread).toBe(3);
  });
});
