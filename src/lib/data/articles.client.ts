"use client";

// Client-side article reads/subscriptions (Web SDK), ported from
// Article/firebase-db.js. Used by Client Components/hooks for realtime data and
// interactions that the server data layer can't provide.

import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { normalizeArticle } from "@/lib/firebase/serialize";
import type { Article } from "@/lib/firebase/types";

/**
 * Subscribe to the 5 most recent active articles (realtime). Returns the
 * Firestore unsubscribe function. Port of `subscribeLatestNews`.
 */
export function subscribeLatestNews(
  callback: (articles: Article[]) => void,
): () => void {
  const q = query(
    collection(db, "articles"),
    where("status", "==", "active"),
    orderBy("datePosted", "desc"),
    limit(5),
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => normalizeArticle(d.id, d.data())));
  });
}
