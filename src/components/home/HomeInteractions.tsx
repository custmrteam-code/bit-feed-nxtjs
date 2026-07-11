"use client";

// Homepage keyboard shortcuts + stepped section scrolling, ported from the
// keydown / scroll handlers in main/index.js. Renders nothing.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SECTION_SELECTORS = [
  ".HOME",
  ".page1",
  ".PAGE:nth-of-type(2)",
  ".PAGE:nth-of-type(3)",
];

export function HomeInteractions() {
  const router = useRouter();

  useEffect(() => {
    let currentSectionIndex = 0;
    let isSteppedScrolling = true;

    const isTyping = (el: EventTarget | null) => {
      const node = el as HTMLElement | null;
      return (
        node?.tagName === "INPUT" ||
        node?.tagName === "TEXTAREA" ||
        node?.isContentEditable === true
      );
    };

    const scrollToSection = (index: number) => {
      const target = document.querySelector(SECTION_SELECTORS[index]);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;

      // Letter shortcuts.
      switch (e.key.toLowerCase()) {
        case "s":
          router.push("/students");
          return;
        case "i":
          router.push("/error-page");
          return;
        case "m":
          router.push("/articles");
          return;
      }

      // Stepped scroll with arrow keys.
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!isSteppedScrolling) return;
        e.preventDefault();
        if (e.key === "ArrowDown") {
          if (currentSectionIndex < SECTION_SELECTORS.length - 1) {
            currentSectionIndex++;
            scrollToSection(currentSectionIndex);
          } else {
            isSteppedScrolling = false;
          }
        } else if (currentSectionIndex > 0) {
          currentSectionIndex--;
          scrollToSection(currentSectionIndex);
        }
      }
    };

    const onScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight / 2;
      SECTION_SELECTORS.forEach((sel, idx) => {
        const el = document.querySelector<HTMLElement>(sel);
        if (!el) return;
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        if (scrollPos >= top && scrollPos <= bottom) {
          currentSectionIndex = idx;
          isSteppedScrolling = true;
        }
      });
    };

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, [router]);

  return null;
}
