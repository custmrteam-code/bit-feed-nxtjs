"use client";

// OAuth login helpers, ported from handleGoogleLogin / handleTwitterLogin in
// layout/auth.js. The OTP/email flow is stateful and lives in AuthModal.

import {
  GoogleAuthProvider,
  TwitterAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { saveUserToDB } from "@/lib/data/users";

const googleProvider = new GoogleAuthProvider();
const twitterProvider = new TwitterAuthProvider();

export async function loginWithGoogle(isSubscribed: boolean): Promise<void> {
  const result = await signInWithPopup(auth, googleProvider);
  await saveUserToDB(result.user, isSubscribed);
}

export async function loginWithTwitter(isSubscribed: boolean): Promise<void> {
  const result = await signInWithPopup(auth, twitterProvider);
  await saveUserToDB(result.user, isSubscribed);
}

export async function logout(): Promise<void> {
  await signOut(auth);
  // Clear the typewriter flag so it replays on next login (parity with legacy).
  try {
    sessionStorage.removeItem("typewriterPlayed");
  } catch {
    /* ignore */
  }
}
