"use client";

// Bulk article uploader, ported from admin/bulk-upload.js. Accepts a JSON file,
// pasted JSON, or n8n-generated news; lets the admin attach a cover image per
// article (via the cropper); then batch-uploads them as active articles.

import { useRef, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ImageCropper } from "@/components/ui/ImageCropper";
import {
  triggerNewsGeneration,
  uploadBulkArticle,
  type BulkItem,
} from "@/lib/data/admin.client";

export function BulkUpload() {
  const [queue, setQueue] = useState<BulkItem[]>([]);
  const [step2, setStep2] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [log, setLog] = useState("");
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const handleJsonData = (raw: unknown) => {
    try {
      if (!Array.isArray(raw)) throw new Error("JSON must be an array [ ... ]");
      setQueue(
        raw.map((item: Record<string, unknown>) => ({
          data: item,
          image:
            typeof item.imageUrl === "string" && item.imageUrl.startsWith("http")
              ? (item.imageUrl as string)
              : null,
        })),
      );
      setStep2(true);
    } catch (err) {
      alert("Error parsing JSON: " + (err as Error).message);
    }
  };

  const onJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setJsonText("");
    const fr = new FileReader();
    fr.onload = (ev) => {
      try {
        handleJsonData(JSON.parse(ev.target?.result as string));
      } catch {
        alert("Invalid JSON file.");
      }
    };
    fr.readAsText(file);
  };

  const processText = () => {
    if (!jsonText.trim()) return alert("Please paste JSON text first.");
    try {
      handleJsonData(JSON.parse(jsonText));
    } catch {
      alert("Invalid JSON syntax in text box.");
    }
  };

  const onItemFile = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file?.type.startsWith("image/")) {
      if (file) alert("Please upload an image.");
      return;
    }
    setCropIndex(index);
    const fr = new FileReader();
    fr.onload = (ev) => setCropperSrc(ev.target?.result as string);
    fr.readAsDataURL(file);
  };

  const allReady = queue.length > 0 && queue.every((item) => item.image !== null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const generated = await triggerNewsGeneration();
      handleJsonData(generated);
      alert("News generated successfully!");
    } catch (err) {
      alert("Error: " + (err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const handleUploadAll = async () => {
    setUploading(true);
    let ok = 0;
    let fail = 0;
    let output = "";
    for (let i = 0; i < queue.length; i++) {
      try {
        const title = await uploadBulkArticle(queue[i], i);
        output += `✅ Success: ${title}\n`;
        ok++;
      } catch (err) {
        output += `❌ Failed: ${queue[i].data.title} (${(err as Error).message})\n`;
        fail++;
      }
      setLog(output);
    }
    setUploading(false);
    alert(`Done (${ok} OK, ${fail} Failed)`);
  };

  return (
    <div className="admin-page">
      <AdminHeader title="Bulk Article Upload" backHref="/admin" />
      <div className="admin-container" style={{ width: "100%", maxWidth: 800 }}>
        <div className="step-box">
          <h3>Step 1: Upload JSON Data</h3>
          <p style={{ fontSize: "0.85rem", color: "#666" }}>
            Choose a file OR paste JSON text below.
          </p>
          <input
            type="file"
            accept=".json"
            style={{ marginTop: 15 }}
            onChange={onJsonFile}
          />
          <div style={{ margin: "20px 0", fontWeight: "bold", color: "#ccc" }}>
            --- OR ---
          </div>
          <textarea
            className="json-textarea"
            placeholder='[ { "title": "Example", "imageUrl": "https://...", ... } ]'
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />
          <button
            className="btn-main"
            style={{ padding: "10px 20px", fontSize: "0.9rem", marginTop: 10 }}
            onClick={processText}
          >
            Load JSON from Text
          </button>
          <div style={{ margin: "20px 0", fontWeight: "bold", color: "#ccc" }}>
            --- OR ---
          </div>
          <p style={{ fontSize: "0.85rem", color: "#666" }}>
            Automatically generate news from RSS feeds.
          </p>
          <button
            className="btn-main"
            style={{ background: "#2ecc71" }}
            onClick={handleGenerate}
          >
            Generate AI News
          </button>
        </div>

        {step2 && (
          <div>
            <h3 style={{ marginBottom: 20 }}>Step 2: Attach Cover Images</h3>
            <div>
              {queue.map((item, index) => {
                const hasLink =
                  typeof item.data.imageUrl === "string" &&
                  (item.data.imageUrl as string).startsWith("http");
                return (
                  <div
                    key={index}
                    className={`upload-item${item.image ? " ready" : ""}`}
                  >
                    <div className="item-info">
                      <h4>{(item.data.title as string) || "Untitled"}</h4>
                      <p>Author: {(item.data.authorEmail as string) || "Unknown"}</p>
                    </div>
                    {hasLink ? (
                      <div style={{ flex: "0 0 120px", textAlign: "center" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.data.imageUrl as string}
                          className="linked-thumb"
                          alt=""
                        />
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "#2ecc71",
                            display: "block",
                            marginTop: 5,
                          }}
                        >
                          ✔ Linked
                        </span>
                      </div>
                    ) : (
                      <div
                        className="mini-drop"
                        onClick={() => fileInputs.current[index]?.click()}
                      >
                        {!item.image && <span>Drop or Click</span>}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={(el) => {
                            fileInputs.current[index] = el;
                          }}
                          onChange={(e) => onItemFile(index, e)}
                        />
                        {item.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt="" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              className="btn-main"
              disabled={!allReady || uploading}
              onClick={handleUploadAll}
            >
              {uploading
                ? "Processing..."
                : allReady
                  ? "Upload All Articles"
                  : "Add Images to Continue"}
            </button>
          </div>
        )}

        {log && <div className="status-log">{log}</div>}
      </div>

      {generating && (
        <div className="loading-modal">
          <div className="spinner" />
          <p style={{ marginTop: 15, fontWeight: "bold" }}>
            AI is writing your articles... Please wait.
          </p>
        </div>
      )}

      <ImageCropper
        src={cropperSrc}
        outputWidth={800}
        outputHeight={450}
        onCancel={() => setCropperSrc(null)}
        onSave={(base64) => {
          if (cropIndex !== null) {
            setQueue((prev) =>
              prev.map((item, i) =>
                i === cropIndex ? { ...item, image: base64 } : item,
              ),
            );
          }
          setCropperSrc(null);
          setCropIndex(null);
        }}
      />
    </div>
  );
}
