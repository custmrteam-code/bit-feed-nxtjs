// Logged-in user's profile (/profile). Private — not indexed. The interactive
// content is the auth-gated UserProfile client island.

import type { Metadata } from "next";
import { UserProfile } from "@/components/profile/UserProfile";
import "./user.css";

export const metadata: Metadata = {
  title: "Your Profile",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <UserProfile />;
}
