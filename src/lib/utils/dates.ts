// Date formatting helpers, ported from the legacy pages. Inputs are epoch
// milliseconds (our normalized form) or null.

/** "23 Jun 2026" — matches the legacy `toLocaleDateString('en-GB', …)` calls. */
export function formatDate(ms: number | null | undefined): string {
  if (ms == null) return "";
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Relative time label ("Just now", "5 mins", "3 hours", "2 days").
 * Faithful port of `getTimeAgo` from main/index.js.
 */
export function getTimeAgo(ms: number | null | undefined): string {
  if (ms == null) return "";
  const seconds = Math.floor((Date.now() - ms) / 1000);

  let interval = seconds / 3600;
  if (interval > 24) return Math.floor(interval / 24) + " days";
  if (interval > 1) return Math.floor(interval) + " hours";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins";

  return "Just now";
}
