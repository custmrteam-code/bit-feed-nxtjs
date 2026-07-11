// Privacy policy (/privacy-policy) — ported from others/privacy-policy.html.

import type { Metadata } from "next";
import { SITE_URL } from "@/lib/env";
import "./privacy.css";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read bitfeed's privacy policy. Learn how we collect, use, and protect your data on our community-driven news platform by custmr.team.",
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="privacy-page">
      <div className="container">
        <div className="last-updated-box">
          <strong>Last Updated:</strong> December 27, 2025
        </div>

        <section>
          <h2 className="section-title">Introduction</h2>
          <p>
            Welcome to bitfeed (&quot;we,&quot; &quot;our,&quot; or
            &quot;us&quot;). bitfeed is a community-driven platform operated by
            custmr.team that aggregates and shares concise business, AI, and
            innovation news for informational and educational purposes.
          </p>
          <div className="important-box">
            <p>
              <span className="red-label">Important:</span> bitfeed operates as a
              community news aggregator and commentary platform. We are not a
              licensed news organization or journalism outlet. All content on
              this platform represents community-curated summaries and
              perspectives on publicly available information. Users should verify
              important information through original sources.
            </p>
          </div>
          <p>
            This Privacy Policy explains how we collect, use, disclose, and
            safeguard your information when you visit our website. Please read
            this privacy policy carefully.
          </p>
        </section>

        <section>
          <h2 className="section-title">Information We Collect</h2>
          <h3>Information You Provide</h3>
          <p>We may collect information that you voluntarily provide to us, including:</p>
          <ul>
            <li>Email address (if you subscribe to our newsletter or contact us)</li>
            <li>Name and contact information (if provided through contact forms)</li>
            <li>Feedback, comments, or other communications you send to us</li>
          </ul>
          <h3>Automatically Collected Information</h3>
          <p>
            When you visit our website, we may automatically collect certain
            information about your device and browsing actions, including:
          </p>
          <ul>
            <li>IP address and general location data</li>
            <li>Browser type and version</li>
            <li>Device type and operating system</li>
            <li>Pages visited and time spent on pages</li>
            <li>Referring website addresses</li>
            <li>Date and time of visits</li>
          </ul>
          <h3>Cookies and Tracking Technologies</h3>
          <p>
            We may use cookies, web beacons, and similar tracking technologies to
            enhance your experience. You can control cookie preferences through
            your browser settings.
          </p>
        </section>

        <section>
          <h2 className="section-title">How We Use Your Information</h2>
          <p>We use the collected information for the following purposes:</p>
          <ul>
            <li>
              <strong>Platform Operation:</strong> To provide, maintain, and
              improve our community news platform
            </li>
            <li>
              <strong>Communication:</strong> To respond to inquiries, send
              newsletters (if subscribed), and provide updates
            </li>
            <li>
              <strong>Analytics:</strong> To understand how users interact with
              our platform and improve user experience
            </li>
            <li>
              <strong>Security:</strong> To protect against fraudulent,
              unauthorized, or illegal activity
            </li>
            <li>
              <strong>Legal Compliance:</strong> To comply with applicable laws
              and regulations
            </li>
          </ul>
        </section>

        <section>
          <h2 className="section-title">Content Disclaimer</h2>
          <h3>Community-Curated Content</h3>
          <p>
            bitfeed operates as a community platform where news summaries and
            insights are curated from publicly available sources. We do not claim
            to be journalists or a licensed news organization.
          </p>
          <h3>No Original Reporting</h3>
          <p>
            We do not conduct original investigative journalism or reporting. All
            content represents:
          </p>
          <ul>
            <li>Summaries of publicly available news and information</li>
            <li>Community perspectives and commentary</li>
            <li>Aggregated insights from various public sources</li>
          </ul>
          <h3>Information Accuracy</h3>
          <p>
            While we strive to provide accurate and timely information, we make no
            warranties or guarantees about the accuracy, completeness, or
            reliability of any content on our platform. Users should:
          </p>
          <ul>
            <li>Verify important information through original sources</li>
            <li>Not rely solely on our summaries for critical decisions</li>
            <li>
              Understand that content represents community perspectives, not
              professional advice
            </li>
          </ul>
        </section>

        <section>
          <h2 className="section-title">Information Sharing and Disclosure</h2>
          <p>
            We do not sell, trade, or rent your personal information to third
            parties. We may share information in the following circumstances:
          </p>
          <ul>
            <li>
              <strong>Service Providers:</strong> With trusted third-party service
              providers who assist in operating our platform (e.g., hosting,
              analytics)
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law, court
              order, or government regulation
            </li>
            <li>
              <strong>Protection of Rights:</strong> To protect our rights,
              property, safety, or that of our users
            </li>
          </ul>
        </section>

        <section>
          <h2 className="section-title">Contact Us</h2>
          <div className="contact-box">
            <p>
              If you have any questions, concerns, or requests regarding this
              Privacy Policy or our data practices, please contact us:
            </p>
            <p style={{ marginTop: 15 }}>
              <strong>bitfeed by custmr.team</strong>
              <br />
              Email:{" "}
              <a href="mailto:bharataiinsight@gmail.com">
                bharataiinsight@gmail.com
              </a>
            </p>
            <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
              We aim to respond to all inquiries within 7 business days.
            </p>
          </div>
        </section>

        <footer className="privacy-footer">
          <p>&copy; 2025 bitfeed. Community news Platform.</p>
        </footer>
      </div>
    </main>
  );
}
