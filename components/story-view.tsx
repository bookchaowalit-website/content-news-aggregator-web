"use client";

import { useState, useSyncExternalStore } from "react";
import { ArticleHeader, Pager, Prose, neighbours, type PagerLink } from "@/components/reader-shell";
import { NewsFrame } from "@/components/news-frame";
import { SEED, storyStore, updateStory, type Story } from "@/lib/news";

/** One note: header, summary, why read it, then Mark as read / Save for later (this browser only) and previous / next. */
export function StoryView({ id }: { id: string }) {
  const stories = useSyncExternalStore(storyStore.subscribe, storyStore.getSnapshot, storyStore.getServerSnapshot);
  const [notice, setNotice] = useState("");
  const index = stories.findIndex((s) => s.id === id);
  const story = stories[index] ?? SEED.find((s) => s.id === id)!;
  const { previous, next } = neighbours(stories, index);
  const link = (s?: Story): PagerLink | undefined => (s ? { href: `/stories/${s.id}`, title: s.title } : undefined);
  const change = (changes: Pick<Partial<Story>, "read" | "saved">, message: string) => {
    storyStore.update((current) => updateStory(current, story.id, changes));
    setNotice(message);
  };
  return (
    <NewsFrame>
      <article className="rs-article">
        <ArticleHeader back={{ href: "/", label: "The edition" }} tags={[story.category]} title={story.title} lede={story.summary} meta={[story.source, `${story.readMinutes} min read`, story.time]} />
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
