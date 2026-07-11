// Full student resources listing (/students/resources). Server Component for
// metadata; the tabbed, paginated table is the ResourcesTable client island.

import type { Metadata } from "next";
import { ResourcesTable } from "@/components/students/ResourcesTable";
import { SITE_URL } from "@/lib/env";
import "./resources.css";

export const metadata: Metadata = {
  title: "Free Student Resources & Discounts",
  description:
    "Access free student resources, exclusive discounts, and credits for AI tools and courses.",
  alternates: { canonical: `${SITE_URL}/students/resources` },
};

export default function ResourcesPage() {
  return <ResourcesTable />;
}
