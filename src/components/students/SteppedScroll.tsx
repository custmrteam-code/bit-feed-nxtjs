"use client";

// Arrow-key stepped section scrolling, ported from the keydown/scroll handlers
// in students.js. Renders nothing.

import { useEffect } from "react";

export function SteppedScroll({ selectors }: { selectors: string[] }) {
  useEffect(() => {
    let index = 0;
    let stepping = true;

    const isTyping = (el: EventTarget | null) => {
      const node = el as HTMLElement | null;
      return (
        node?.tagName === "INPUT" ||
        node?.tagName === "TEXTAREA" ||
        node?.isContentEditable === true
      );
    };

    const scrollTo = (i: number) =>
      document
        .querySelector(selectors[i])
        ?.scrollIntoView({ behavior: "smooth", block: "center" });

    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      if (!stepping) return;
      e.preventDefault();
      if (e.key === "ArrowDown") {
        if (index < selectors.length - 1) scrollTo(++index);
        else stepping = false;
      } else if (index > 0) {
        scrollTo(--index);
      }
    };

    const onScroll = () => {
      const pos = window.scrollY + window.innerHeight / 2;
      selectors.forEach((sel, i) => {
        const el = document.querySelector<HTMLElement>(sel);
        if (el && pos >= el.offsetTop && pos <= el.offsetTop + el.offsetHeight) {
          index = i;
          stepping = true;
        }
      });
    };

    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [selectors]);

  return null;
}
