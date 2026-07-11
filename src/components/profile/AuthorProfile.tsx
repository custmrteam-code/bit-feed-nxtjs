"use client";

// Public author profile, ported from profile pages/author.js. Receives the
// SSR-fetched author, their articles, and similar reporters; layers on the
// Home/About tabs and follow interactions (which require a signed-in viewer).

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getViewerFollowing,
  toggleFollow,
} from "@/lib/data/authorActions.client";
import { formatDate } from "@/lib/utils/dates";
import type { Article, AuthorDoc } from "@/lib/firebase/types";

const VerifiedIcon = () => (
  <svg
    className="verified-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
      stroke="#d73634"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
      fill="#d73634"
      fillOpacity="0.1"
    />
  </svg>
);

function SimilarReporter({
  author,
  initiallyFollowing,
}: {
  author: AuthorDoc;
  initiallyFollowing: boolean;
}) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(initiallyFollowing);

  const handle = async () => {
    if (!user) return;
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    try {
      await toggleFollow(author.id, wasFollowing);
    } catch {
      setFollowing(wasFollowing);
      alert("Action failed.");
    }
  };

  return (
    <div className="reporter-item">
      <div
        className="reporter-avatar"
        style={{
          backgroundImage: `url('${author.photoURL || "/assets/default-user.png"}')`,
        }}
      >
        <Link
          href={`/author/${encodeURIComponent(author.id)}`}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
      </div>
      <div className="reporter-info">
        <h4>
          <Link
            href={`/author/${encodeURIComponent(author.id)}`}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {author.displayName || author.id}
          </Link>
        </h4>
        <p>{author.specialization || "Reporter"}</p>
      </div>
      <button
        className={`btn-sm-follow${following ? " following" : ""}`}
        onClick={handle}
      >
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}

export function AuthorProfile({
  author,
  articles,
  similar,
}: {
  author: AuthorDoc;
  articles: Article[];
  similar: AuthorDoc[];
}) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"home" | "about">("home");
  const [following, setFollowing] = useState(false);
  const [viewerFollowing, setViewerFollowing] = useState<string[]>([]);

  useEffect(() => {
    // getViewerFollowing resolves to [] for guests, so setState stays in the
    // promise callback (not synchronous in the effect body).
    getViewerFollowing().then((list) => {
      setViewerFollowing(list);
      setFollowing(list.includes(author.id));
    });
  }, [user, author.id]);

  const handleFollow = async () => {
    if (!user) return;
    const was = following;
    setFollowing(!was);
    try {
      await toggleFollow(author.id, was);
    } catch {
      setFollowing(was);
      alert("Action failed.");
    }
  };

  const followersCount = author.followers?.length ?? 0;
  const articlesCount = author.articleCount ?? 0;
  const joined = author.joinedDate
    ? new Date(author.joinedDate).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "--";

  return (
    <main className="profile-container author-page">
      <div
        className="profile-banner"
        style={
          author.bannerURL
            ? { backgroundImage: `url('${author.bannerURL}')` }
            : undefined
        }
      />

      <section className="profile-header">
        <div className="header-content">
          <div className="profile-img-container">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={author.photoURL || "/assets/default-user.png"} alt={author.displayName || "Author"} />
          </div>
          <div className="profile-info">
            <div className="name-row">
              <h1>{author.displayName || "Reporter"}</h1>
              <VerifiedIcon />
            </div>
            <p className="p-tag">{author.specialization || "Reporter"}</p>
            <div className="p-stats">
              <span>{followersCount} followers</span> •{" "}
              <span>{articlesCount} articles</span>
            </div>
            {user && (
              <div className="p-actions">
                <button
                  className={`follow-btn${following ? " following" : ""}`}
                  onClick={handleFollow}
                >
                  {following ? "Following" : "Follow"}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="profile-tabs">
        <button
          className={`tab-btn${tab === "home" ? " active" : ""}`}
          onClick={() => setTab("home")}
        >
          Home
        </button>
        <button
          className={`tab-btn${tab === "about" ? " active" : ""}`}
          onClick={() => setTab("about")}
        >
          About
        </button>
      </div>

      <hr className="profile-divider" />

      <div className="profile-grid">
        <section className="auth-content-area">
          {tab === "home" ? (
            <div id="author-articles-list">
              {articles.length === 0 ? (
                <div style={{ color: "#777", padding: 20 }}>No articles yet.</div>
              ) : (
                articles.map((article) => (
                  <div key={article.id}>
                    <Link
                      href={`/articles/${article.id}`}
                      className="article-card"
                    >
                      <h3>{article.title}</h3>
                      <div className="article-meta">
                        {formatDate(article.datePosted)}
                      </div>
                      <p className="article-summary">
                        {article.summary || "No summary available."}
                      </p>
                    </Link>
                    <hr className="article-separator" />
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="about-details">
              <p className="about-bio">{author.bio || "No bio available."}</p>
              <div className="detail-row">
                <span className="detail-label">Location:</span>
                <span className="detail-value">{author.location || "Earth"}</span>
              </div>
              <div className="about-footer-stats">
                <span>{followersCount}</span> followers .{" "}
                <span>{articlesCount}</span> articles |{" "}
                <span style={{ color: "#d73634", fontStyle: "italic" }}>
                  bitfeed member since <span>{joined}</span>
                </span>
              </div>
            </div>
          )}
        </section>

        <aside className="auth-sidebar">
          <h3 className="section-title">Similar Reporters</h3>
          <div className="following-list">
            {similar.length === 0 ? (
              <p style={{ color: "#999", fontSize: 13 }}>
                No suggestions available.
              </p>
            ) : (
              similar.map((s) => {
                const isFollowing = viewerFollowing.includes(s.id);
                return (
                  <SimilarReporter
                    // Remount when the viewer's following list resolves so the
                    // button initializes with the correct state.
                    key={`${s.id}-${isFollowing}`}
                    author={s}
                    initiallyFollowing={isFollowing}
                  />
                );
              })
            )}
          </div>
          <a href="#" className="see-all-link">
            see more
          </a>
        </aside>
      </div>
    </main>
  );
}
