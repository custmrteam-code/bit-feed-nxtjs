"use client";

// Admin-only client operations, ported from admin/post-article.js,
// article-requests.js, bulk-upload.js, panel.html and migrate-tool.html.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase/client";
import { normalizeArticle, normalizeAuthor } from "@/lib/firebase/serialize";
import { AUTHOR_SCRIPT_URL, N8N_WEBHOOK_URL } from "@/lib/env";
import type { Article, AuthorDoc, ContentLevel } from "@/lib/firebase/types";

// ── Post Article ────────────────────────────────────────────────────────────

export interface NewArticleInput {
  title: string;
  summary: string;
  content: string;
  targetLevel: ContentLevel;
  tags: string[];
  imageBase64: string;
  author: Pick<User, "email" | "displayName" | "uid">;
}

/** Create a pending article. Port of post-article.js submit. */
export async function createArticle(input: NewArticleInput): Promise<void> {
  await addDoc(collection(db, "articles"), {
    title: input.title,
    summary: input.summary,
    content: input.targetLevel === "intermediate" ? input.content : "",
    contentBeginner: input.targetLevel === "beginner" ? input.content : "",
    contentPro: input.targetLevel === "pro" ? input.content : "",
    tags: input.tags,
    imageUrl: input.imageBase64,
    authorEmail: input.author.email,
    authorName: input.author.displayName,
    authorId: input.author.uid,
    datePosted: new Date().toISOString(),
    timestamp: serverTimestamp(),
    status: "pending",
    isFeatured: false,
    serialNumber: Date.now(),
    stats: { views: 0, likes: 0, saves: 0 },
  });
}

// ── Article Requests (moderation) ────────────────────────────────────────────

export interface ArticleBuckets {
  today: Article[];
  yesterday: Article[];
  dayBefore: Article[];
  dayBeforeLabel: string;
}

/**
 * Load all articles grouped into Today / Yesterday / Day-before buckets, with
 * pending items first. Pending articles older than 3 days are auto-deleted.
 * Port of loadArticlesLog.
 */
export async function loadArticleBuckets(): Promise<ArticleBuckets> {
  const snap = await getDocs(
    query(collection(db, "articles"), orderBy("datePosted", "desc")),
  );

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  const dayBeforeStart = new Date(todayStart);
  dayBeforeStart.setDate(todayStart.getDate() - 2);

  const today: Article[] = [];
  const yesterday: Article[] = [];
  const dayBefore: Article[] = [];

  const batch = writeBatch(db);
  let hasDeletions = false;

  snap.forEach((docSnap) => {
    const article = normalizeArticle(docSnap.id, docSnap.data());
    const itemDate = article.datePosted ? new Date(article.datePosted) : new Date(0);

    if (itemDate >= todayStart) today.push(article);
    else if (itemDate >= yesterdayStart) yesterday.push(article);
    else if (itemDate >= dayBeforeStart) dayBefore.push(article);
    else if (article.status === "pending") {
      batch.delete(docSnap.ref);
      hasDeletions = true;
    }
  });

  if (hasDeletions) await batch.commit();

  const pendingFirst = (a: Article, b: Article) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return 0;
  };
  today.sort(pendingFirst);
  yesterday.sort(pendingFirst);
  dayBefore.sort(pendingFirst);

  return {
    today,
    yesterday,
    dayBefore,
    dayBeforeLabel: dayBeforeStart.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  };
}

export interface ApproveArticleInput {
  id: string;
  isNew: boolean;
  title: string;
  summary: string;
  contentBeginner: string;
  content: string;
  contentPro: string;
  imageUrl: string;
  isFeatured: boolean;
}

/** Approve/update an article. Port of approveAndPublish (420 cap + max-2 featured). */
export async function approveArticle(input: ApproveArticleInput): Promise<void> {
  const articlesRef = collection(db, "articles");

  if (input.isNew) {
    const count = (
      await getCountFromServer(query(articlesRef, where("status", "==", "active")))
    ).data().count;
    if (count >= 420) {
      const oldest = await getDocs(
        query(
          articlesRef,
          where("status", "==", "active"),
          orderBy("datePosted", "asc"),
          limit(1),
        ),
      );
      if (!oldest.empty) await deleteDoc(oldest.docs[0].ref);
    }
  }

  if (input.isFeatured) {
    const featSnap = await getDocs(
      query(
        articlesRef,
        where("status", "==", "active"),
        where("isFeatured", "==", true),
        orderBy("datePosted", "asc"),
      ),
    );
    if (featSnap.size >= 2) {
      let others = 0;
      featSnap.forEach((d) => {
        if (d.id !== input.id) others++;
      });
      if (others >= 2) await updateDoc(featSnap.docs[0].ref, { isFeatured: false });
    }
  }

  await updateDoc(doc(db, "articles", input.id), {
    title: input.title,
    summary: input.summary,
    contentBeginner: input.contentBeginner,
    content: input.content,
    contentPro: input.contentPro,
    imageUrl: input.imageUrl,
    status: "active",
    isFeatured: input.isFeatured,
    datePosted: new Date().toISOString(),
    serialNumber: Date.now(),
  });
}

