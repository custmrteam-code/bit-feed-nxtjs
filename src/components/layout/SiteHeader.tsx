"use client";

// Global header + slide-out sidebar, ported from the injected markup and logic
// in layout/layout.js (hamburger, nav, profile trigger) and the profile-popup
// logic in layout/auth.js. The pure-CSS hamburger animation is preserved by
// keeping the `#check` checkbox as a sibling of `.btn_toggle` and `.sidebar`.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { logout } from "@/components/auth/auth-actions";
import { SubscribeButton } from "@/components/layout/SubscribeButton";

const NAV_ITEMS = [
  { href: "/", label: "home", icon: "/assets/home.png" },
  { href: "/students", label: "students", icon: "/assets/Student Icon.png" },
  {
    href: "/error-page",
    label: "artificial intelligence",
    icon: "/assets/Tech Icons.png",
  },
] as const;

export function SiteHeader() {
  const { user, role } = useAuth();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profilePopupOpen, setProfilePopupOpen] = useState(false);
  const [mobileOptionsOpen, setMobileOptionsOpen] = useState(false);

  const profileTriggerRef = useRef<HTMLAnchorElement | null>(null);
  const profilePopupRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = role === "admin";
  const displayName =
    user?.displayName || user?.email?.split("@")[0] || "Loading...";

  // Close the desktop profile popup when clicking outside it.
  useEffect(() => {
    if (!profilePopupOpen) return;
    const onClick = (e: MouseEvent) => {
      if (window.innerWidth <= 550) return;
      const target = e.target as Node;
      if (
        !profilePopupRef.current?.contains(target) &&
        !profileTriggerRef.current?.contains(target)
      ) {
        setProfilePopupOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [profilePopupOpen]);

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.innerWidth <= 550) {
      setMobileOptionsOpen((v) => !v);
    } else {
      setProfilePopupOpen((v) => !v);
    }
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div id="global-header">
      <header id="header">
        <div className="main_box">
          <input
            type="checkbox"
            id="check"
            checked={sidebarOpen}
            onChange={(e) => setSidebarOpen(e.target.checked)}
          />
          <label htmlFor="check" className="btn_toggle">
            <div className="background1">
              <div className="menu__icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          </label>

          <nav className="sidebar">
            <hr className="hr1" />
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`menu-item${pathname === item.href ? " active-page" : ""}`}
                onClick={closeSidebar}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.icon} alt="" className="icon4" />
                <span className="label">{item.label}</span>
              </Link>
            ))}

            {/* Mobile profile options (only meaningful when signed in). */}
            {user && (
              <div
                className={`mobile-profile-options${mobileOptionsOpen ? " active" : ""}`}
                id="mobileProfileOptions"
              >
                <Link
                  href="/profile"
                  className="mobile-profile-option"
                  onClick={closeSidebar}
                >
                  <span className="label">profile</span>
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="mobile-profile-option"
                    onClick={closeSidebar}
                  >
                    <span
                      className="label"
                      style={{ color: "#d73634", fontWeight: 500 }}
                    >
                      dashboard
                    </span>
                  </Link>
                )}
                <a
                  href="#"
                  className="mobile-profile-option"
                  onClick={async (e) => {
                    e.preventDefault();
                    await logout();
                    window.location.reload();
                  }}
                >
                  <span className="label">sign out</span>
                </a>
              </div>
            )}

            {user && (
              <a
                href="#"
                ref={profileTriggerRef}
                className="menu-item profile-btn profilebtn-auto"
                id="profileTrigger"
                onClick={handleProfileClick}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/profile Image.png"
                  alt=""
                  className="icon4"
                  id="responsiveImg"
                />
                <span className="label lst-lbl">profile</span>
              </a>
            )}

            {user && (
              <div
                ref={profilePopupRef}
                className={`profile-popup${profilePopupOpen ? " active" : ""}`}
              >
                <div className="profile-header">{displayName}</div>
                <Link href="/profile" className="profile-menu-item">
                  profile
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="profile-menu-item"
                    style={{ color: "#d73634", fontWeight: 500 }}
                  >
                    dashboard
                  </Link>
                )}
                <hr className="profile-divider" />
                <a
                  href="#"
                  className="profile-menu-item"
                  onClick={async (e) => {
                    e.preventDefault();
                    await logout();
                    window.location.reload();
                  }}
                >
                  sign out
                </a>
              </div>
            )}
          </nav>
        </div>

        <Link href="/" className="LOGO">
          bitfeed
        </Link>

        <SubscribeButton />
      </header>
    </div>
  );
}
