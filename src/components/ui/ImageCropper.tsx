"use client";

// Reusable drag-and-zoom image cropper modal, ported from initEditCropper in
// articles/article.js (also used by the admin post/bulk tools). Renders into a
// 16:10 crop window and outputs a base64 JPEG via canvas.

import { useRef, useState } from "react";

interface ImageCropperProps {
  /** Source image (data URL or URL). Modal is shown while non-null. */
  src: string | null;
  onSave: (base64: string) => void;
  onCancel: () => void;
  outputWidth?: number;
  outputHeight?: number;
}

export function ImageCropper({
  src,
  onSave,
  onCancel,
  outputWidth = 800,
  outputHeight = 450,
}: ImageCropperProps) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  if (!src) return null;

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    start.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    e.preventDefault();
    setPos({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
  };
  const stopDrag = () => {
    dragging.current = false;
  };

  const handleSave = () => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = outputWidth / container.clientWidth;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, outputWidth, outputHeight);
    ctx.save();

    const imgWidth = outputWidth;
    const imgHeight = (img.naturalHeight / img.naturalWidth) * outputWidth;

    ctx.translate(pos.x * ratio, pos.y * ratio);
    ctx.translate(imgWidth / 2, imgHeight / 2);
    ctx.scale(scale, scale);
    ctx.translate(-imgWidth / 2, -imgHeight / 2);
    ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
    ctx.restore();

    onSave(canvas.toDataURL("image/jpeg", 0.8));
  };

  return (
    <div id="cropper-modal">
      <div className="cropper-content">
        <h3>Adjust Image</h3>
        <p>Drag to reposition. Use slider to zoom.</p>
        <div
          className="crop-container"
          ref={containerRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            id="cropper-img"
            ref={imgRef}
            src={src}
            alt="To crop"
            draggable={false}
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            }}
          />
        </div>
        <div className="cropper-controls">
          <label>Zoom:</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
          />
        </div>
        <div className="cropper-actions">
          <button type="button" id="btn-cancel-crop" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" id="btn-save-crop" onClick={handleSave}>
            Crop &amp; Save
          </button>
        </div>
      </div>
    </div>
  );
}
