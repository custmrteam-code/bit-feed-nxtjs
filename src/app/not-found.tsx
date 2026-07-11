// Global 404 — ported from main/404.html.

import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        background: "#ECEFF1",
        minHeight: "100vh",
        margin: 0,
        fontFamily: "Roboto, Helvetica, Arial, sans-serif",
        color: "rgba(0,0,0,0.87)",
      }}
    >
      <div
        style={{
          background: "white",
          maxWidth: 360,
          margin: "100px auto 16px",
          padding: "32px 24px 16px",
          borderRadius: 3,
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
        }}
      >
        <h2 style={{ color: "#ffa100", fontWeight: "bold", fontSize: 16, margin: "0 0 8px" }}>
          404
        </h2>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 300,
            color: "rgba(0,0,0,0.6)",
            margin: "0 0 16px",
          }}
        >
          Page Not Found
        </h1>
        <p style={{ lineHeight: "140%", margin: "16px 0 24px", fontSize: 14 }}>
          The page you&apos;re looking for doesn&apos;t exist. Please check the
          URL for mistakes and try again.
        </p>
        <Link
          href="/"
          style={{
            display: "block",
            textAlign: "center",
            background: "#039be5",
            textTransform: "uppercase",
            textDecoration: "none",
            color: "white",
            padding: 16,
            borderRadius: 4,
          }}
        >
          Back to bitfeed
        </Link>
      </div>
    </main>
  );
}
