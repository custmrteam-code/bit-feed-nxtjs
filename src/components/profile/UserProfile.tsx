"use client";

// Logged-in user's profile, ported from user-profile.js. Shows saved articles
// (loaded 3 at a time) and a "Following" sidebar. Redirects guests home.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { getCurrentUserData } from "@/lib/data/profile.client";
import {
  fetchArticlesByIds,
  fetchAuthorsByIds,
  toggleFollow,
} from "@/lib/data/authorActions.client";
import { formatDate } from "@/lib/utils/dates";
import type { Article, AuthorDoc } from "@/lib/firebase/types";

const BATCH = 3;

function SidebarItem({ author }: { author: AuthorDoc }) {
  const [following, setFollowing] = useState(true);
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    setBusy(true);
    try {
      await toggleFollow(author.id, following);
      setFollowing((f) => !f);
    } catch {
      alert("Action failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sidebar-user-item">
      <Link
        href={`/author/${encodeURIComponent(author.id)}`}
        style={{ display: "flex", alignItems: "center", gap: 10 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={author.photoURL || "/assets/default-user.png"}
          alt=""
          style={{ width: 35, height: 35, borderRadius: "50%", objectFit: "cover" }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>
            {author.displayName || author.id}
          </span>
          <span style={{ fontSize: 11, color: "#888" }}>
            {author.specialization || "Reporter"}
          </span>
        </div>
      </Link>
      <button
        className={`follow-btn${following ? " following" : ""}`}
        disabled={busy}
        onClick={handle}
      >
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}

export function UserProfile() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [authors, setAuthors] = useState<AuthorDoc[] | null>(null);
  const [ready, setReady] = useState(false);
  const loadingRef = useRef(false);

  // Redirect guests once auth has settled.
  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  const loadBatch = useCallback(async (ids: string[], from: number) => {
    const next = ids.slice(from, from + BATCH);
    if (next.length === 0) return;
    const fetched = await fetchArticlesByIds(next);
    // Preserve saved order.
    const ordered = next
      .map((id) => fetched.find((a) => a.id === id))
      .filter((a): a is Article => Boolean(a));
    setArticles((prev) => [...prev, ...ordered]);
  }, []);

  // Initial load once the user is known.
  useEffect(() => {
    if (!user || loadingRef.current) return;
    loadingRef.current = true;
    (async () => {
      const data = await getCurrentUserData();
      const ids = data?.savedArticles ?? [];
      const following = data?.following ?? [];
      setSavedIds(ids);
      if (ids.length > 0) await loadBatch(ids, 0);
      const authorDocs =
        following.length > 0 ? await fetchAuthorsByIds(following.slice(0, 10)) : [];
      setAuthors(authorDocs.filter((a) => a.role === "author"));
      setReady(true);
    })();
  }, [user, loadBatch]);

  const hasMore = articles.length < savedIds.length;
  const displayName = user?.displayName || "Reader";

  if (loading || !user) return null;

  return (
    <div className="user-page">
      <div className="container">
        <h1 className="greeting">Hi, {displayName}</h1>

        <h2 className="section-title">Saved News</h2>
        <hr className="header-line" />

        <div className="content-wrapper">
          <div className="main-content">
            <div id="saved-articles-list">
              {!ready && savedIds.length === 0 ? (
                <div className="loader">Loading saved articles...</div>
              ) : articles.length === 0 ? (
                <div className="empty-state">
                  <h3>No saved articles</h3>
                  <p>Bookmark articles to read them later.</p>
                </div>
              ) : (
                articles.map((article) => (
                  <div key={article.id}>
                    <Link
                      href={`/articles/${article.id}`}
                      className="article-card"
                    >
                      <h3>{article.title || "Untitled Article"}</h3>
                      <div className="date">{formatDate(article.datePosted)}</div>
                      <p>
                        {article.summary ||
                          (article.content
                            ? article.content.substring(0, 150) + "..."
                            : "")}
                      </p>
                    </Link>
                    <hr className="article-separator" />
                  </div>
                ))
              )}
            </div>

            {hasMore && (
              <div className="line-with-text">
                <span
                  className="link1 see-more-btn"
                  onClick={() => loadBatch(savedIds, articles.length)}
                >
                  Load more
                </span>
              </div>
            )}
          </div>

          <div className="user-sidebar">
            <div className="sticky-sidebar">
              <h3>Following</h3>
              <div id="sidebar-following-list">
                {authors === null ? (
                  <p style={{ color: "#999", fontSize: 13 }}>Loading...</p>
                ) : authors.length === 0 ? (
                  <div
                    style={{ color: "#999", fontSize: 14, textAlign: "center" }}
                  >
                    You are not following anyone yet.
                  </div>
                ) : (
                  authors.map((author) => (
                    <SidebarItem key={author.id} author={author} />
                  ))
                )}
              </div>
              <Link href="/students" className="see-more">
                find more reporters
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
