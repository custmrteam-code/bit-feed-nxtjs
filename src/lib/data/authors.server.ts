import "server-only";

// Server-side author reads (Admin SDK), ported from profile pages/author.js.
// Degrade to null/empty when Admin credentials are absent.

import { getAdminDb } from "@/lib/firebase/admin";
import { normalizeArticle, normalizeAuthor } from "@/lib/firebase/serialize";
import type { Article, AuthorDoc } from "@/lib/firebase/types";

/** Fetch an author document by its id (email or legacy name). */
export async function getAuthorById(id: string): Promise<AuthorDoc | null> {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db.collection("authors").doc(id).get();
  return snap.exists ? normalizeAuthor(snap.id, snap.data()!) : null;
}

/** Up to 5 active articles written by the given author email. */
export async function getArticlesByAuthor(email: string): Promise<Article[]> {
  const db = getAdminDb();
  if (!db) return [];
  const snap = await db
    .collection("articles")
    .where("authorEmail", "==", email)
    .where("status", "==", "active")
    .limit(5)
    .get();
  return snap.docs.map((d) => normalizeArticle(d.id, d.data()));
}

/** A few other approved authors for the "Similar Reporters" sidebar. */
export async function getSimilarAuthors(
  excludeId: string,
  max = 4,
): Promise<AuthorDoc[]> {
  const db = getAdminDb();
  if (!db) return [];
  const snap = await db
    .collection("authors")
    .where("role", "==", "author")
    .limit(max)
    .get();
  return snap.docs
    .map((d) => normalizeAuthor(d.id, d.data()))
    .filter((a) => a.id !== excludeId)
    .slice(0, 3);
}
