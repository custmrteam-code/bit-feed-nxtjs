import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cover images are base64 data URLs stored in Firestore and are rendered
    // with plain <img>; these patterns only cover remote avatar hosts in case
    // next/image is used for those.
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "abs.twimg.com" },
    ],
  },
  // firebase-admin pulls in optional native deps it never uses in our setup;
  // keep it external so the server bundle stays lean.
  serverExternalPackages: ["firebase-admin"],
  // Security headers (ported from firebase.json) + long-lived asset caching.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
