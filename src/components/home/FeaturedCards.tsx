// Featured articles block, server-rendered for SEO/latency (replacing the
// skeleton→fade-in client swap in main/index.js). Two cards in an alternating
// left/right layout.

import Link from "next/link";
import { capitalizeWords } from "@/lib/utils/text";
import { formatDate } from "@/lib/utils/dates";
import type { Article } from "@/lib/firebase/types";

function FeaturedCard({
  article,
  side,
}: {
  article: Article;
  side: "LEFT" | "RIGHT";
}) {
  const infoClass = side === "LEFT" ? "info1 info" : "info2 info";
  const imgClass = side === "LEFT" ? "img" : "img img2";
  return (
    <Link href={`/articles/${article.id}`}>
      <article className={`Article ${side}`}>
        <figure>
          {/* base64/remote cover image — plain img (data URLs aren't optimizable) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.imageUrl || "/assets/favicon.png"}
            alt={article.title}
            className={imgClass}
          />
        </figure>
        <section className={infoClass}>
          <h3>{capitalizeWords(article.title)}</h3>
          <p className="date">{formatDate(article.datePosted)}</p>
          <p>{article.summary}</p>
        </section>
      </article>
    </Link>
  );
}

export function FeaturedCards({ articles }: { articles: Article[] }) {
  if (articles.length === 0) {
    return (
      <p style={{ color: "var(--color-text-muted)" }}>
        No featured stories yet.
      </p>
    );
  }

  return (
    <div id="featured-real">
      {articles[0] && <FeaturedCard article={articles[0]} side="LEFT" />}
      {articles[1] && (
        <>
          <hr className="line3" />
          <FeaturedCard article={articles[1]} side="RIGHT" />
        </>
      )}
    </div>
  );
}
