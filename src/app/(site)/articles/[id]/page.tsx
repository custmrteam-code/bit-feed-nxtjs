// Single article page (Server Component). The article is fetched + rendered on
// the server for SEO/latency; generateMetadata replaces the JS-mutated OG/
// Twitter/canonical tags, and JSON-LD is emitted inline. Interactions live in
// the ArticleView client island.

import type { Metadata } from "next";
import { getArticleById } from "@/lib/data/articles.server";
import { ArticleView } from "@/components/article/ArticleView";
import { SITE_URL } from "@/lib/env";
import "../article.css";

export const revalidate = 300;

type PageProps = { params: Promise<{ id: string }> };

function absoluteImage(imageUrl: string | undefined): string {
  if (!imageUrl) return `${SITE_URL}/assets/favicon.png`;
  return imageUrl.startsWith("http") || imageUrl.startsWith("data:")
    ? imageUrl
    : `${SITE_URL}${imageUrl}`;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) return { title: "Article not found" };

  const title = article.title || "bitfeed";
  const description = article.summary || "Clean. Minimal. Insights.";
  const image = absoluteImage(article.imageUrl);
  const url = `${SITE_URL}/articles/${id}`;

  return {
    title,
    description,
    authors: [{ name: article.authorName || "bitfeed" }],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) {
    return (
      <section className="main article-page">
        <h1 style={{ textAlign: "center" }}>Article not found.</h1>
      </section>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    image: absoluteImage(article.imageUrl),
    datePublished: article.datePosted
      ? new Date(article.datePosted).toISOString()
      : undefined,
    url: `${SITE_URL}/articles/${id}`,
    author: { "@type": "Person", name: article.authorName || "bitfeed" },
    publisher: {
      "@type": "Organization",
      name: "bitfeed by custmr.team",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/assets/favicon.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/articles/${id}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleView article={article} />
    </>
  );
}
