"use client";

// Client-side article mutations, ported from articles/article.js and the
// toggleSaveArticle helper in Article/firebase-db.js. All writes use the Web
// SDK and the signed-in user's email as the users-doc key.

import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

/** Increment an article's view counter (fire-and-forget). */
export async function incrementView(articleId: string): Promise<void> {
  try {
    await updateDoc(doc(db, "articles", articleId), {
      "stats.views": increment(1),
    });
  } catch (e) {
    console.error("Error updating view count:", e);
  }
}

/** Whether the current user has liked the article. */
export async function isArticleLiked(articleId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user?.email) return false;
  const snap = await getDoc(doc(db, "users", user.email));
  if (!snap.exists()) return false;
  const liked = (snap.data().likedArticles as string[] | undefined) || [];
  return liked.includes(articleId);
}

/** Toggle like state, updating both the user doc and the article's like count. */
export async function toggleLike(
  articleId: string,
  isCurrentlyLiked: boolean,
): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("not-authenticated");

  const userRef = doc(db, "users", user.email);
  const articleRef = doc(db, "articles", articleId);

  if (isCurrentlyLiked) {
    await updateDoc(userRef, { likedArticles: arrayRemove(articleId) });
    await updateDoc(articleRef, { "stats.likes": increment(-1) });
  } else {
    await updateDoc(userRef, { likedArticles: arrayUnion(articleId) });
    await updateDoc(articleRef, { "stats.likes": increment(1) });
  }
}

/** Whether the current user has saved the article. */
export async function isArticleSaved(articleId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user?.email) return false;
  const snap = await getDoc(doc(db, "users", user.email));
  if (!snap.exists()) return false;
  const saved = (snap.data().savedArticles as string[] | undefined) || [];
  return saved.includes(articleId);
}

/** Toggle save state. Port of `toggleSaveArticle` (keyed by user email). */
export async function toggleSaveArticle(
  articleId: string,
  isSaving: boolean,
): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("not-authenticated");

  const userRef = doc(db, "users", user.email);
  const articleRef = doc(db, "articles", articleId);

  if (isSaving) {
    await updateDoc(userRef, { savedArticles: arrayUnion(articleId) });
    await updateDoc(articleRef, { "stats.saves": increment(1) });
  } else {
    await updateDoc(userRef, { savedArticles: arrayRemove(articleId) });
    await updateDoc(articleRef, { "stats.saves": increment(-1) });
  }
}

interface ArticleEdits {
  title: string;
  content: string;
  isFeatured: boolean;
  wasFeatured: boolean;
  imageUrl?: string | null;
}

/**
 * Persist inline edits, enforcing the "max 2 featured" rule by unfeaturing the
 * oldest featured article when a third is added. Port of saveArticleChanges.
 */
export async function saveArticleEdits(
  articleId: string,
  edits: ArticleEdits,
): Promise<void> {
  const articleRef = doc(db, "articles", articleId);

  // Max-2-featured rule: only when newly turning featured on.
  if (edits.isFeatured && !edits.wasFeatured) {
    const featSnap = await getDocs(
      query(
        collection(db, "articles"),
        where("status", "==", "active"),
        where("isFeatured", "==", true),
        orderBy("datePosted", "asc"),
      ),
    );
    if (featSnap.size >= 2) {
      await updateDoc(featSnap.docs[0].ref, { isFeatured: false });
    }
  }

  const updateData: Record<string, unknown> = {
    title: edits.title,
    content: edits.content,
    isFeatured: edits.isFeatured,
  };
  if (edits.imageUrl) updateData.imageUrl = edits.imageUrl;

  await updateDoc(articleRef, updateData);
}

/** Permanently delete an article. Port of `deleteArticle`. */
export async function deleteArticle(articleId: string): Promise<void> {
  await deleteDoc(doc(db, "articles", articleId));
}
