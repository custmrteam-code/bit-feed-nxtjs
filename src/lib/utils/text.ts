// Text helpers ported from the legacy pages.

/** Title-cases every word, lowercasing the rest. Port of `capitalizeWords`. */
export function capitalizeWords(str: string): string {
  if (!str) return "";
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Escape a string for safe use inside a RegExp. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Split `text` around case-insensitive matches of `query`, returning segments
 * tagged as matches or not. The React caller renders matches in the accent
 * color — replacing the legacy `highlightText` which injected raw HTML.
 */
export interface HighlightSegment {
  text: string;
  match: boolean;
}

export function highlightSegments(
  text: string,
  query: string,
): HighlightSegment[] {
  if (!text) return [];
  if (!query) return [{ text, match: false }];

  // Strip any embedded HTML, matching the legacy behavior.
  const safeText = text.replace(/(<([^>]+)>)/gi, "");
  const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
  const lowerQuery = query.toLowerCase();

  // Splitting on a capturing group keeps the matched substrings as elements;
  // those are exactly the parts that equal the query (case-insensitively).
  return safeText
    .split(regex)
    .filter((part) => part.length > 0)
    .map((part) => ({ text: part, match: part.toLowerCase() === lowerQuery }));
}
