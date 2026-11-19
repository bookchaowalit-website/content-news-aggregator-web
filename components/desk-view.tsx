"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { EmptyState, EntryList, ReaderHead, ResultCount, SearchForm, type Entry } from "@/components/reader-shell";
import { NewsFrame } from "@/components/news-frame";
import { CATEGORIES, countBy, filterStories, isCategory, queueCounts, storyStore, type Filter, type Story } from "@/lib/news";

// The edition index: live search, beat chips whose counts follow the search, and every story as one row that
// opens its page. The search and beat live in the address (?q= / ?beat=, updated in place, never fetched), so
// story links carry them and Back on a story returns to the same cut. Read / saved marks stay in this browser.

/** The edition's search and beat as a query string. */
export const deskState = (q = "", beat = "") => `?${new URLSearchParams({ ...(beat && beat !== "All" ? { beat } : {}), ...(q.trim() ? { q: q.trim() } : {}) })}`.replace(/\?$/, "");

export const storyEntry = (story: Story, from = ""): Entry => ({
  href: `/stories/${story.id}${from}`,
  title: story.title,
  summary: story.summary,
  meta: [story.category, `${story.readMinutes} min read`, story.read ? "Read" : "Unread", ...(story.saved ? ["Saved"] : [])],
});

export function DeskView({ initialQuery = "", initialBeat = "" }: { initialQuery?: string; initialBeat?: string }) {
  const stories = useSyncExternalStore(storyStore.subscribe, storyStore.getSnapshot, storyStore.getServerSnapshot);
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<Filter>(isCategory(initialBeat) ? initialBeat : "All");
  const from = deskState(query, filter);
  // Keep the address in step with the view (replaceState: no history entry per keystroke, no request).
  useEffect(() => {
    if (window.location.search !== from) window.history.replaceState(null, "", `${window.location.pathname}${from}`);
  }, [from]);
  const matching = filterStories(stories, "All", query);
  const shown = filterStories(matching, filter, "");
  const { unread, saved } = queueCounts(stories);
  return (
    <NewsFrame>
      <ReaderHead
        eyebrow="Edition 01 · sample notes, not live news"
        title="What deserves a closer look?"
        lede="A small briefing for the moment between noticing a headline and deciding whether it belongs in your day."
      />
      {stories.length === 0 ? (
        <EmptyState title="No notes in this edition">Notes appear here once an edition is written.</EmptyState>
      ) : (
        <>
          <div className="rs-toolbar">
            <SearchForm label="Search the edition" placeholder="Headline, source or beat" value={query} onValueChange={setQuery} onClear={() => setQuery("")} />
            <div className="rs-chips" role="group" aria-label="Filter by beat">
              <ul>
                {(["All", ...CATEGORIES] as const).map((beat) => (
                  <li key={beat}>
                    <button type="button" className="rs-chip" aria-pressed={filter === beat} onClick={() => setFilter(beat)}>
                      {beat}<small>{countBy(matching, beat)}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <ResultCount shown={shown.length} total={stories.length} noun="note" query={query.trim() || undefined} filter={filter === "All" ? undefined : filter} />
            <p className="rs-count">{unread} unread · {saved} saved for later</p>
          </div>
          {shown.length > 0 ? (
            <EntryList entries={shown.map((story) => storyEntry(story, from))} />
          ) : (
            <EmptyState title="No note in this cut" action={<button type="button" className="rs-plain" onClick={() => { setQuery(""); setFilter("All"); }}>Show every note</button>}>
              Try another beat or fewer words.
            </EmptyState>
          )}
        </>
      )}
    </NewsFrame>
  );
}
