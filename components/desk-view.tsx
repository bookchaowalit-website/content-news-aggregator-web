"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { deskState, getHash, getServerHash, parseDeskHash, subscribeHash, writeDeskHash } from "@/lib/desk-hash";
import { EmptyState, EntryList, ReaderHead, ResultCount, SearchForm, type Entry } from "@/components/reader-shell";
import { NewsFrame } from "@/components/news-frame";
import { CATEGORIES, countBy, filterStories, isCategory, queueCounts, storyStore, type Filter, type Story } from "@/lib/news";

// The edition index: live search, beat chips whose counts follow the search, and every story as one row that
// opens its page. The search and beat live in the URL fragment (#q= / #beat=, updated in place, never sent to the
// server), so story links carry them and Back on a story returns to the same cut. Read / saved marks stay in this browser.

export { deskState };

export const storyEntry = (story: Story, from = ""): Entry => ({
  href: `/stories/${story.id}${from}`,
  title: story.title,
  summary: story.summary,
  meta: [story.category, `${story.readMinutes} min read`, story.read ? "Read" : "Unread", ...(story.saved ? ["Saved"] : [])],
});

export function DeskView() {
  const stories = useSyncExternalStore(storyStore.subscribe, storyStore.getSnapshot, storyStore.getServerSnapshot);
  // Until the reader edits the cut, it comes from the fragment (so Back and shared links restore it); after that the
  // view owns it, so a typed trailing space is not trimmed away by the round trip through the address.
  const fromHash = parseDeskHash(useSyncExternalStore(subscribeHash, getHash, getServerHash));
  const [edited, setEdited] = useState<{ query: string; filter: Filter } | null>(null);
  const query = edited?.query ?? fromHash.q;
  const filter: Filter = edited?.filter ?? (isCategory(fromHash.beat) ? fromHash.beat : "All");
  const setQuery = (next: string) => setEdited({ query: next, filter });
  const setFilter = (next: Filter) => setEdited({ query, filter: next });
  const from = deskState(query, filter);
  // Keep the fragment in step with an edited view.
  useEffect(() => {
    if (edited) writeDeskHash(from);
  }, [edited, from]);
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
            <EmptyState title="No note in this cut" action={<button type="button" className="rs-plain" onClick={() => setEdited({ query: "", filter: "All" })}>Show every note</button>}>
              Try another beat or fewer words.
            </EmptyState>
          )}
        </>
      )}
    </NewsFrame>
  );
}
