// Admin section layout — chrome-free (own headers) and role-guarded. Not
// indexed. Loads the shared admin stylesheet.

import type { Metadata } from "next";
import { AdminGuard } from "@/components/admin/AdminGuard";
import "./admin.css";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminGuard>{children}</AdminGuard>;
}
