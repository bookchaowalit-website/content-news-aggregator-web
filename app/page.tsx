"use client";

import { useState, useSyncExternalStore } from "react";
import { CATEGORIES, SEED, countBy, filterStories, pickSelected, queueCounts, storyStore, updateStory, type Filter, type Story } from "@/lib/news";

export default function Home() {
  const stories = useSyncExternalStore(storyStore.subscribe, storyStore.getSnapshot, storyStore.getServerSnapshot);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [selectedId, setSelectedId] = useState(SEED[0]?.id ?? "");
  const [notice, setNotice] = useState("");

  const visible = filterStories(stories, filter, query);
  const selected = pickSelected(stories, visible, selectedId);
  const { unread: unreadCount, saved: savedCount } = queueCounts(stories);

  function changeStory(id: string, changes: Pick<Partial<Story>, "read" | "saved">, message: string) {
    storyStore.update((current) => updateStory(current, id, changes));
    setNotice(message);
  }

  return (
    <main className="news-desk">
      <div className="desk-frame">
        <header className="desk-header">
          <div className="desk-mark"><span className="mark-rule" aria-hidden="true" />NEWS DESK</div>
          <p>SAMPLE EDITION · PRIVATE READING QUEUE</p>
        </header>

        <section className="desk-masthead" aria-labelledby="page-title">
          <div>
            <h1 id="page-title">What deserves a closer look?</h1>
            <p>A small briefing for the moment between noticing a headline and deciding whether it belongs in your day.</p>
          </div>
          <div className="edition-stamp">
            <span>EDITION 01</span>
            <strong>23 AUG<br />2026</strong>
            <span>CURATED SAMPLE · NOT LIVE NEWS</span>
          </div>
        </section>

        <section className="desk-body" aria-label="News reading desk">
          <aside className="desk-sidebar">
            <div className="sidebar-block">
              <p className="label">READING QUEUE</p>
              <div className="queue-line"><span>Unread</span><strong>{unreadCount.toString().padStart(2, "0")}</strong></div>
              <div className="queue-line"><span>Saved for later</span><strong>{savedCount.toString().padStart(2, "0")}</strong></div>
            </div>
            <div className="sidebar-block beat-block">
              <p className="label">FILTER BY BEAT</p>
              <div className="beat-list" role="group" aria-label="Filter stories by beat">
                {(["All", ...CATEGORIES] as const).map((item) => (
                  <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)}>
                    <span>{item}</span><small>{countBy(stories, item)}</small>
                  </button>
                ))}
              </div>
            </div>
            <p className="sidebar-note">This desk contains five deterministic sample notes. There is no feed connection behind it.</p>
          </aside>

          <div className="desk-reading">
            <div className="reading-tools">
              <label className="search-line">
                <span>SEARCH THE EDITION</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Headline, source, or beat" />
              </label>
              <span className="result-count">{visible.length} OF {stories.length} NOTES</span>
            </div>

            {selected && (
              <article className="lead-story" aria-labelledby="story-title">
                <div className="story-kicker"><span>{selected.category}</span><span>{selected.source}</span></div>
                <h2 id="story-title">{selected.title}</h2>
                <p className="lead-summary">{selected.summary}</p>
                <div className="why-read"><span className="label">WHY READ IT</span><p>{selected.why}</p></div>
                <div className="story-actions">
                  <button type="button" className="primary-action" aria-pressed={selected.read} onClick={() => changeStory(selected.id, { read: !selected.read }, selected.read ? "Marked unread." : "Marked read for this browser.")}>{selected.read ? "Mark unread" : "Mark as read"}</button>
                  <button type="button" className="secondary-action" aria-pressed={selected.saved} onClick={() => changeStory(selected.id, { saved: !selected.saved }, selected.saved ? "Removed from saved notes." : "Saved for later in this browser.")}>{selected.saved ? "Remove saved note" : "Save for later"}</button>
                  <span className="story-time">{selected.readMinutes} MIN READ · {selected.time}</span>
                </div>
                <p className="story-notice" role="status" aria-live="polite">{notice}</p>
              </article>
            )}

            <div className="story-list-heading"><p className="label">THE REST OF THE EDITION</p><span>Select a row to change the reading</span></div>
            {visible.length > 0 ? (
              <ol className="story-list">
                {visible.map((story) => (
                  <li key={story.id}>
                    <button type="button" className={`story-row${selected?.id === story.id ? " is-selected" : ""}`} onClick={() => { setSelectedId(story.id); setNotice(""); }}>
                      <span className="story-row-index">{story.read ? "READ" : "NEW"}</span>
                      <span className="story-row-main"><strong>{story.title}</strong><span>{story.category} · {story.source}</span></span>
                      <span className="story-row-end"><span>{story.time}</span><span className={`saved-mark${story.saved ? " is-saved" : ""}`} aria-hidden="true" /></span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="empty-desk"><strong>No story in this cut.</strong><span>Try another beat or clear the search.</span></div>
            )}
          </div>
        </section>

        <footer className="desk-footer"><span>NEWS DESK · EDITION 01</span><span>Context before click. Sample content, plainly labelled.</span></footer>
      </div>
    </main>
  );
}
