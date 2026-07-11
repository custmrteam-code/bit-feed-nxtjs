"use client";

// Shared search state that lets the global floating SearchWidget drive the
// /articles listing (mirroring the legacy behavior where the same #searchInput
// filtered the multi-article feed instead of showing the floating results).

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface ListingSearchValue {
  query: string;
  tags: string[];
  setQuery: (q: string) => void;
  setTags: (t: string[]) => void;
}

const ListingSearchContext = createContext<ListingSearchValue | undefined>(
  undefined,
);

export function ListingSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const value = useMemo(
    () => ({ query, tags, setQuery, setTags }),
    [query, tags],
  );
  return (
    <ListingSearchContext.Provider value={value}>
      {children}
    </ListingSearchContext.Provider>
  );
}

export function useListingSearch(): ListingSearchValue {
  const ctx = useContext(ListingSearchContext);
  if (!ctx) {
    throw new Error("useListingSearch must be used within <ListingSearchProvider>");
  }
  return ctx;
}
