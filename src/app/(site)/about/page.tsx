// About page (/about) — ported from others/about.html.

import type { Metadata } from "next";
import { SITE_URL } from "@/lib/env";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "bitfeed is a community-driven platform by custmr.team bringing business, AI, and innovation news directly to you.",
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutPage() {
  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 800,
          padding: 40,
          textAlign: "center",
          fontSize: "1.4rem",
          lineHeight: 1.6,
          fontWeight: 300,
          color: "#111",
        }}
      >
        <p>
          bitfeed is your platform—a community initiative led by{" "}
          <span style={{ color: "#d32f2f", fontWeight: 400 }}>custmr.team</span>{" "}
          that brings business, AI, and{" "}
          <span style={{ color: "#d32f2f", fontWeight: 400 }}>innovation</span>{" "}
          news <span style={{ color: "#d32f2f", fontWeight: 400 }}>directly</span>{" "}
          to your doorstep. We&apos;re not traditional media. We&apos;re your
          neighbours, your partners in progress. We believe India&apos;s tech
          revolution{" "}
          <span style={{ color: "#d32f2f", fontWeight: 400 }}>
            belongs to everyone
          </span>
          —not just those with hours to spare reading hundreds of articles. Our
          mission is{" "}
          <span style={{ color: "#d32f2f", fontWeight: 400 }}>
            straightforward
          </span>
          : keep you informed, keep you ahead, keep you empowered.
        </p>
      </div>
    </main>
  );
}
