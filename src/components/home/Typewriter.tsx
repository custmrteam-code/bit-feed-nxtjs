"use client";

// Hero typewriter, ported from the TxtType logic + auth guard in main/index.js.
// Animates only when the user is logged in and hasn't seen it this session;
// otherwise it shows the final tagline statically. Dots render in accent red.

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

const PHRASES = ["Welcome to bitfeed", "Clean. Minimal. Insights."];
const PERIOD = 2000;
const FINAL = PHRASES[PHRASES.length - 1];

/** Render a string with every "." wrapped in a red dot span. */
function withRedDots(text: string) {
  return text.split(/(\.)/).map((part, i) =>
    part === "." ? (
      <span key={i} className="red-dot">
        .
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function Typewriter() {
  const { user, loading } = useAuth();
  const [text, setText] = useState(FINAL);
  const [animating, setAnimating] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    let hasPlayed = false;
    try {
      hasPlayed = sessionStorage.getItem("typewriterPlayed") === "true";
    } catch {
      /* ignore */
    }
    if (hasPlayed) return;

    try {
      sessionStorage.setItem("typewriterPlayed", "true");
    } catch {
      /* ignore */
    }

    let loopNum = 0;
    let isDeleting = false;
    let txt = "";
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const full = PHRASES[loopNum];
      txt = isDeleting
        ? full.substring(0, txt.length - 1)
        : full.substring(0, txt.length + 1);
      setText(txt);

      let delta = 150 - Math.random() * 100;
      if (isDeleting) delta /= 2;

      if (!isDeleting && txt === full) {
        if (loopNum === PHRASES.length - 1) {
          setAnimating(false); // final phrase reached — stop, drop caret
          return;
        }
        delta = PERIOD;
        isDeleting = true;
      } else if (isDeleting && txt === "") {
        isDeleting = false;
        loopNum++;
        delta = 500;
      }

      timer.current = setTimeout(tick, delta);
    };

    // Kick off in a timeout so the initial state update happens in a callback
    // (not synchronously inside the effect body).
    timer.current = setTimeout(() => {
      setAnimating(true);
      tick();
    }, 0);

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [user, loading]);

  return (
    <h1 className="name">
      <span className="typewrite">
        <span className={`wrap${animating ? " typewrite-caret" : ""}`}>
          {withRedDots(text)}
        </span>
      </span>
    </h1>
  );
}
