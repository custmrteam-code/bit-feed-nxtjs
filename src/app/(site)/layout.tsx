// Layout for the public-facing site: wraps pages in the global header, footer
// and floating search. The admin section uses its own chrome-free layout, so
// these are scoped here (a route group, which doesn't affect URLs).

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SearchWidget } from "@/components/layout/SearchWidget";
import "@/components/layout/layout.css";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
      <SearchWidget />
    </>
  );
}
