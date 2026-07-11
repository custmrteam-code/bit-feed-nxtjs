"use client";

// Realtime "latest news" timeline, ported from initLatestNews in main/index.js.
// On mobile, the first tap on a closed card expands it (accordion); a second tap
// follows the link. Desktop hover handles expansion via CSS.

import { useState } from "react";
import Link from "next/link";
import { useLatestNews } from "@/hooks/useLatestNews";
import { capitalizeWords } from "@/lib/utils/text";
import { formatDate, getTimeAgo } from "@/lib/utils/dates";

function SkeletonTicker() {
  return (
    <div id="latest-skeleton-view">
      <article className="timeline">
        {Array.from({ length: 5 }).map((_, i) => (
          <section className="timeline-item" key={i}>
            <div className="skeleton sk-time" />
            <div
              className="news-card"
              style={{
                height: 10,
                width: "100%",
                marginLeft: 50,
                marginTop: -5,
              }}
            >
              <div className="skeleton sk-news-title" />
              <div className="sk-news-detail" />
            </div>
          </section>
        ))}
      </article>
    </div>
  );
}

export function LatestTicker() {
  const { articles, loading } = useLatestNews();
  const [activeId, setActiveId] = useState<string | null>(null);

  if (loading) return <SkeletonTicker />;

  if (!articles || articles.length === 0) {
    return <p style={{ padding: 20 }}>No updates yet.</p>;
  }

  return (
    <div id="latest-real-view" className="fade-in">
      <article id="latest-news-container" className="timeline">
        {articles.map((article) => {
          const isActive = activeId === article.id;
          return (
            <section className="timeline-item" key={article.id}>
              <section className="time">{getTimeAgo(article.datePosted)}</section>
              <section className={`news-card${isActive ? " active" : ""}`}>
                <Link
                  href={`/articles/${article.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                  onClick={(e) => {
                    // Mobile: first tap expands instead of navigating.
                    if (window.innerWidth <= 600 && !isActive) {
                      e.preventDefault();
                      setActiveId(article.id);
                    }
                  }}
                >
                  <h3>{capitalizeWords(article.title)}</h3>
                </Link>
                <section className="details">
                  <p>
                    <em>Reported: {formatDate(article.datePosted)}</em>
                  </p>
                  <p>
                    <em>{article.summary}</em>
                  </p>
                </section>
              </section>
            </section>
          );
        })}
      </article>
    </div>
  );
}
