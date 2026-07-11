"use client";

// Paginated article feed, ported from articles/multi-article.js. Reads the
// local search cache, filters by the shared listing-search (driven by the
// global floating search widget), and paginates 7 per page with the original
// "center page" 3-button control. Arrow keys move between pages.

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { fetchAllSearchData } from "@/lib/data/searchCache";
import { useListingSearch } from "@/components/layout/ListingSearch";
import { formatDate } from "@/lib/utils/dates";
import { highlightSegments } from "@/lib/utils/text";
import type { SearchableArticle } from "@/lib/firebase/types";

const ITEMS_PER_PAGE = 7;

function Skeleton() {
  return (
    <section className="articles-container">
      {Array.from({ length: 6 }).map((_, i) => (
        <Fragment key={i}>
          <div className="sk-card">
            <div className="skeleton sk-title" />
            <div className="skeleton sk-date" />
            <div className="skeleton sk-summary" />
            <div className="skeleton sk-summary short" />
          </div>
          <hr className="sk-hr" />
        </Fragment>
      ))}
    </section>
  );
}

function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  return (
    <>
      {highlightSegments(text, query).map((seg, i) =>
        seg.match ? (
          <span key={i} className="highlight-red">
            {seg.text}
          </span>
        ) : (
          <Fragment key={i}>{seg.text}</Fragment>
        ),
      )}
    </>
  );
}

export function MultiArticleList() {
  const { query, tags } = useListingSearch();
  const [all, setAll] = useState<SearchableArticle[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [centerPage, setCenterPage] = useState(1);
  const listRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    fetchAllSearchData().then((data) =>
      setAll(data.filter((a) => a.status === "active")),
    );
  }, []);

  const q = query.toLowerCase().trim();

  const filtered = useMemo(() => {
    if (!all) return [];
    const activeTags = tags.map((t) => t.toLowerCase());
    return all.filter((article) => {
      const matchesText =
        !q ||
        article.searchTitle.includes(q) ||
        article.searchSummary.includes(q);
      const matchesTags =
        activeTags.length === 0 ||
        activeTags.some((t) => article.searchTags.includes(t));
      return matchesText && matchesTags;
    });
  }, [all, q, tags]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  // Reset to the first page when the filter changes — the React-sanctioned
  // "adjust state during render from previous props" pattern (no effect).
  const filterKey = `${q}|${tags.join(",")}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
    setCenterPage(1);
  }

  const loadPage = useCallback((n: number) => {
    setCurrentPage(n);
    listRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const goToPage = (n: number) => {
    setCenterPage(n);
    loadPage(n);
  };

  // Keyboard navigation (ignored while typing in an input).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (
        el?.tagName === "INPUT" ||
        el?.tagName === "TEXTAREA" ||
        el?.isContentEditable
      )
        return;
      if (e.key === "ArrowRight" && currentPage < totalPages) {
        setCenterPage(Math.min(totalPages, currentPage + 1));
        loadPage(currentPage + 1);
      } else if (e.key === "ArrowLeft" && currentPage > 1) {
        setCenterPage(Math.max(1, currentPage - 1));
        loadPage(currentPage - 1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [currentPage, totalPages, loadPage]);

  const visible = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const prevNum = centerPage - 1;
  const nextNum = centerPage + 1;

  const circleClass = (n: number) =>
    `page-circle ${n === currentPage ? "active" : "inactive"}`;

  return (
    <>
      <main className="ma-main ma-list" ref={listRef}>
        <p className="topic">Latest Articles</p>
        <hr className="Line1" />

        {all === null ? (
          <Skeleton />
        ) : (
          <section className="articles-container fade-in" id="articles-list">
            {visible.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 0" }}>
                <p>No articles match your criteria.</p>
              </div>
            ) : (
              visible.map((article) => (
                <Fragment key={article.id}>
                  <Link className="article-card" href={`/articles/${article.id}`}>
                    <h3 className="article-title">
                      <Highlighted text={article.title} query={q} />
                    </h3>
                    <p className="date">{formatDate(article.datePosted)}</p>
                    <p className="article-summary">
                      <Highlighted text={article.summary} query={q} />
                    </p>
                  </Link>
                  <hr />
                </Fragment>
              ))
            )}
          </section>
        )}
      </main>

      <div className="pagination-bar">
        <div className="pagination-wrapper">
          <button
            className="arrow-btn"
            aria-label="Previous Page"
            onClick={() => {
              if (centerPage > 1) setCenterPage(centerPage - 1);
            }}
          >
            <svg viewBox="0 0 24 24">
              <path d="M2 12l20 10V2z" />
            </svg>
          </button>

          <div id="pages-container">
            {prevNum >= 1 ? (
              <button
                className={circleClass(prevNum)}
                onClick={() => goToPage(prevNum)}
              >
                {prevNum}
              </button>
            ) : (
              <div
                className="page-circle placeholder"
                style={{ width: "3.5rem", visibility: "hidden" }}
              />
            )}

            <button
              className={circleClass(centerPage)}
              onClick={() => goToPage(centerPage)}
            >
              {centerPage}
            </button>

            {nextNum <= totalPages ? (
              <button
                className={circleClass(nextNum)}
                onClick={() => goToPage(nextNum)}
              >
                {nextNum}
              </button>
            ) : (
              <div
                className="page-circle placeholder"
                style={{ width: "3.5rem", visibility: "hidden" }}
              />
            )}
          </div>

          <button
            className="arrow-btn"
            aria-label="Next Page"
            onClick={() => {
              if (centerPage < totalPages) setCenterPage(centerPage + 1);
            }}
          >
            <svg viewBox="0 0 24 24">
              <path d="M22 12l-20 10V2z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
