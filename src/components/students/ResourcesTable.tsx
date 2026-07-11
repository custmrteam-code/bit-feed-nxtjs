"use client";

// Paginated, tabbed resources table, ported from resources/resources.js.
// Category tabs (credits / discounts / courses), 16 per page, with the same
// "center page" 3-button pagination and left/right arrow-key navigation.

import { useMemo, useState } from "react";
import { byCategory } from "@/lib/data/resources";

const CATEGORIES = [
  { key: "credits", label: "Credit" },
  { key: "discounts", label: "Discounts" },
  { key: "courses", label: "Courses (Selected)" },
] as const;

const ITEMS_PER_PAGE = 16;

export function ResourcesTable() {
  const [category, setCategory] = useState<string>("credits");
  const [currentPage, setCurrentPage] = useState(1);
  const [centerPage, setCenterPage] = useState(1);

  const items = useMemo(() => byCategory(category), [category]);
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  const switchCategory = (key: string) => {
    setCategory(key);
    setCurrentPage(1);
    setCenterPage(1);
  };

  const goToPage = (n: number) => {
    setCenterPage(n);
    setCurrentPage(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const visible = items.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const prevNum = centerPage - 1;
  const nextNum = centerPage + 1;
  const circleClass = (n: number) =>
    `page-circle ${n === currentPage ? "active" : "inactive"}`;

  return (
    <main className="main-container resources-page">
      <nav className="category-tabs" aria-label="Resource Categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`tab-btn${category === cat.key ? " active" : ""}`}
            onClick={() => switchCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </nav>

      <section className="resources-section">
        {visible.length === 0 ? (
          <div className="no-results">
            <p>No resources found in this category.</p>
          </div>
        ) : (
          <table className="resources-table">
            <thead>
              <tr>
                <th scope="col">Resource</th>
                <th scope="col">Value</th>
                <th scope="col">Description</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.resource}>
                  <td>{item.resource}</td>
                  <td>{item.value}</td>
                  <td>{item.description}</td>
                  <td>
                    <a
                      href={item.link || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="apply-link"
                    >
                      Apply Now
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {totalPages > 1 && (
        <div className="pagination-bar">
          <div className="pagination-wrapper">
            <button
              className="arrow-btn"
              aria-label="Previous Page"
              onClick={() => centerPage > 1 && setCenterPage(centerPage - 1)}
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
              onClick={() =>
                centerPage < totalPages && setCenterPage(centerPage + 1)
              }
            >
              <svg viewBox="0 0 24 24">
                <path d="M22 12l-20 10V2z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
