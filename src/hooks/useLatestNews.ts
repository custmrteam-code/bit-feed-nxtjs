"use client";

// Realtime "latest news" subscription hook. Wraps subscribeLatestNews in a
// component lifecycle so the homepage ticker updates live (onSnapshot).

import { useEffect, useState } from "react";
import { subscribeLatestNews } from "@/lib/data/articles.client";
import type { Article } from "@/lib/firebase/types";

export function useLatestNews() {
  const [articles, setArticles] = useState<Article[] | null>(null);

  useEffect(() => {
    const unsub = subscribeLatestNews(setArticles);
    return unsub;
  }, []);

  return { articles, loading: articles === null };
}
