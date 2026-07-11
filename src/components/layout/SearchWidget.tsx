"use client";

// Floating search widget, ported from initSearchLogic in layout/layout.js.
// First toggle-click opens the search box (and warms the cache); subsequent
// clicks toggle the tag-filter tray. Results are computed from the local search
// cache. Suppressed on the /articles listing page (which has its own search).

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  fetchAllSearchData,
  getCachedSearchData,
} from "@/lib/data/searchCache";
import { useListingSearch } from "@/components/layout/ListingSearch";
import { formatDate } from "@/lib/utils/dates";
import { highlightSegments } from "@/lib/utils/text";
import type { SearchableArticle } from "@/lib/firebase/types";

const FILTER_TAGS = [
  { value: "algorithms", label: "Algorithms" },
  { value: "image modal", label: "Image Modal" },
  { value: "video modal", label: "Video Modal" },
  { value: "llms", label: "LLMs" },
  { value: "research", label: "Research" },
  { value: "google", label: "Google" },
  { value: "ai agents", label: "AI Agents" },
] as const;

function Highlighted({
  text,
  query,
  variant,
}: {
  text: string;
  query: string;
  variant: "red" | "bold";
}) {
  if (!query) return <>{text}</>;
  return (
    <>
      {highlightSegments(text, query).map((seg, i) =>
        seg.match ? (
          variant === "red" ? (
            <span key={i} className="highlight-red">
              {seg.text}
            </span>
          ) : (
            <strong key={i}>{seg.text}</strong>
          )
        ) : (
          <Fragment key={i}>{seg.text}</Fragment>
        ),
      )}
    </>
  );
}

export function SearchWidget() {
  const pathname = usePathname();
  const suppressResults = pathname === "/articles";
  const listing = useListingSearch();

  const [open, setOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [results, setResults] = useState<SearchableArticle[]>([]);
  const [loadingIndex, setLoadingIndex] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Event-driven search (mirrors the legacy `performSearch` on input/change).
  const runSearch = useCallback(
    async (q: string, selectedTags: string[]) => {
      if (suppressResults) {
        setResults([]);
        return;
      }
      const term = q.toLowerCase().trim();
      if (term.length === 0 && selectedTags.length === 0) {
        setResults([]);
        return;
      }
      const data = getCachedSearchData() ?? (await fetchAllSearchData());
      setResults(
        data.filter((article) => {
          const matchesText =
            !term ||
            article.searchTitle.includes(term) ||
            article.searchSummary.includes(term);
          const matchesTags =
            selectedTags.length === 0 ||
            selectedTags.some((t) => article.searchTags.includes(t));
          return matchesText && matchesTags;
        }),
      );
    },
    [suppressResults],
  );

  // Close everything when clicking outside the widget.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setFilterOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!open) {
      setOpen(true);
      setFilterOpen(false);
      requestAnimationFrame(() => inputRef.current?.focus());
      if (!getCachedSearchData()) {
        setLoadingIndex(true);
        await fetchAllSearchData();
        setLoadingIndex(false);
      }
    } else {
      setFilterOpen((v) => !v);
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (suppressResults) {
      // On /articles, the floating widget drives the listing instead.
      listing.setQuery(value);
    } else {
      void runSearch(value, tags);
    }
  };

  const toggleTag = (value: string) => {
    const next = tags.includes(value)
      ? tags.filter((t) => t !== value)
      : [...tags, value];
    setTags(next);
    if (suppressResults) {
      listing.setTags(next);
    } else {
      void runSearch(query, next);
    }
  };

  const showResults =
    open && !suppressResults && (query.trim().length > 0 || tags.length > 0);

  // Toggle-button glyph: search (closed) / filter-empty (open) / filled (filter).
  const glyph = !open ? "search" : filterOpen ? "filterFilled" : "filterEmpty";

  return (
    <div className="search-wrapper" ref={wrapperRef}>
      <div className={`search-results-box${showResults ? " active" : ""}`}>
        {showResults &&
          (loadingIndex ? (
            <p style={{ padding: "10px", color: "#888" }}>
              Loading Search Index...
            </p>
          ) : results.length === 0 ? (
            <div className="search-scroll-view">
              <div className="no-results-msg">No results found</div>
            </div>
          ) : (
            <div
              className={`search-scroll-view${results.length < 5 ? " few-results" : ""}`}
            >
              {results.map((article) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.id}`}
                  className="result-card"
                >
                  <h4 style={{ fontFamily: "'Inter', sans-serif" }}>
                    <Highlighted
                      text={article.title}
                      query={query.toLowerCase().trim()}
                      variant="red"
                    />
                  </h4>
                  <p style={{ fontFamily: "sans-serif", fontWeight: 300 }}>
                    <Highlighted
                      text={article.summary}
                      query={query.toLowerCase().trim()}
                      variant="bold"
                    />
                  </p>
                  <span className="result-date">
                    {formatDate(article.datePosted)}
                  </span>
                </Link>
              ))}
            </div>
          ))}
      </div>

      <div className={`filter-options-container${filterOpen ? " visible" : ""}`}>
        {FILTER_TAGS.map((tag) => (
          <div className="filter-tag" key={tag.value}>
            <input
              type="checkbox"
              id={`filter-${tag.value}`}
              name="filter-tags"
              value={tag.value}
              checked={tags.includes(tag.value)}
              onChange={() => toggleTag(tag.value)}
            />
            <label htmlFor={`filter-${tag.value}`}>{tag.label}</label>
          </div>
        ))}
      </div>

      <div className={`search-popup-container${open ? " active" : ""}`}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          className="search-input"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
        />
      </div>

      <button className="search-toggle-btn" onClick={handleToggle}>
        {glyph === "search" && (
          <svg
            className="search-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        )}
        {glyph === "filterEmpty" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/assets/Filter empty Icon.png"
            alt="Filter"
            className="filter-icon1"
            style={{ display: "block" }}
          />
        )}
        {glyph === "filterFilled" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/assets/Filter filled Icon.png"
            alt="Filter"
            className="filter-icon2"
            style={{ display: "block" }}
          />
        )}
      </button>
    </div>
  );
}
