// Public author profile (/author/[email]). SSR-fetches the author, their
// articles and similar reporters; generateMetadata + JSON-LD for SEO.

import type { Metadata } from "next";
import {
  getArticlesByAuthor,
  getAuthorById,
  getSimilarAuthors,
} from "@/lib/data/authors.server";
import { AuthorProfile } from "@/components/profile/AuthorProfile";
import { SITE_URL } from "@/lib/env";
import "../author.css";

export const revalidate = 300;

type PageProps = { params: Promise<{ email: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { email } = await params;
  const author = await getAuthorById(decodeURIComponent(email));
  if (!author || author.role !== "author") {
    return { title: "Author not found", robots: { index: false } };
  }
  const name = author.displayName || "Reporter";
  const description =
    author.bio || `View ${name}'s profile and articles on bitfeed.`;
  return {
    title: `${name} — Reporter`,
    description,
    alternates: { canonical: `${SITE_URL}/author/${email}` },
    openGraph: {
      type: "profile",
      title: `${name} — bitfeed`,
      description,
      url: `${SITE_URL}/author/${email}`,
      images: [author.photoURL || `${SITE_URL}/assets/favicon.png`],
    },
  };
}

export default async function AuthorPage({ params }: PageProps) {
  const { email } = await params;
  const id = decodeURIComponent(email);
  const author = await getAuthorById(id);

  // Mirror the legacy guard: only approved authors get a public page.
  if (!author || author.role !== "author") {
    return (
      <main className="profile-container author-page">
        <h1>Author not found.</h1>
      </main>
    );
  }

  const [articles, similar] = await Promise.all([
    getArticlesByAuthor(id),
    getSimilarAuthors(id),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: { "@type": "Person", name: author.displayName || "Reporter" },
    publisher: {
      "@type": "Organization",
      name: "bitfeed by custmr.team",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/assets/favicon.png`,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AuthorProfile author={author} articles={articles} similar={similar} />
    </>
  );
}
