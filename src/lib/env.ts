// Centralized environment access.
//
// Public (NEXT_PUBLIC_*) values are inlined at build time and safe in the
// browser. The Firebase web config is public by design (it identifies the
// project; security is enforced by Firestore rules), so we ship sensible
// fallbacks matching the legacy site to keep local dev frictionless. Override
// any of them via .env.local.

export const firebaseClientConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyC_Q3p2dyKwUOUv5O-gIMNI8vv6RrD0IZY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "bitfeed.in",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "bai-news-9e4cf",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "bai-news-9e4cf.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "1056453543830",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:1056453543830:web:c40a8c1e5bb582f2c63fb7",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-MY4FQNR5YV",
} as const;

/** Google Apps Script endpoint used for the email-OTP flow. */
export const OTP_SCRIPT_URL =
  process.env.NEXT_PUBLIC_OTP_SCRIPT_URL ??
  "https://script.google.com/macros/s/AKfycbyL2BWoLKA7nNoAEV80NeaU66zp3p-drCsQKHOgAfw43FPWH3f5XcNTBYlJUGtzCyaGzg/exec";

/** Google Apps Script endpoint that emails reporter applications to admins. */
export const AUTHOR_SCRIPT_URL =
  process.env.NEXT_PUBLIC_AUTHOR_SCRIPT_URL ??
  "https://script.google.com/macros/s/AKfycbxMXzcNfBZfGUZE-nI5T-8au-it3ujcH6nGgCOepw1tvbcuo4Or-BO7z9RRuDA9RaOmIg/exec";

/** n8n webhook that kicks off automated bulk news generation. */
export const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ?? "";

/** Public site origin, used for canonical URLs and OpenGraph metadata. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bitfeed.in";
