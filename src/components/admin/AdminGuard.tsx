"use client";

// Gate for the admin section, ported from the role checks in the admin pages
// (dashboard.html etc.). Redirects non-admins home once auth resolves.

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || role !== "admin") {
      if (!user) {
        router.replace("/");
      } else if (role !== "admin") {
        alert("Access Denied");
        router.replace("/");
      }
    }
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <p style={{ textAlign: "center", marginTop: 80, color: "#888" }}>
        Checking access…
      </p>
    );
  }
  if (!user || role !== "admin") return null;

  return <>{children}</>;
}