export async function deleteArticleDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, "articles", id));
}

// ── Bulk Upload ──────────────────────────────────────────────────────────────

export interface BulkItem {
  data: Record<string, unknown>;
  image: string | null;
}

/** Upload one queued bulk article (resolving author from the authors doc). */
export async function uploadBulkArticle(
  item: BulkItem,
  index: number,
): Promise<string> {
  const data = item.data;
  let authorName = (data.authorName as string) || "Bai Team";
  let authorId = (data.authorId as string) || "admin_default";
  const authorEmail = (data.authorEmail as string) || "";

  if (authorEmail.includes("@")) {
    const snap = await getDoc(doc(db, "authors", authorEmail));
    if (snap.exists()) {
      authorName = (snap.data().displayName as string) || authorName;
      authorId = (snap.data().uid as string) || authorId;
    }
  }

  const content = (data.content as string) || "";
  await addDoc(collection(db, "articles"), {
    title: (data.title as string) || "Untitled",
    summary:
      (data.summary as string) ||
      (content ? content.substring(0, 200) + "..." : "No summary"),
    content,
    contentBeginner: (data.contentBeginner as string) || "",
    contentPro: (data.contentPro as string) || "",
    tags: (data.tags as string[]) || ["news"],
    imageUrl: item.image || "",
    authorEmail,
    authorName,
    authorId,
    status: "active",
    isFeatured: (data.isFeatured as boolean) || false,
    datePosted: new Date().toISOString(),
    serialNumber: Date.now() + index,
    stats: { views: 0, likes: 0, saves: 0 },
  });
  return (data.title as string) || "Untitled";
}

/** Trigger the n8n news-generation webhook and return the generated array. */
export async function triggerNewsGeneration(): Promise<unknown[]> {
  if (!N8N_WEBHOOK_URL) throw new Error("n8n webhook URL is not configured.");
  const response = await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Failed to reach n8n");
  return response.json();
}

// ── Reporter Applications ────────────────────────────────────────────────────

export async function getPendingApplications(): Promise<AuthorDoc[]> {
  const snap = await getDocs(
    query(collection(db, "authors"), where("status", "==", "pending")),
  );
  return snap.docs.map((d) => normalizeAuthor(d.id, d.data()));
}

const approvalEmailHtml = (name: string) => `
<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background-color:#ffffff;color:#333;">
<div style="max-width:600px;margin:0 auto;padding-top:40px;">
<div style="text-align:center;margin-bottom:30px;"><span style="font-size:24px;color:#000;">bitfeed</span></div>
<hr style="border:none;border-top:1px solid #e0e0e0;margin:0 0 40px 0;">
<div style="padding:0 20px;">
<p style="font-size:16px;line-height:1.6;margin-bottom:25px;">Hi ${name},</p>
<p style="font-size:16px;line-height:1.6;margin-bottom:25px;"><strong>Congratulations!</strong> We've received your application and we are thrilled to officially welcome you to the bitfeed newsroom.</p>
<p style="font-size:16px;line-height:1.6;margin-bottom:60px;">Happy reporting,<br><br><strong>bitfeed.team</strong></p>
</div>
<div style="background-color:#000;color:#fff;padding:30px 20px;text-align:center;font-size:12px;"><p style="margin:0;">&copy; 2025 bitfeed news. All rights reserved.</p></div>
</div></body></html>`;

/** Approve a reporter: promote roles and email a welcome. Port of approveReporter. */
export async function approveReporter(
  docId: string,
  name: string,
  email: string,
): Promise<void> {
  await updateDoc(doc(db, "authors", docId), {
    status: "active",
    role: "author",
  });
  await updateDoc(doc(db, "users", email), { role: "author" });

  try {
    await fetch(AUTHOR_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify({
        type: "approve",
        email,
        htmlTemplate: approvalEmailHtml(name),
      }),
    });
  } catch (e) {
    console.warn("Approval email failed to send:", e);
  }
}

export async function rejectReporter(docId: string): Promise<void> {
  await deleteDoc(doc(db, "authors", docId));
}

// ── Migration ────────────────────────────────────────────────────────────────

/** Set status:"active" on every article (batched). Port of migrate-tool. */
export async function migrateAllToActive(
  onLog: (msg: string) => void,
): Promise<void> {
  const snapshot = await getDocs(collection(db, "articles"));
  if (snapshot.empty) {
    onLog("No articles found in database.");
    return;
  }
  onLog(`Found ${snapshot.size} articles. Processing...`);

  let batch = writeBatch(db);
  let count = 0;
  let total = 0;

  for (const docSnap of snapshot.docs) {
    batch.update(doc(db, "articles", docSnap.id), {
      status: "active",
      isFeatured: docSnap.data().isFeatured || false,
    });
    count++;
    total++;
    if (count >= 400) {
      await batch.commit();
      onLog(`... Committed batch of ${count} articles.`);
      batch = writeBatch(db);
      count = 0;
    }
  }
  if (count > 0) await batch.commit();
  onLog(`✅ SUCCESS: Updated ${total} articles to 'active'.`);
}
