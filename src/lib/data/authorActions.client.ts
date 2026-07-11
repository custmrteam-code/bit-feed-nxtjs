"use client";

// Client follow/unfollow + profile reads, ported from profile pages/author.js
// and user-profile.js. Follow state is stored on both sides: the viewer's
// users/{email}.following[] and the target authors/{id}.followers[].

import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { normalizeArticle, normalizeAuthor } from "@/lib/firebase/serialize";
import type { Article, AuthorDoc } from "@/lib/firebase/types";

/** The list of author ids the current user follows. */
export async function getViewerFollowing(): Promise<string[]> {
  const user = auth.currentUser;
  if (!user?.email) return [];
  const snap = await getDoc(doc(db, "users", user.email));
  return snap.exists() ? (snap.data().following as string[]) || [] : [];
}

/** Follow or unfollow an author, updating both documents. */
export async function toggleFollow(
  targetId: string,
  isCurrentlyFollowing: boolean,
): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("not-authenticated");

  const viewerRef = doc(db, "users", user.email);
  const authorRef = doc(db, "authors", targetId);

  if (isCurrentlyFollowing) {
    await updateDoc(viewerRef, { following: arrayRemove(targetId) });
    await updateDoc(authorRef, { followers: arrayRemove(user.email) });
  } else {
    await updateDoc(viewerRef, { following: arrayUnion(targetId) });
    await updateDoc(authorRef, { followers: arrayUnion(user.email) });
  }
}

/** Fetch articles by a list of document ids (chunked for the `in` limit). */
export async function fetchArticlesByIds(ids: string[]): Promise<Article[]> {
  if (ids.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

  const results: Article[] = [];
  for (const chunk of chunks) {
    const snap = await getDocs(
      query(collection(db, "articles"), where(documentId(), "in", chunk)),
    );
    snap.forEach((d) => results.push(normalizeArticle(d.id, d.data())));
  }
  return results;
}

/** Fetch author documents by a list of document ids. */
export async function fetchAuthorsByIds(ids: string[]): Promise<AuthorDoc[]> {
  if (ids.length === 0) return [];
  const slice = ids.slice(0, 10);
  const snap = await getDocs(
    query(collection(db, "authors"), where(documentId(), "in", slice)),
  );
  return snap.docs.map((d) => normalizeAuthor(d.id, d.data()));
}
