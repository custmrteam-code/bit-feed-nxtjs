// Multi-article listing (/articles). Server Component for metadata + JSON-LD;
// the paginated, searchable feed itself is the MultiArticleList client island.

import type { Metadata } from "next";
import { MultiArticleList } from "@/components/article/MultiArticleList";
import { SITE_URL } from "@/lib/env";
import "./multi-article.css";

export const metadata: Metadata = {
  title: "Latest Articles",
  description:
    "Browse all curated business, AI, and innovation articles on bitfeed.",
  alternates: { canonical: `${SITE_URL}/articles` },
  openGraph: {
    title: "Latest Articles — bitfeed",
    description:
      "Browse all curated business, AI, and innovation articles on bitfeed.",
    url: `${SITE_URL}/articles`,
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Latest Articles",
  description:
    "Browse all curated business, AI, and innovation articles on bitfeed.",
  url: `${SITE_URL}/articles`,
  publisher: {
    "@type": "Organization",
    name: "bitfeed by custmr.team",
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/assets/favicon.png`,
    },
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Articles",
        item: `${SITE_URL}/articles`,
      },
    ],
  },
};

export default function MultiArticlePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MultiArticleList />
    </>
  );
}
