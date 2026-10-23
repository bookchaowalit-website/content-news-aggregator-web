// News Desk: the five authored sample stories, the list rules and the per-browser read/saved store.
// Everything here is pure or works through a storage object passed in, so it can be tested without a browser.

export type Category = "Signals" | "Products" | "Research" | "Practice";
export type Filter = "All" | Category;

export type Story = {
  id: string;
  category: Category;
  source: string;
  title: string;
  summary: string;
  why: string;
  time: string;
  readMinutes: number;
  read: boolean;
  saved: boolean;
};

export const CATEGORIES: Category[] = ["Signals", "Products", "Research", "Practice"];

export const SEED: Story[] = [
  {
    id: "small-models",
    category: "Signals",
    source: "FIELD NOTE / COMPUTING",
    title: "Small models are changing what a useful tool can be",
    summary: "When capability becomes cheap enough to sit inside the workflow, the product question moves from access to judgment.",
    why: "Useful for deciding where an AI feature should stay quiet, local, and inspectable.",
    time: "08:40",
    readMinutes: 4,
    read: false,
    saved: true,
  },
  {
    id: "calm-software",
    category: "Products",
    source: "DESIGN DESK / INTERFACES",
    title: "The best interface may be the one that leaves room to think",
    summary: "A product can communicate confidence through pacing, hierarchy, and the restraint to keep a secondary action secondary.",
    why: "A useful counterweight when a portfolio surface starts accumulating features faster than meaning.",
    time: "YESTERDAY",
    readMinutes: 6,
    read: true,
    saved: false,
  },
  {
    id: "retrieval",
    category: "Research",
    source: "RESEARCH LOG / KNOWLEDGE",
    title: "Retrieval is a product decision, not a search box",
    summary: "The shape of a memory system determines which questions feel askable and which context quietly disappears.",
    why: "Worth reading before adding another index, tag, or filter to a personal knowledge tool.",
    time: "18 AUG",
    readMinutes: 5,
    read: false,
    saved: false,
  },
  {
    id: "shipping",
    category: "Practice",
    source: "STUDIO MEMO / SOLO WORK",
    title: "Shipping small is a way to protect attention",
    summary: "A narrow release creates a real surface to learn from; a perfect plan mostly creates another place to hide.",
    why: "A reminder for choosing the next experiment without exposing the whole operating system.",
    time: "16 AUG",
    readMinutes: 3,
    read: false,
    saved: false,
  },
  {
    id: "interfaces",
    category: "Products",
    source: "OBSERVATION / WEB",
    title: "A page can feel fast before it is technically fast",
    summary: "Clear anticipation, stable layout, and a visible first answer reduce the feeling of waiting more than motion alone.",
    why: "Useful when tuning page transitions and deciding what should appear before a route settles.",
    time: "12 AUG",
    readMinutes: 4,
    read: false,
    saved: false,
  },
];

export const STORAGE_KEY = "news-desk-v2";

export function isCategory(value: unknown): value is Category {
  return (CATEGORIES as readonly unknown[]).includes(value);
}

/** Beat filter plus case-insensitive search over headline, summary, source and beat. */
export function filterStories(stories: Story[], filter: Filter, query: string): Story[] {
  const needle = query.trim().toLowerCase();
  return stories.filter((story) => {
    const matchesFilter = filter === "All" || story.category === filter;
    const matchesQuery = !needle || `${story.title} ${story.summary} ${story.source} ${story.category}`.toLowerCase().includes(needle);
    return matchesFilter && matchesQuery;
  });
}

export function countBy(stories: Story[], filter: Filter): number {
  return filter === "All" ? stories.length : stories.filter((story) => story.category === filter).length;
}

export function queueCounts(stories: Story[]) {
  return { unread: stories.filter((story) => !story.read).length, saved: stories.filter((story) => story.saved).length };
}

export function updateStory(stories: Story[], id: string, changes: Pick<Partial<Story>, "read" | "saved">): Story[] {
  return stories.map((story) => (story.id === id ? { ...story, ...changes } : story));
}

/** The selected story, else the first visible one, else the first story. */
export function pickSelected(stories: Story[], visible: Story[], selectedId: string): Story | undefined {
  return stories.find((story) => story.id === selectedId) ?? visible[0] ?? stories[0];
}

/**
 * Saved read/saved flags laid over the authored edition, or null when nothing usable is saved. Only boolean
 * read/saved values of known story ids are taken from storage; the story text always comes from SEED.
 */
export function parseSavedStories(raw: string | null): Story[] | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(value)) return null;
  const flags = new Map<string, { read?: boolean; saved?: boolean }>();
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null || typeof (entry as { id?: unknown }).id !== "string") continue;
    const { id, read, saved } = entry as { id: string; read?: unknown; saved?: unknown };
    flags.set(id, { ...(typeof read === "boolean" ? { read } : {}), ...(typeof saved === "boolean" ? { saved } : {}) });
  }
  return SEED.map((story) => ({ ...story, ...flags.get(story.id) }));
}

export function serializeStories(stories: Story[]): string {
  return JSON.stringify(stories);
}

type StorageLike = { getItem(key: string): string | null; setItem(key: string, value: string): void };

/**
 * A store for useSyncExternalStore. The server snapshot is the authored edition, so the first client render matches
 * the server HTML; saved flags appear right after hydration. If storage is blocked, flags last for the visit.
 */
export function createStoryStore(getStorage: () => StorageLike | undefined, key = STORAGE_KEY) {
  let current: Story[] = SEED;
  let lastRaw: string | null = null;
  const listeners = new Set<() => void>();

  function getSnapshot(): Story[] {
    let raw: string | null;
    try {
      raw = getStorage()?.getItem(key) ?? null;
    } catch {
      return current;
    }
    if (raw === null || raw === lastRaw) return current;
    lastRaw = raw;
    current = parseSavedStories(raw) ?? SEED;
    return current;
  }

  function update(change: (stories: Story[]) => Story[]) {
    current = change(getSnapshot());
    try {
      const raw = serializeStories(current);
      getStorage()?.setItem(key, raw);
      lastRaw = raw;
    } catch {
      // Storage is full or blocked: keep the flags in memory.
    }
    for (const listener of listeners) listener();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    if (typeof window !== "undefined") window.addEventListener("storage", listener);
    return () => {
      listeners.delete(listener);
      if (typeof window !== "undefined") window.removeEventListener("storage", listener);
    };
  }

  return { getSnapshot, getServerSnapshot: () => SEED, subscribe, update };
}

export const storyStore = createStoryStore(() => (typeof window === "undefined" ? undefined : window.localStorage));
