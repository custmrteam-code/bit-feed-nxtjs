"use client";

// Reads for the logged-in user's profile page, ported from user-profile.js.

import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

export interface CurrentUserData {
  savedArticles: string[];
  following: string[];
}

/** Read the signed-in user's saved-article ids and following list. */
export async function getCurrentUserData(): Promise<CurrentUserData | null> {
  const user = auth.currentUser;
  if (!user?.email) return null;
  const snap = await getDoc(doc(db, "users", user.email));
  if (!snap.exists()) return { savedArticles: [], following: [] };
  const data = snap.data();
  return {
    savedArticles: (data.savedArticles as string[]) || [],
    following: (data.following as string[]) || [],
  };
}
