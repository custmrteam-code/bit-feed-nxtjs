import type {
  Article,
  ArticleStats,
  AuthorDoc,
  SearchableArticle,
} from "@/lib/firebase/types";

// Helpers to normalize raw Firestore documents (from either the Admin SDK or
// the Web SDK) into the plain, serializable domain shapes used app-wide. The
// legacy code handled three date representations interchangeably — Firestore
// `Timestamp` (`.toDate()` / `.seconds`), ISO strings, and `Date` — so we do
// the same and collapse everything to epoch milliseconds.

type UnknownRecord = Record<string, unknown>;

/** Convert any supported date representation to epoch milliseconds. */
export function toMillis(value: unknown): number | null {
  if (value == null) return null;

  if (typeof value === "number") return value;

  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isNaN(t) ? null : t;
  }

  if (typeof value === "object") {
    const v = value as UnknownRecord;
    // Firestore Timestamp (client or admin) exposes toMillis().
    if (typeof v.toMillis === "function") {
      return (v.toMillis as () => number)();
    }
    // Firestore Timestamp also exposes toDate().
    if (typeof v.toDate === "function") {
      return (v.toDate as () => Date)().getTime();
    }
    // Plain { seconds, nanoseconds } (e.g. after JSON round-trips).
    if (typeof v.seconds === "number") {
      const nanos = typeof v.nanoseconds === "number" ? v.nanoseconds : 0;
      return v.seconds * 1000 + Math.floor(nanos / 1e6);
    }
    // Some Admin SDK serializations use _seconds / _nanoseconds.
    if (typeof v._seconds === "number") {
      const nanos = typeof v._nanoseconds === "number" ? v._nanoseconds : 0;
      return v._seconds * 1000 + Math.floor(nanos / 1e6);
    }
  }

  if (typeof value === "string") {
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? null : t;
  }

  return null;
}

function normalizeStats(value: unknown): ArticleStats {
  const s = (value ?? {}) as UnknownRecord;
  return {
    views: typeof s.views === "number" ? s.views : 0,
    likes: typeof s.likes === "number" ? s.likes : 0,
    saves: typeof s.saves === "number" ? s.saves : 0,
  };
}

/** Build a normalized `Article` from a raw Firestore doc's id + data. */
export function normalizeArticle(id: string, data: UnknownRecord): Article {
  return {
    id,
    title: (data.title as string) ?? "",
    summary: (data.summary as string) ?? "",
    content: (data.content as string) ?? "",
    contentBeginner: (data.contentBeginner as string) ?? undefined,
    contentPro: (data.contentPro as string) ?? undefined,
    contentVersions: (data.contentVersions as Article["contentVersions"]) ?? undefined,
    imageUrl: (data.imageUrl as string) ?? undefined,
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    targetLevel: (data.targetLevel as Article["targetLevel"]) ?? undefined,
    authorName: (data.authorName as string) ?? undefined,
    authorEmail: (data.authorEmail as string) ?? undefined,
    authorImage: (data.authorImage as string) ?? undefined,
    datePosted: toMillis(data.datePosted),
    serialNumber:
      typeof data.serialNumber === "number" ? data.serialNumber : undefined,
    isFeatured: Boolean(data.isFeatured),
    status: (data.status as Article["status"]) ?? "active",
    stats: normalizeStats(data.stats),
  };
}

/** Build a normalized `AuthorDoc` from a raw Firestore doc's id + data. */
export function normalizeAuthor(id: string, data: UnknownRecord): AuthorDoc {
  return {
    id,
    email: (data.email as string) ?? id,
    displayName: (data.displayName as string) ?? undefined,
    specialization: (data.specialization as string) ?? undefined,
    location: (data.location as string) ?? undefined,
    portfolioLink: (data.portfolioLink as string) ?? undefined,
    photoURL: (data.photoURL as string) ?? undefined,
    bannerURL: (data.bannerURL as string) ?? undefined,
    bio: (data.bio as string) ?? undefined,
    dob: (data.dob as string) ?? undefined,
    status: (data.status as AuthorDoc["status"]) ?? "pending",
    role: (data.role as AuthorDoc["role"]) ?? "reporter_candidate",
    articleCount:
      typeof data.articleCount === "number" ? data.articleCount : 0,
    followers: Array.isArray(data.followers) ? (data.followers as string[]) : [],
    joinedDate: toMillis(data.joinedDate),
  };
}

/** Add lowercased search fields (mirrors the legacy localStorage cache). */
export function toSearchable(article: Article): SearchableArticle {
  return {
    ...article,
    searchTitle: (article.title || "").toLowerCase(),
    searchSummary: (article.summary || "").toLowerCase(),
    searchTags: (article.tags || []).map((t) => t.toLowerCase()),
  };
}
