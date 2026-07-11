"use client";

// The header action button, ported from updateUIForUser in layout/auth.js.
// Its label + behavior depend on the signed-in role:
//   guest  → "subscribe" (opens the auth modal)
//   reader → "subscribed" (disabled; hidden on mobile)
//   author → "create post" (→ /admin/post)
//   admin  → "dashboard"   (→ /admin)

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAuthModal } from "@/components/auth/AuthModal";

const BellIcon = () => (
  <span className="icon">
    <svg viewBox="0 0 448 512" className="bell">
      <path d="M224 0c-17.7 0-32 14.3-32 32V49.9C119.5 61.4 64 124.2 64 200v33.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416H424c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6C399.5 322.9 384 278.8 384 233.4V200c0-75.8-55.5-138.6-128-150.1V32c0-17.7-14.3-32-32-32zm0 96h8c57.4 0 104 46.6 104 104v33.4c0 47.9 13.9 94.6 39.7 134.6H72.3C98.1 328 112 281.3 112 233.4V200c0-57.4 46.6-104 104-104h8zm64 352H224 160c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7s18.7-28.3 18.7-45.3z" />
    </svg>
  </span>
);

const blackStyle = { backgroundColor: "#000", color: "#fff" } as const;

export function SubscribeButton() {
  const { user, role, loading } = useAuth();
  const { open } = useAuthModal();
  const router = useRouter();

  // Mirror the legacy `.auth-ready` reveal once auth state is known.
  const readyClass = loading ? "noselect" : "noselect auth-ready";

  if (user && role === "admin") {
    return (
      <button
        className={readyClass}
        style={blackStyle}
        onClick={() => router.push("/admin")}
      >
        <span className="text">dashboard</span>
      </button>
    );
  }

  if (user && role === "author") {
    return (
      <button
        className={readyClass}
        style={blackStyle}
        onClick={() => router.push("/admin/post")}
      >
        <span className="text">create post</span>
      </button>
    );
  }

  if (user) {
    // Readers (and reporter candidates) are already subscribed.
    return (
      <button
        className={readyClass}
        style={{ ...blackStyle, pointerEvents: "none" }}
      >
        <span className="text">subscribed</span>
      </button>
    );
  }

  // Guest / signed out.
  return (
    <button className={readyClass} onClick={open}>
      <span className="text">subscribe</span>
      <BellIcon />
    </button>
  );
}
