// Domain types mirroring the Firestore documents.
//
// IMPORTANT: dates are normalized to epoch-milliseconds (`number`) the moment
// data crosses the data-access boundary (see `normalizeArticle` in the data
// layer). This keeps a single shape everywhere and lets Server Components hand
// plain objects to Client Components without serializing class instances
// (Firestore `Timestamp`s are not serializable across the RSC boundary).

export type UserRole =
  | "guest"
  | "reader"
  | "reporter_candidate"
  | "author"
  | "admin";

/** Audience level an article targets / a content version is written for. */
export type ContentLevel = "beginner" | "intermediate" | "pro";

/** Article lifecycle. The live code uses "active" (the README's "approved" is stale). */
export type ArticleStatus = "active" | "pending";

export interface ArticleStats {
  views: number;
  likes: number;
  saves: number;
}

/** Optional multi-level body. Any subset of levels may be present. */
export type ContentVersions = Partial<Record<ContentLevel, string>>;

/** A news article, normalized for use across server + client. */
export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  /** Optional alternate-difficulty bodies (live code uses flat fields). */
  contentBeginner?: string;
  contentPro?: string;
  contentVersions?: ContentVersions;
  imageUrl?: string;
  tags: string[];
  targetLevel?: ContentLevel;
  authorName?: string;
  authorEmail?: string;
  authorImage?: string;
  /** Epoch milliseconds, or null if unset. */
  datePosted: number | null;
  serialNumber?: number;
  isFeatured?: boolean;
  status: ArticleStatus;
  stats: ArticleStats;
}

/**
 * Article enriched with lowercased search fields, mirroring the client-side
 * search cache built by the legacy `fetchAllSearchData`.
 */
export interface SearchableArticle extends Article {
  searchTitle: string;
  searchSummary: string;
  searchTags: string[];
}

/** A user/reader document, keyed in Firestore by lowercased email. */
export interface UserDoc {
  uid?: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  authProvider?: string;
  role: UserRole;
  isNewsletterSubscribed?: boolean;
  savedArticles?: string[];
  following?: string[];
  /** Epoch milliseconds. */
  createdAt?: number | null;
  lastLogin?: number | null;
}

/** A reporter application / author profile, keyed in Firestore by email. */
export interface AuthorDoc {
  /** Firestore document id (usually the email; legacy data may use a name). */
  id: string;
  email: string;
  displayName?: string;
  specialization?: string;
  location?: string;
  portfolioLink?: string;
  photoURL?: string;
  bannerURL?: string;
  bio?: string;
  dob?: string;
  status: "pending" | "approved" | "rejected";
  role: UserRole;
  articleCount?: number;
  followers?: string[];
  /** Epoch milliseconds. */
  joinedDate?: number | null;
}
