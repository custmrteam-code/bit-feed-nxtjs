"use client";

// Single-article reading experience, ported from articles/article.js. Renders
// the SSR article and layers on the client behaviors: view-count increment,
// like, share (Web Share API), difficulty level tabs, the TTS reader, and
// admin/author inline editing with image re-crop.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAuthModal } from "@/components/auth/AuthModal";
import { ArticleReader } from "@/components/article/articleReader";
import { RelatedArticles } from "@/components/article/RelatedArticles";
import { ImageCropper } from "@/components/ui/ImageCropper";
import {
  deleteArticle,
  incrementView,
  isArticleLiked,
  saveArticleEdits,
  toggleLike,
} from "@/lib/data/articleActions.client";
import { formatDate } from "@/lib/utils/dates";
import type { Article, ContentLevel } from "@/lib/firebase/types";

const FALLBACK = "/assets/default-user.png";

export function ArticleView({ article }: { article: Article }) {
  const { user, role } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const router = useRouter();

  const [level, setLevel] = useState<ContentLevel>("intermediate");
  const [liked, setLiked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFeatured, setIsFeatured] = useState(Boolean(article.isFeatured));
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState(article.imageUrl || FALLBACK);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const reader = useRef<ArticleReader | null>(null);
  const firstLevelRun = useRef(true);

  const isAdmin = role === "admin";
  const isAuthor = Boolean(
    user?.email && article.authorEmail && user.email === article.authorEmail,
  );
  const canEdit = isAdmin || isAuthor;

  // Difficulty-level bodies (live code uses flat content* fields).
  const versions = useMemo<Record<ContentLevel, string>>(
    () => ({
      intermediate: article.content || "",
      beginner: article.contentBeginner
        ? article.contentBeginner
        : "<p><em>(Beginner version not available for this article. Showing standard content.)</em></p>" +
          article.content,
      pro: article.contentPro
        ? article.contentPro
        : "<p><em>(Pro version not available for this article. Showing standard content.)</em></p>" +
          article.content,
    }),
    [article.content, article.contentBeginner, article.contentPro],
  );

  // Record a view once on mount.
  useEffect(() => {
    incrementView(article.id);
  }, [article.id]);

  // Resolve the user's like state when auth settles. isArticleLiked returns
  // false when signed out, so setState stays inside the promise callback.
  useEffect(() => {
    let cancelled = false;
    isArticleLiked(article.id).then((v) => {
      if (!cancelled) setLiked(v);
    });
    return () => {
      cancelled = true;
    };
  }, [user, article.id]);

  // Instantiate the TTS reader after mount; tear it down on unmount.
  useEffect(() => {
    const instance = new ArticleReader();
    reader.current = instance;
    return () => instance.destroy();
  }, []);

  // On level change, stop reading and re-tokenize the new content.
  useEffect(() => {
    if (firstLevelRun.current) {
      firstLevelRun.current = false;
      return;
    }
    reader.current?.stopReading();
    document.getElementById("progress-bar-vertical")?.classList.add("hidden");
    const t = setTimeout(() => reader.current?.prepareArticleText(), 160);
    return () => clearTimeout(t);
  }, [level]);

  const handleLike = useCallback(async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    const next = !liked;
    setLiked(next);
    try {
      await toggleLike(article.id, liked);
    } catch (e) {
      setLiked(liked); // revert on failure
      console.error("Error toggling like:", e);
    }
  }, [user, liked, article.id, openAuthModal]);

  const handleShare = useCallback(async () => {
    const title = article.title || document.title;
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `${title}\n\nRead more here:`,
          url: window.location.href,
        });
      } catch (e) {
        if ((e as Error).name !== "AbortError") console.error(e);
      }
    }
  }, [article.title]);

  // ---- Inline edit ----
  const enterEdit = () => {
    reader.current?.stopReading();
    setLevel("intermediate");
    setIsFeatured(Boolean(article.isFeatured));
    setIsEditing(true);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fr = new FileReader();
    fr.onload = (ev) => setCropperSrc(ev.target?.result as string);
    fr.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveArticleEdits(article.id, {
        title: titleRef.current?.innerText ?? article.title,
        content: contentRef.current?.innerHTML ?? article.content,
        isFeatured,
        wasFeatured: Boolean(article.isFeatured),
        imageUrl: newImage,
      });
      alert("Article Updated Successfully!");
      router.refresh();
      setIsEditing(false);
    } catch (e) {
      alert("Error updating article: " + (e as Error).message);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this article? This action cannot be undone.",
      )
    )
      return;
    try {
      await deleteArticle(article.id);
      alert("Article deleted successfully.");
      router.push("/");
    } catch (e) {
      alert("Failed to delete article: " + (e as Error).message);
    }
  };

  // The content node remounts when level/edit changes (drops reader spans).
  const contentKey = `${level}-${isEditing ? "edit" : "read"}`;
  const contentHtml = isEditing ? article.content : versions[level];

  return (
    <>
      <section className="main article-page">
        <div id="real-view" className="fade-in">
          <h1
            id="news-headline"
            ref={titleRef}
            contentEditable={isEditing}
            suppressContentEditableWarning
            style={isEditing ? { border: "2px dashed #ccc" } : undefined}
          >
            {article.title}
          </h1>
          <br />
          <p id="news-date" className="date">
            {formatDate(article.datePosted)}
          </p>
          <hr className="last-hr" />

          <div className="article-meta">
            <div className="author-profile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.authorImage || FALLBACK}
                alt={article.authorName || "Author"}
                className="author-avatar"
              />
              <div className="author-info">
                <span className="author-name">
                  {article.authorName || "Editor"}
                </span>
              </div>
            </div>

            <div className="article-actions">
              {canEdit && !isEditing && (
                <a onClick={enterEdit}>Edit</a>
              )}
              <a onClick={handleShare}>
                Share
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/share icon unfilled.png" className="s-icon s-icon1" alt="" />
              </a>
              <a onClick={handleLike}>
                {liked ? "Liked" : "Like"}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    liked
                      ? "/assets/like icon filled.png"
                      : "/assets/like icon unfilled.png"
                  }
                  className="s-icon s-icon2"
                  alt=""
                />
              </a>
            </div>
          </div>

          {isEditing && (
            <div
              id="featured-edit-row"
              style={{
                margin: "20px 0",
                padding: 10,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <input
                type="checkbox"
                id="edit-is-featured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                style={{
                  width: 18,
                  height: 18,
                  accentColor: "#d73634",
                  cursor: "pointer",
                }}
              />
              <label
                htmlFor="edit-is-featured"
                style={{ fontSize: "0.95rem", fontWeight: 500, cursor: "pointer" }}
              >
                Mark this article as Featured (Max 2 allowed)
              </label>
            </div>
          )}

          {/* Reader controls (desktop vertical bar). */}
          <div id="reader-container-vertical">
            <div id="progress-bar-vertical" className="hidden">
              <div id="progress-fill-vertical">
                <div id="progress-handle-vertical" />
              </div>
              <div id="progress-end-marker" />
            </div>
            <button id="play-pause-btn-circle" aria-label="Play article">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>

          {/* Reader controls (mobile horizontal bar). */}
          <div id="mobile-progress-container">
            <div id="progress-bar-horizontal">
              <div id="progress-fill-horizontal">
                <div id="progress-handle-horizontal" />
              </div>
              <div id="progress-end-marker-horizontal" />
            </div>
          </div>

          <figure>
            {isEditing ? (
              <div
                className="edit-img-wrapper"
                onClick={() => fileRef.current?.click()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageSrc} alt={article.title} id="news-img" />
                <div className="img-upload-overlay">
                  <span>Click to Change Image</span>
                </div>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageSrc} alt={article.title} id="news-img" />
            )}
            <br />
          </figure>
          <input
            type="file"
            ref={fileRef}
            accept="image/*"
            hidden
            onChange={handleFile}
          />

          <div className="level-selection-wrapper">
            <div className="level-tabs">
              <button
                className={`level-tab${level === "beginner" ? " active" : ""}`}
                onClick={() => setLevel("beginner")}
              >
                Beginner
              </button>
              <button
                className={`level-tab${level === "intermediate" ? " active" : ""}`}
                onClick={() => setLevel("intermediate")}
              >
                Technical
              </button>
              <button
                className={`level-tab${level === "pro" ? " active" : ""}`}
                onClick={() => setLevel("pro")}
              >
                Economist
              </button>
            </div>
          </div>

          <div
            id="article-content"
            key={contentKey}
            ref={contentRef}
            contentEditable={isEditing}
            suppressContentEditableWarning
            style={isEditing ? { border: "2px dashed #ccc" } : undefined}
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          <hr className="last-hr" />

          {article.tags.length > 0 && (
            <section className="tags">
              {article.tags.map((tag) => (
                <div className="article-tags" key={tag}>
                  <a>{tag}</a>
                </div>
              ))}
            </section>
          )}
        </div>
      </section>

      <section className="more-news">
        <RelatedArticles tags={article.tags} currentId={article.id} />
      </section>

      {isEditing && (
        <div id="edit-toolbar" className="edit-actions-bar">
          {isAdmin && (
            <button
              className="btn-cancel-edit"
              onClick={handleDelete}
              style={{
                color: "#d73634",
                borderColor: "#d73634",
                marginRight: "auto",
              }}
            >
              Delete Article
            </button>
          )}
          <button
            className="btn-cancel-edit"
            onClick={() => window.location.reload()}
          >
            Cancel
          </button>
          <button
            className="btn-save-edit"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      <ImageCropper
        src={cropperSrc}
        onCancel={() => setCropperSrc(null)}
        onSave={(base64) => {
          setNewImage(base64);
          setImageSrc(base64);
          setCropperSrc(null);
        }}
      />
    </>
  );
}
