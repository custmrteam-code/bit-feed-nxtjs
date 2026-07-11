"use client";

// Related articles, ported from loadRelated in articles/article.js. Computed
// from the local search cache (tag overlap, 0 extra reads). Shows a shimmer
// skeleton until resolved; renders nothing if there are no active matches.

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLocalRelatedArticles } from "@/lib/data/searchCache";
import type { SearchableArticle } from "@/lib/firebase/types";

function Skeleton() {
  return (
    <div id="related-skeleton-view">
      <div className="sk-more-hr" />
      <div className="skeleton sk-related-heading" />
      <div className="related-articles">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton sk-related-img" />
            <div className="skeleton sk-related-title" />
            <div className="skeleton sk-related-title short" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RelatedArticles({
  tags,
  currentId,
}: {
  tags: string[];
  currentId: string;
}) {
  const [related, setRelated] = useState<SearchableArticle[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    // getLocalRelatedArticles resolves to [] for empty tags, so setState always
    // happens inside the promise callback (not synchronously in the effect).
    getLocalRelatedArticles(tags, currentId).then((items) => {
      if (!cancelled) setRelated(items.filter((a) => a.status === "active"));
    });
    return () => {
      cancelled = true;
    };
  }, [tags, currentId]);

  if (related === null) return <Skeleton />;
  if (related.length === 0) return null;

  return (
    <div id="related-real-view" className="fade-in">
      <h2>Related News</h2>
      <hr className="more" />
      <div id="related-container" className="related-articles">
        {related.map((item) => (
          <div key={item.id}>
            <Link href={`/articles/${item.id}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="rel-img"
                src={item.imageUrl || "/assets/favicon.png"}
                alt="Related"
              />
            </Link>
            <h3>
              <Link href={`/articles/${item.id}`}>{item.title}</Link>
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
}
