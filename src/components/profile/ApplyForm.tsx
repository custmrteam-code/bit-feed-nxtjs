"use client";

// Reporter application form, ported from profile pages/apply.js. Auto-fills the
// signed-in user's email/name, captures a profile photo + writing sample as
// base64, and submits via submitAuthorRequest. Guests are redirected home.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { submitAuthorRequest } from "@/lib/data/users";

const UploadIcon = () => (
  <svg
    className="upload-icon"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export function ApplyForm() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [seededFor, setSeededFor] = useState<string | null>(null);
  const [dob, setDob] = useState("");
  const [location, setLocation] = useState("");
  const [spec, setSpec] = useState("");
  const [link, setLink] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [sample, setSample] = useState<{ base64: string; name: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ msg: string; color: string } | null>(
    null,
  );

  const photoInput = useRef<HTMLInputElement | null>(null);
  const sampleInput = useRef<HTMLInputElement | null>(null);

  // Redirect guests once auth settles (no setState here).
  useEffect(() => {
    if (!loading && !user) {
      alert("Please sign in to apply.");
      router.replace("/");
    }
  }, [user, loading, router]);

  const email = user?.email ?? "";

  // Seed the editable name from the user's display name once (during render).
  if (user && seededFor !== user.email) {
    setSeededFor(user.email ?? "");
    setName(user.displayName ?? "");
  }

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fr = new FileReader();
    fr.onload = (ev) => setPhoto(ev.target?.result as string);
    fr.readAsDataURL(file);
  };

  const onSample = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fr = new FileReader();
    fr.onload = (ev) =>
      setSample({ base64: ev.target?.result as string, name: file.name });
    fr.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setStatus(null);

    const result = await submitAuthorRequest({
      email: user.email!,
      displayName: name,
      dob,
      location,
      specialization: spec,
      portfolioLink: link,
      photoURL: photo || user.photoURL || "",
      sampleBase64: sample?.base64 ?? null,
      sampleName: sample?.name ?? "sample.pdf",
    });

    if (result.success) {
      setStatus({
        msg: "✅ Application Sent! We will review it shortly.",
        color: "green",
      });
      setName(user.displayName ?? "");
      setDob("");
      setLocation("");
      setSpec("");
      setLink("");
      setPhoto(null);
      setSample(null);
    } else {
      setStatus({
        msg: "❌ Error: " + (result.error || "Unknown error"),
        color: "red",
      });
    }
    setBusy(false);
  };

  if (loading || !user) return null;

  return (
    <div className="apply-page">
      <header className="page-header">
        <button className="back-btn" onClick={() => router.back()} aria-label="Back">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            width={25}
            height={25}
            src="https://img.icons8.com/pixels/32/u-turn-to-left.png"
            alt="Back"
          />
        </button>
        <h1>Join the Newsroom</h1>
      </header>

      <main className="form-container">
        <p className="sub-text">
          Apply to become an official reporter for bitfeed. Share your voice with
          the community.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              readOnly
            />
          </div>

          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="text"
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => {
                if (!e.target.value) e.target.type = "text";
              }}
              className="form-input"
              placeholder="1 January 2000"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              className="form-input"
              placeholder="Delhi, India"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="upload-row">
            <div className="upload-col">
              <label>Profile Photo</label>
              <div
                className="file-drop-area"
                onClick={() => photoInput.current?.click()}
              >
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={photoInput}
                  onChange={onPhoto}
                />
                <div
                  className="drop-content"
                  style={{ opacity: photo ? 0 : 1 }}
                >
                  <UploadIcon />
                  <span className="drop-text">Drop your files here or browse</span>
                  <span className="drop-subtext">Max file size up to 1 MB</span>
                </div>
                {photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="Preview" className="preview-img" />
                )}
              </div>
            </div>

            <div className="upload-col">
              <label>Sample Articles</label>
              <div
                className="file-drop-area"
                onClick={() => sampleInput.current?.click()}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  hidden
                  ref={sampleInput}
                  onChange={onSample}
                />
                <div
                  className="drop-content"
                  style={{ opacity: sample ? 0 : 1 }}
                >
                  <UploadIcon />
                  <span className="drop-text">Drop your files here or browse</span>
                  <span className="drop-subtext">Max file size up to 1 MB</span>
                </div>
                {sample && (
                  <div className="preview-text">Selected: {sample.name}</div>
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Primary Specialization</label>
            <select
              className="form-input"
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
            >
              <option value="" disabled>
                Select
              </option>
              <option value="AI & Tech">AI &amp; Tech</option>
              <option value="Finance">Finance</option>
              <option value="Geopolitics">Geopolitics</option>
              <option value="Environment">Environment</option>
            </select>
          </div>

          <div className="form-group">
            <label>Portfolio / LinkedIn URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://www.linkedin.com/..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={busy}>
            {busy ? "Submitting..." : "Submit"}
          </button>
          {status && (
            <div
              style={{
                textAlign: "center",
                marginTop: 15,
                fontFamily: "sans-serif",
                color: status.color,
              }}
            >
              {status.msg}
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
