// Admin dashboard (/admin) — hub linking to the admin tools.

import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";

const CARDS = [
  {
    href: "/admin/post",
    icon: "https://img.icons8.com/ios/100/edit--v1.png",
    title: "Post Article",
    desc: "Manually write and publish a single new article.",
  },
  {
    href: "/admin/requests",
    icon: "https://img.icons8.com/ios/100/news.png",
    title: "Review Articles",
    desc: "Approve, Edit, or Reject pending submissions.",
  },
  {
    href: "/admin/panel",
    icon: "https://img.icons8.com/ios/100/conference-call.png",
    title: "Review Reporters",
    desc: "Manage user roles and approve applications.",
  },
  {
    href: "/admin/bulk-upload",
    icon: "https://img.icons8.com/ios/100/upload-to-cloud.png",
    title: "Bulk Upload",
    desc: "Directly upload articles from a JSON file.",
  },
];

export default function AdminDashboard() {
  return (
    <div className="admin-page">
      <AdminHeader title="Admin Dashboard" backHref="/" />
      <div className="dash-container">
        <div className="dash-intro">
          <h2>Welcome Back</h2>
          <p>Select an administrative task to continue managing the platform.</p>
        </div>
        <div className="options-grid">
          {CARDS.map((card) => (
            <Link key={card.href} href={card.href} className="dash-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.icon} className="dash-icon" alt={card.title} />
              <div className="dash-title">{card.title}</div>
              <div className="dash-desc">{card.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
