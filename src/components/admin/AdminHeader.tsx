"use client";

// Shared sticky admin header with a back button + centered title.

import { useRouter } from "next/navigation";

export function AdminHeader({
  title,
  backHref,
}: {
  title: string;
  backHref?: string;
}) {
  const router = useRouter();
  return (
    <header className="admin-header">
      <button
        className="admin-back"
        aria-label="Back"
        onClick={() => (backHref ? router.push(backHref) : router.back())}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          width={25}
          height={25}
          src="https://img.icons8.com/pixels/32/u-turn-to-left.png"
          alt="Back"
        />
      </button>
      <h1>{title}</h1>
    </header>
  );
}
