import "server-only";

// Server-side Firebase Admin singleton, used by Server Components for public
// reads (SSR/ISR). Credentials come from FIREBASE_SERVICE_ACCOUNT (a JSON
// string, optionally base64-encoded) or Application Default Credentials.
//
// Initialization is lazy and *non-throwing*: when no credentials are present
// (e.g. local dev before a service account is added) `getAdminDb()` returns
// null and callers degrade gracefully instead of crashing the render/build.

import {
  cert,
  getApp,
  getApps,
  initializeApp,
  applicationDefault,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function loadServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;

  // Allow either raw JSON or base64-encoded JSON for easy env management.
  const json = raw.trim().startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");

  const parsed = JSON.parse(json) as Record<string, string>;
  return {
    projectId: parsed.project_id ?? parsed.projectId,
    clientEmail: parsed.client_email ?? parsed.clientEmail,
    // Handle the common case where newlines are escaped in env vars.
    privateKey: (parsed.private_key ?? parsed.privateKey)?.replace(/\\n/g, "\n"),
  };
}

let cachedDb: Firestore | null | undefined;

function initAdminApp(): App | null {
  if (getApps().length) return getApp();

  const serviceAccount = loadServiceAccount();
  if (serviceAccount) {
    return initializeApp({ credential: cert(serviceAccount) });
  }

  if (
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GCLOUD_PROJECT
  ) {
    return initializeApp({ credential: applicationDefault() });
  }

  return null;
}

/**
 * Returns the Admin Firestore instance, or null if Admin credentials are not
 * configured. Result is memoized; the missing-credentials warning is logged
 * once.
 */
export function getAdminDb(): Firestore | null {
  if (cachedDb !== undefined) return cachedDb;

  try {
    const app = initAdminApp();
    if (!app) {
      console.warn(
        "[firebase-admin] FIREBASE_SERVICE_ACCOUNT not set — server reads " +
          "are disabled (returning empty data). See web/.env.example.",
      );
      cachedDb = null;
      return null;
    }
    cachedDb = getFirestore(app);
    return cachedDb;
  } catch (e) {
    console.error("[firebase-admin] Failed to initialize:", e);
    cachedDb = null;
    return null;
  }
}
