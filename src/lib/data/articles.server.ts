import "server-only";

// Server-side article reads (Admin SDK), ported from Article/firebase-db.js.
// Every function degrades to empty/null when Admin credentials are missing so
// pages still render (in a "no data" state) during local dev and at build time.

import { getAdminDb } from "@/lib/firebase/admin";
import { normalizeArticle } from "@/lib/firebase/serialize";
import type { Article } from "@/lib/firebase/types";

const COLLECTION = "articles";

/** Top 2 featured, active articles. */
export async function getFeaturedNews(): Promise<Article[]> {
  const db = getAdminDb();
  if (!db) return [];

  const snap = await db
    .collection(COLLECTION)
    .where("status", "==", "active")
    .where("isFeatured", "==", true)
    .limit(2)
    .get();

  return snap.docs.map((d) => normalizeArticle(d.id, d.data()));
}

/** Total document count in the articles collection (for pagination). */
export async function getTotalArticleCount(): Promise<number> {
  const db = getAdminDb();
  if (!db) return 0;
  const snap = await db.collection(COLLECTION).count().get();
  return snap.data().count;
}

/**
 * One page of articles, newest serial first, starting at `startSerial`.
 * Mirrors the legacy formula `Total - 7*(Page-1)` driven pagination.
 */
export async function getArticlesBySerial(
  startSerial: number,
): Promise<Article[]> {
  const db = getAdminDb();
  if (!db) return [];

  const snap = await db
    .collection(COLLECTION)
    .where("status", "==", "active")
    .where("serialNumber", "<=", startSerial)
    .orderBy("serialNumber", "desc")
    .limit(7)
    .get();

  return snap.docs.map((d) => normalizeArticle(d.id, d.data()));
}

/** Fetch a single article by document id. */
export async function getArticleById(
  articleId: string,
): Promise<Article | null> {
  if (!articleId) return null;
  const db = getAdminDb();
  if (!db) return null;

  try {
    const docSnap = await db.collection(COLLECTION).doc(articleId).get();
    return docSnap.exists
      ? normalizeArticle(docSnap.id, docSnap.data()!)
      : null;
  } catch (e) {
    console.error("Error fetching article:", e);
    return null;
  }
}

/** Up to 3 active articles sharing the first tag (excluding the current one). */
export async function getRelatedArticles(
  tags: string[] | undefined,
  currentId: string,
): Promise<Article[]> {
  if (!tags || tags.length === 0) return [];
  const db = getAdminDb();
  if (!db) return [];

  const snap = await db
    .collection(COLLECTION)
    .where("status", "==", "active")
    .where("tags", "array-contains", tags[0])
    .limit(4)
    .get();

  return snap.docs
    .map((d) => normalizeArticle(d.id, d.data()))
    .filter((a) => a.id !== currentId)
    .slice(0, 3);
}

/** Case-sensitive Firestore prefix search on title (needs a title index). */
export async function searchArticles(term: string): Promise<Article[]> {
  if (!term) return [];
  const db = getAdminDb();
  if (!db) return [];

  try {
    const snap = await db
      .collection(COLLECTION)
      .where("status", "==", "active")
      .orderBy("title")
      .startAt(term)
      .endAt(term + "")
      .limit(8)
      .get();

    return snap.docs.map((d) => normalizeArticle(d.id, d.data()));
  } catch (e) {
    console.warn("Search requires a 'title' index. Check the console link.", e);
    return [];
  }
}
