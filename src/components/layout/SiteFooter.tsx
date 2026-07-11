"use client";

// Global footer + newsletter signup, ported from the injected footer markup and
// initFooterNewsletter in layout/layout.js.

import { useState } from "react";
import Link from "next/link";
import { saveToNewsletterList } from "@/lib/data/users";

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      alert("Please enter a valid email");
      return;
    }
    setBusy(true);
    await saveToNewsletterList(email);
    setBusy(false);
    setEmail("");
  };

  return (
    <footer>
      <h2 style={{ visibility: "hidden" }}>
        Yay!!! you found it🥳. &quot;BITFEED07&quot; post this code on LinkedIn
        and tag us. HAPPY DAYY🙃
      </h2>
      <div className="footer-container">
        <div className="footer-left">
          <ul>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/students">Students</Link>
            </li>
            <li>
              <a href="#">Tech</a>
            </li>
            <li>
              <a href="#">Investors</a>
            </li>
          </ul>
        </div>
        <hr className="vertical-line l1" />
        <div className="footer-middle">
          <ul>
            <li>
              <Link href="/privacy-policy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/about">About us</Link>
            </li>
          </ul>
        </div>
        <hr className="vertical-line l2" />
        <div className="footer-right">
          <h3>Newsletter</h3>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              className="newsletter-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <br />
            <button type="submit" className="subscribe-btn">
              {busy ? "Saving..." : "subscribe"}
            </button>
          </form>
        </div>
      </div>
      <div className="footer-bottom">
        Copyright 2025 bitfeed. All rights reserved. The bitfeed is not
        responsible for the content of external sites.{" "}
        <a href="#">Read about our approach to external linking.</a>
      </div>
    </footer>
  );
}
