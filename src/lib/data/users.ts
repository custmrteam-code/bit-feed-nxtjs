"use client";

// Client-side user/author writes, ported from admin/user-db.js. Uses the
// Firebase Web SDK; user/author docs are keyed by lowercased email.

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase/client";
import { AUTHOR_SCRIPT_URL } from "@/lib/env";

/**
 * Create or update a reader. Guests are upgraded to "reader"; other roles
 * (reader/author/admin) are preserved. Port of `saveUserToDB`.
 */
export async function saveUserToDB(
  user: Pick<User, "uid" | "email" | "displayName" | "photoURL" | "providerData">,
  subscribedToNewsletter: boolean,
): Promise<void> {
  if (!user || !user.email) return;

  const cleanEmail = user.email.toLowerCase().trim();
  const userRef = doc(db, "users", cleanEmail);

  try {
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const existingData = userSnap.data();
      // Upgrade guests to reader; otherwise keep the existing role.
      const currentRole =
        existingData.role === "guest" ? "reader" : existingData.role;

      await setDoc(
        userRef,
        {
          uid: user.uid,
          email: cleanEmail,
          displayName:
            user.displayName || existingData.displayName || "Anonymous",
          photoURL:
            user.photoURL || existingData.photoURL || "/assets/default-user.png",
          authProvider: user.providerData?.[0]?.providerId || "anonymous/otp",
          role: currentRole,
          lastLogin: serverTimestamp(),
          isNewsletterSubscribed:
            subscribedToNewsletter ||
            existingData.isNewsletterSubscribed ||
            false,
        },
        { merge: true },
      );
    } else {
      await setDoc(userRef, {
        uid: user.uid,
        email: cleanEmail,
        displayName: user.displayName || "Anonymous",
        photoURL: user.photoURL || "/assets/default-user.png",
        authProvider: user.providerData?.[0]?.providerId || "anonymous/otp",
        role: "reader",
        isNewsletterSubscribed: subscribedToNewsletter,
        savedArticles: [],
        following: [],
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
    }
  } catch (e) {
    console.error("Error saving user:", e);
  }
}

/** Subscribe a footer email to the newsletter. Port of `saveToNewsletterList`. */
export async function saveToNewsletterList(email: string): Promise<void> {
  if (!email) return;

  const cleanEmail = email.toLowerCase().trim();
  const userRef = doc(db, "users", cleanEmail);

  try {
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      await setDoc(
        userRef,
        {
          isNewsletterSubscribed: true,
          lastNewsletterInteraction: serverTimestamp(),
        },
        { merge: true },
      );
    } else {
      await setDoc(userRef, {
        email: cleanEmail,
        role: "guest",
        isNewsletterSubscribed: true,
        createdAt: serverTimestamp(),
        displayName: "Guest Subscriber",
      });
    }
    alert("Subscribed successfully!");
  } catch (e) {
    console.error("Subscription Error:", e);
    alert("Could not subscribe. Try again.");
  }
}

/** Shape of a reporter application form submission. */
export interface AuthorRequest {
  email: string;
  displayName: string;
  specialization?: string;
  location?: string;
  portfolioLink?: string;
  photoURL: string;
  /** Base64 writing sample — emailed to admins, not stored in Firestore. */
  sampleBase64?: string | null;
  sampleName?: string;
  dob?: string;
  [key: string]: unknown;
}

/**
 * Submit a reporter application: persist to the `authors` collection (without
 * the heavy base64 sample) and email the full payload to admins via Apps
 * Script. Port of `submitAuthorRequest`.
 */
export async function submitAuthorRequest(
  formData: AuthorRequest,
): Promise<{ success: boolean; error?: string }> {
  if (!formData.email) return { success: false };

  try {
    const { sampleBase64, ...dbData } = formData;

    await setDoc(doc(db, "authors", formData.email), {
      ...dbData,
      status: "pending",
      role: "reporter_candidate",
      articleCount: 0,
      followers: [],
      joinedDate: serverTimestamp(),
    });

    await fetch(AUTHOR_SCRIPT_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        type: "application",
        name: formData.displayName,
        email: formData.email,
        specialization: formData.specialization,
        location: formData.location,
        portfolio: formData.portfolioLink,
        photoBase64: formData.photoURL?.startsWith("data:")
          ? formData.photoURL
          : null,
        sampleBase64,
        sampleName: formData.sampleName,
      }),
    });

    return { success: true };
  } catch (e) {
    console.error("Error submitting:", e);
    return { success: false, error: (e as Error).message };
  }
}
