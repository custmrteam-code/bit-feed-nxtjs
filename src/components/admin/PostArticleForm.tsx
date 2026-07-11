"use client";

// Post-article form, ported from admin/post-article.js. Captures title, summary,
// up to 3 tags (with contextual suggestions), a cropped 800×500 cover image and
// the body at a chosen difficulty level, then submits as a pending article.

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { createArticle } from "@/lib/data/admin.client";
import type { ContentLevel } from "@/lib/firebase/types";

const ALL_SUGGESTIONS = [
  "AI", "Tech", "Finance", "Economy", "India", "Software",
  "Startup", "Future", "Gadgets", "Market", "Crypto", "Business",
];

const CONTEXT_MAP: Record<string, string[]> = {
  AI: ["Software", "Tech", "Future"],
  Economy: ["Finance", "Market", "India", "Business"],
  Finance: ["Economy", "Crypto", "Market"],
  Tech: ["Gadgets", "Software", "AI"],
  India: ["Economy", "Startup", "Business"],
};

export function PostArticleForm() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [level, setLevel] = useState<ContentLevel>("intermediate");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const authorLabel = user?.displayName || user?.email || "";
  const dateLabel = useMemo(() => new Date().toISOString(), []);

  const suggestions = useMemo(() => {
    const query = tagInput.toLowerCase().trim();
    if (query) {
      return ALL_SUGGESTIONS.filter(
        (s) => s.toLowerCase().includes(query) && !tags.includes(s),
      );
    }
    const related = new Set<string>();
    tags.forEach((t) =>
      CONTEXT_MAP[t]?.forEach((rel) => {
        if (!tags.includes(rel)) related.add(rel);
      }),
    );
    return tags.length < 3 ? Array.from(related) : [];
  }, [tagInput, tags]);

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/[^a-zA-Z0-9 ]/g, "");
    if (tag && !tags.includes(tag) && tags.length < 3) setTags([...tags, tag]);
    setTagInput("");
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file?.type.startsWith("image/")) {
      if (file) alert("Please select a valid image file.");
      return;
    }
    const fr = new FileReader();
    fr.onload = (ev) => setCropperSrc(ev.target?.result as string);
    fr.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      alert("Please upload a cover image.");
      return;
    }
    if (!user) return;
    setBusy(true);
    try {
      await createArticle({
        title,
        summary,
        content,
        targetLevel: level,
        tags,
        imageBase64: image,
        author: user,
      });
      alert(
        "Article Sent for Approval! The remaining versions will be generated automatically.",
      );
      router.push("/");
    } catch (error) {
      alert("Failed to send article: " + (error as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="admin-page">
      <header className="post-header">
        <button
          className="admin-back"
          onClick={() => router.back()}
          aria-label="Back"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            width={25}
            height={25}
            src="https://img.icons8.com/pixels/32/u-turn-to-left.png"
            alt="Back"
          />
        </button>
        <h1>post article</h1>
      </header>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-input" value={authorLabel} readOnly />
          </div>

          <div className="form-group">
            <label>Date Posted</label>
            <input className="form-input" value={dateLabel} readOnly />
          </div>

          <div className="form-group">
            <label>Title</label>
            <input
              className="form-input"
              placeholder="Enter title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Summary (300 characters)</label>
            <input
              className="form-input"
              minLength={50}
              maxLength={300}
              placeholder="Write..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Tags (Type &amp; Press Enter | Max 3)</label>
            <div className="tags-input-container">
              {tags.map((tag, i) => (
                <div className="tag-chip-active" key={tag}>
                  {tag}
                  <span
                    className="tag-remove"
                    onClick={() => setTags(tags.filter((_, idx) => idx !== i))}
                  >
                    &times;
                  </span>
                </div>
              ))}
              <input
                type="text"
                placeholder="Add a tag..."
                autoComplete="off"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(tagInput);
                  } else if (
                    e.key === "Backspace" &&
                    tagInput === "" &&
                    tags.length > 0
                  ) {
                    setTags(tags.slice(0, -1));
                  }
                }}
              />
            </div>
            {suggestions.length > 0 && tags.length < 3 && (
              <div className="tag-suggestions">
                <p style={{ fontSize: "0.8rem", color: "#888" }}>Suggestions:</p>
                <div className="suggestions-list">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="suggestion-btn"
                      onClick={() => addTag(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Image</label>
            <div
              className="file-drop-area"
              onClick={() => fileRef.current?.click()}
            >
              <input
                type="file"
                accept="image/*"
                hidden
                ref={fileRef}
                onChange={onFile}
              />
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="Preview" className="admin-img-preview" />
              ) : (
                <div className="drop-content">
                  <svg
                    className="upload-icon"
                    width={24}
                    height={24}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="drop-text">Drop your files here or browse</span>
                  <span className="drop-subtext">Max file size up to 1 MB</span>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Target Audience Level</label>
            <select
              className="form-input"
              value={level}
              onChange={(e) => setLevel(e.target.value as ContentLevel)}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate (Standard)</option>
              <option value="pro">Professional</option>
            </select>
            <p style={{ fontSize: "0.75rem", color: "#888", marginTop: 5 }}>
              Note: The other two levels will be generated automatically via AI.
            </p>
          </div>

          <div className="form-group">
            <label>Content</label>
            <textarea
              className="form-input textarea"
              placeholder="Write..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={busy}>
            {busy ? "Sending..." : "Send for Approval"}
          </button>
        </form>
      </div>

      <ImageCropper
        src={cropperSrc}
        outputWidth={800}
        outputHeight={500}
        onCancel={() => setCropperSrc(null)}
        onSave={(base64) => {
          setImage(base64);
          setCropperSrc(null);
        }}
      />
    </div>
  );
}
