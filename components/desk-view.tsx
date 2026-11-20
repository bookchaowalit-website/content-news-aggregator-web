"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { DESK_HASH_DELAY, deskState, getHash, getServerHash, parseDeskHash, subscribeHash, writeDeskHash } from "@/lib/desk-hash";
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
  // The cut comes from the fragment (so Back, Forward and shared links restore it) until the reader edits it; the edit
  // then owns the view (a typed trailing space is not trimmed away by the round trip) for as long as the address still
  // shows the fragment it was made on (until the write lands) or the one it wrote. Any other fragment came from
  // navigation and wins again.
  const hash = useSyncExternalStore(subscribeHash, getHash, getServerHash);
  const fromHash = parseDeskHash(hash);
  const [edit, setEdit] = useState<{ query: string; filter: Filter; base: string | null } | null>(null);
  const edited = edit && (hash === edit.base || hash === deskState(edit.query, edit.filter)) ? edit : null;
  const query = edited?.query ?? fromHash.q;
  const filter: Filter = edited?.filter ?? (isCategory(fromHash.beat) ? fromHash.beat : "All");
  const setEdited = (next: { query: string; filter: Filter }) => setEdit({ ...next, base: hash });
  const setQuery = (next: string) => setEdited({ query: next, filter });
  const setFilter = (next: Filter) => setEdited({ query, filter: next });
  const from = deskState(query, filter);
  // Keep the fragment in step with an edited view once typing pauses (one History call, not one per keystroke).
  useEffect(() => {
    if (!edited) return;
    const timer = window.setTimeout(() => {
      // Written: from now on only that fragment keeps the edit; going back to the old one is navigation.
      if (writeDeskHash(from)) setEdit((current) => (current ? { ...current, base: null } : current));
    }, DESK_HASH_DELAY);
    return () => window.clearTimeout(timer);
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
