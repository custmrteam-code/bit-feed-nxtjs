"use client";

// Client-side Firebase singletons (Web SDK v12). Mirrors the legacy
// `Article/firebase-db.js` initialization: one app, shared `auth`/`db`, lazy
// analytics, and best-effort IndexedDB offline persistence.

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  enableIndexedDbPersistence,
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import { firebaseClientConfig } from "@/lib/env";

export const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseClientConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Offline cache — best effort, ignore failures (multi-tab, unsupported, etc.).
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    console.debug("Firestore persistence:", err?.code ?? err);
  });
}

/** Lazily initialize Analytics in the browser only (avoids SSR crashes). */
export async function getAnalyticsClient() {
  if (typeof window === "undefined") return null;
  const { getAnalytics, isSupported } = await import("firebase/analytics");
  return (await isSupported()) ? getAnalytics(app) : null;
}
