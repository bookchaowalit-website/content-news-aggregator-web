"use client";

import { useState, useSyncExternalStore } from "react";
import { ArticleHeader, Pager, Prose, neighbours, type PagerLink } from "@/components/reader-shell";
import { NewsFrame } from "@/components/news-frame";
import { SEED, filterStories, isCategory, storyStore, updateStory, type Story } from "@/lib/news";
import { deskState } from "@/components/desk-view";

/**
 * One note: header, summary, why read it, then Mark as read / Save for later (this browser only) and previous / next.
 * Opened from a searched or filtered edition (?q= / ?beat=), Back returns to it and previous / next stay inside it.
 */
export function StoryView({ id, q = "", beat = "" }: { id: string; q?: string; beat?: string }) {
  const stories = useSyncExternalStore(storyStore.subscribe, storyStore.getSnapshot, storyStore.getServerSnapshot);
  const [notice, setNotice] = useState("");
  const story = stories.find((s) => s.id === id) ?? SEED.find((s) => s.id === id)!;
  const cut = filterStories(stories, isCategory(beat) ? beat : "All", q);
  const inCut = cut.some((s) => s.id === id);
  const list = inCut ? cut : stories;
  const from = inCut ? deskState(q, isCategory(beat) ? beat : "") : "";
  const { previous, next } = neighbours(list, list.findIndex((s) => s.id === id));
  const link = (s?: Story): PagerLink | undefined => (s ? { href: `/stories/${s.id}${from}`, title: s.title } : undefined);
  const change = (changes: Pick<Partial<Story>, "read" | "saved">, message: string) => {
    storyStore.update((current) => updateStory(current, story.id, changes));
    setNotice(message);
  };
  return (
    <NewsFrame>
      <article className="rs-article">
        <ArticleHeader back={{ href: `/${from}`, label: "The edition" }} tags={[story.category]} title={story.title} lede={story.summary} meta={[story.source, `${story.readMinutes} min read`, story.time]} />
        <Prose>
          <h2>Why read it</h2>
          <p>{story.why}</p>
        </Prose>
        <div className="rs-actions" role="group" aria-label="This note">
          <button type="button" className="rs-button" aria-pressed={story.read} onClick={() => change({ read: !story.read }, story.read ? "Marked unread." : "Marked read in this browser.")}>
            {story.read ? "Mark unread" : "Mark as read"}
          </button>
          <button type="button" className="rs-plain" aria-pressed={story.saved} onClick={() => change({ saved: !story.saved }, story.saved ? "Removed from saved." : "Saved for later in this browser.")}>
            {story.saved ? "Remove from saved" : "Save for later"}
          </button>
        </div>
        <p className="rs-count" role="status">{notice}</p>
        <Pager previous={link(previous)} next={link(next)} label="More in this edition" />
      </article>
    </NewsFrame>
  );
}
