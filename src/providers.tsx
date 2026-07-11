"use client";

// App-wide client providers. Wraps the tree in a single TanStack Query client
// (created once per browser session) plus the auth context. Rendered from the
// root layout so every Client Component can use queries, mutations and auth.

import { useState, type ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from "@tanstack/react-query";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthModalProvider } from "@/components/auth/AuthModal";
import { ListingSearchProvider } from "@/components/layout/ListingSearch";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Reads are relatively static; avoid hammering Firestore on focus.
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (isServer) return makeQueryClient();
  // Reuse the same client across renders in the browser.
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  // `useState` ensures we don't recreate the client on re-render.
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthModalProvider>
          <ListingSearchProvider>{children}</ListingSearchProvider>
        </AuthModalProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
