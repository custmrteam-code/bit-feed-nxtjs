"use client";

// Client-side search index with localStorage smart-sync, ported from
// fetchAllSearchData / getLocalRelatedArticles in Article/firebase-db.js.
//
// Strategy: keep a local cache of all active articles keyed by the highest
// serialNumber seen. On each call we read just the latest serial from the
// server (1 read); if it's ahead of our cache we download only the delta.

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { normalizeArticle, toSearchable } from "@/lib/firebase/serialize";
import type { SearchableArticle } from "@/lib/firebase/types";

const STORAGE_KEY = "bai_news_search_cache";
const META_KEY = "bai_news_last_serial";

// In-memory mirror of the cache (replaces the legacy `window.cachedSearchData`).
let memoryCache: SearchableArticle[] | null = null;

function readLocal(): { data: SearchableArticle[]; lastSerial: number } {
  if (typeof window === "undefined") return { data: [], lastSerial: 0 };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedSerial = localStorage.getItem(META_KEY);
    return {
      data: stored ? (JSON.parse(stored) as SearchableArticle[]) : [],
      lastSerial: storedSerial ? parseInt(storedSerial, 10) : 0,
    };
  } catch {
    return { data: [], lastSerial: 0 };
  }
}

/** Download new active articles since the cached serial and merge them in. */
export async function fetchAllSearchData(): Promise<SearchableArticle[]> {
  const stored = readLocal();
  let localData = stored.data;
  const lastSerial = stored.lastSerial;

  // 1. Check the server's latest serial (1 read).
  let latestServerSerial = 0;
  try {
    const latestQ = query(
      collection(db, "articles"),
      where("status", "==", "active"),
      orderBy("serialNumber", "desc"),
      limit(1),
    );
    const snap = await getDocs(latestQ);
    if (!snap.empty) {
      latestServerSerial = (snap.docs[0].data().serialNumber as number) || 0;
    }
  } catch (e) {
    console.debug("Offline or error — using cache.", e);
    memoryCache = localData;
    return localData;
  }

  // 2. Sync only the delta if the server is ahead.
  if (latestServerSerial > lastSerial) {
    const updateQ = query(
      collection(db, "articles"),
      where("status", "==", "active"),
      where("serialNumber", ">", lastSerial),
    );
    const updateSnap = await getDocs(updateQ);

    const newArticles = updateSnap.docs.map((d) =>
      toSearchable(normalizeArticle(d.id, d.data())),
    );

    const merged = [...newArticles, ...localData];
    // Newest first.
    merged.sort((a, b) => (b.datePosted ?? 0) - (a.datePosted ?? 0));

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      localStorage.setItem(META_KEY, latestServerSerial.toString());
    } catch (e) {
      console.debug("Could not persist search cache.", e);
    }
    localData = merged;
  }

  memoryCache = localData;
  return localData;
}

/** Synchronous access to the already-loaded cache, if any. */
export function getCachedSearchData(): SearchableArticle[] | null {
  return memoryCache;
}

/**
 * Tag-based related articles computed entirely from the local cache (0 reads).
 * Port of `getLocalRelatedArticles`.
 */
export async function getLocalRelatedArticles(
  currentTags: string[] | undefined,
  currentId: string,
): Promise<SearchableArticle[]> {
  if (!currentTags || currentTags.length === 0) return [];
  const data = memoryCache ?? (await fetchAllSearchData());

  const normalizedTags = currentTags.map((t) => t.toLowerCase());

  return data
    .filter((article) => article.id !== currentId)
    .map((article) => ({
      ...article,
      score: article.searchTags.filter((t) => normalizedTags.includes(t))
        .length,
    }))
    .filter((article) => article.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
