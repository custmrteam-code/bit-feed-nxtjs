// Become-a-reporter application (/apply). Server Component for metadata; the
// auth-gated form is the ApplyForm client island.

import type { Metadata } from "next";
import { ApplyForm } from "@/components/profile/ApplyForm";
import { SITE_URL } from "@/lib/env";
import "./apply.css";

export const metadata: Metadata = {
  title: "Join the Newsroom — Apply as a Reporter",
  description:
    "Apply to become an official reporter for bitfeed. Share your voice, join our community-driven newsroom by custmr.team.",
  alternates: { canonical: `${SITE_URL}/apply` },
};

export default function ApplyPage() {
  return <ApplyForm />;
}
