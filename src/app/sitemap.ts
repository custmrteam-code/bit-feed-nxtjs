import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";

// Static routes. Article and author pages are dynamic/ISR and indexed via their
// own canonical metadata; enumerate them here later if a full sitemap is needed.
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/articles",
    "/students",
    "/students/resources",
    "/about",
    "/privacy-policy",
  ];
  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
