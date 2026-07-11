"use client";

// Reporter-recruitment promo banner, ported from initPromoSystem in
// main/index.js. Shown only to signed-in readers — hidden for authors, admins
// and pending reporter candidates.

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

const HIDDEN_ROLES = new Set(["author", "admin", "reporter_candidate"]);

export function Promo() {
  const { user, role } = useAuth();

  if (!user || !role || HIDDEN_ROLES.has(role)) return null;

  return (
    <Link href="/apply" style={{ width: "100%" }}>
      <div className="promo-banner">
        Apply to become an official reporter for bitfeed. Share your voice with
        the community.
      </div>
    </Link>
  );
}
