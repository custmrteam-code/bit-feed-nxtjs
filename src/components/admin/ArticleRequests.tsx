"use client";

// Article moderation queue, ported from admin/article-requests.js. Lists all
// articles (Today / Yesterday / Day-before, pending first), and opens a detail
// editor to approve+publish (with image re-crop) or reject.

import { Fragment, useCallback, useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ImageCropper } from "@/components/ui/ImageCropper";
import {
  approveArticle,
  deleteArticleDoc,
  loadArticleBuckets,
  type ArticleBuckets,
} from "@/lib/data/admin.client";
import { formatDate } from "@/lib/utils/dates";
import type { Article } from "@/lib/firebase/types";

function Card({
  article,
  onOpen,
}: {
  article: Article;
  onOpen: (a: Article) => void;
}) {
  const isPending = article.status === "pending";
  return (
    <div className="req-card" onClick={() => onOpen(article)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={article.imageUrl} className="card-img" alt={article.title} />
      <div className="card-content">
        <div className="card-title">{article.title}</div>
        <div className="card-meta">
          by {article.authorName} | {formatDate(article.datePosted)}
        </div>
        <div className="card-summary">{article.summary}</div>
        <div className="status-line">
          Status:{" "}
          <span className={`status-val ${isPending ? "status-red" : "status-black"}`}>
            {isPending ? "Pending" : "Approved"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ArticleRequests() {
  const [buckets, setBuckets] = useState<ArticleBuckets | null>(null);
  const [selected, setSelected] = useState<Article | null>(null);

  // Detail-edit state.
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [cBeginner, setCBeginner] = useState("");
  const [cInter, setCInter] = useState("");
  const [cPro, setCPro] = useState("");
  const [featured, setFeatured] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Refresh after an action (event-driven; resetting to loading here is fine
  // because it runs from a handler, not an effect).
  const reload = useCallback(() => {
    setBuckets(null);
    loadArticleBuckets().then(setBuckets);
  }, []);

  // Initial load — setState only inside the promise callback.
  useEffect(() => {
    loadArticleBuckets().then(setBuckets);
  }, []);

  const openDetail = (a: Article) => {
    setSelected(a);
    setTitle(a.title);
    setSummary(a.summary);
    setCBeginner(a.contentBeginner ?? "");
    setCInter(a.content ?? "");
    setCPro(a.contentPro ?? "");
    setFeatured(Boolean(a.isFeatured));
    setImageUrl(a.imageUrl ?? "");
    window.scrollTo(0, 0);
  };

  const closeDetail = () => {
    setSelected(null);
    window.scrollTo(0, 0);
  };

  const handleApprove = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await approveArticle({
        id: selected.id,
        isNew: selected.status !== "active",
        title,
        summary,
        contentBeginner: cBeginner,
        content: cInter,
        contentPro: cPro,
        imageUrl,
        isFeatured: featured,
      });
      closeDetail();
      reload();
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await deleteArticleDoc(selected.id);
      closeDetail();
      reload();
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file?.type.startsWith("image/")) return;
    const fr = new FileReader();
    fr.onload = (ev) => setCropperSrc(ev.target?.result as string);
    fr.readAsDataURL(file);
  };

  // ── Detail view ──
  if (selected) {
    const fileId = "edit-file-input";
    return (
      <div className="admin-page">
        <AdminHeader title="Article Review" />
        <div className="admin-container">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className="edit-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="edit-input"
              value={selected.authorName ?? ""}
              readOnly
              style={{ color: "#777" }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Date Posted</label>
            <input
              className="edit-input"
              value={
                selected.datePosted
                  ? new Date(selected.datePosted).toISOString()
                  : ""
              }
              readOnly
              style={{ color: "#777" }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Image (Click to Change)</label>
            <div
              className="img-edit-area"
              onClick={() => document.getElementById(fileId)?.click()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="current-img" src={imageUrl} alt="" />
              <div className="upload-overlay">Click to replace image</div>
              <input
                type="file"
                id={fileId}
                accept="image/*"
                hidden
                onChange={onFile}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Beginner Content</label>
            <textarea
              className="edit-input edit-textarea"
              value={cBeginner}
              onChange={(e) => setCBeginner(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Intermediate Content</label>
            <textarea
              className="edit-input edit-textarea"
              value={cInter}
              onChange={(e) => setCInter(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Pro Content</label>
            <textarea
              className="edit-input edit-textarea"
              value={cPro}
              onChange={(e) => setCPro(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Summary (50 words)</label>
            <textarea
              className="edit-input summary-textarea"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>
          <div className="feature-row">
            <input
              type="checkbox"
              id="check-featured"
              className="feature-checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            <label htmlFor="check-featured" className="feature-label">
              Mark as Featured
            </label>
          </div>
          <div className="action-row">
            <button className="btn-approve" onClick={handleApprove} disabled={busy}>
              {selected.status === "active"
                ? "Update Article"
                : "Approval & Publish"}
            </button>
            <button className="btn-reject" onClick={handleReject} disabled={busy}>
              Reject
            </button>
          </div>
          <button
            className="admin-back"
            style={{ position: "static", marginTop: 20 }}
            onClick={closeDetail}
          >
            ← Back to list
          </button>
        </div>

        <ImageCropper
          src={cropperSrc}
          outputWidth={800}
          outputHeight={500}
          onCancel={() => setCropperSrc(null)}
          onSave={(base64) => {
            setImageUrl(base64);
            setCropperSrc(null);
          }}
        />
      </div>
    );
  }

  // ── List view ──
  const groups: Array<{ label: string; items: Article[] }> = buckets
    ? [
        { label: "Today", items: buckets.today },
        { label: "Yesterday", items: buckets.yesterday },
        { label: buckets.dayBeforeLabel, items: buckets.dayBefore },
      ].filter((g) => g.items.length > 0)
    : [];

  return (
    <div className="admin-page">
      <AdminHeader title="Pending Article Requests" backHref="/admin" />
      <div className="admin-container">
        <div className="warning-box">
          <p className="sub-warning">
            Only Approve <strong>10</strong> articles per day.
          </p>
        </div>

        {buckets === null ? (
          <div style={{ textAlign: "center", color: "#999", marginTop: 50 }}>
            Loading...
          </div>
        ) : groups.length === 0 ? (
          <p style={{ textAlign: "center", color: "#777", marginTop: 50 }}>
            No activity in the last 3 days.
          </p>
        ) : (
          groups.map((group) => (
            <Fragment key={group.label}>
              <span className="date-divider">{group.label}</span>
              {group.items.map((a) => (
                <Card key={a.id} article={a} onOpen={openDetail} />
              ))}
            </Fragment>
          ))
        )}
      </div>
    </div>
  );
}
