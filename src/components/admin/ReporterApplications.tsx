"use client";

// Reporter application review, ported from admin/panel.html. Lists pending
// applications; clicking a card opens a detail modal. Approving promotes the
// user to author and emails a welcome; rejecting deletes the application.

import { useCallback, useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  approveReporter,
  getPendingApplications,
  rejectReporter,
} from "@/lib/data/admin.client";
import type { AuthorDoc } from "@/lib/firebase/types";

const PLACEHOLDER = "/assets/profile Image.png";

export function ReporterApplications() {
  const [apps, setApps] = useState<AuthorDoc[] | null>(null);
  const [modal, setModal] = useState<AuthorDoc | null>(null);

  // Refresh after an action (event-driven; resetting to the loading state here
  // is fine because it runs from a handler, not an effect).
  const reload = useCallback(() => {
    setApps(null);
    getPendingApplications().then(setApps);
  }, []);

  // Initial load — setState only inside the promise callback.
  useEffect(() => {
    getPendingApplications().then(setApps);
  }, []);

  const approve = async (app: AuthorDoc) => {
    if (!confirm(`Approve ${app.displayName} as a Reporter?`)) return;
    setModal(null);
    try {
      await approveReporter(app.id, app.displayName ?? "", app.email);
      alert("User Approved & Email Sent!");
      reload();
    } catch (e) {
      alert("Error: " + (e as Error).message);
    }
  };

  const reject = async (app: AuthorDoc) => {
    if (
      !confirm(
        `Reject ${app.displayName}'s reporter application? This will delete their request.`,
      )
    )
      return;
    setModal(null);
    try {
      await rejectReporter(app.id);
      alert(`${app.displayName}'s application has been rejected and removed.`);
      reload();
    } catch (e) {
      alert("Failed to reject. " + (e as Error).message);
    }
  };

  return (
    <div className="admin-page">
      <AdminHeader title="Reporter Applications" backHref="/admin" />
      <main className="panel-container">
        {apps === null ? (
          <p style={{ textAlign: "center", color: "#888", marginTop: 40 }}>
            Loading applications...
          </p>
        ) : apps.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666", marginTop: 40 }}>
            No pending applications.
          </p>
        ) : (
          apps.map((app) => (
            <div
              key={app.id}
              className="request-card"
              onClick={() => setModal(app)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={app.photoURL || PLACEHOLDER}
                className="req-thumb"
                alt="User"
              />
              <div className="request-info">
                <h3>{app.displayName}</h3>
                <p>{app.email}</p>
                <p style={{ fontSize: "0.8rem", color: "#888" }}>
                  {app.specialization || "General"}
                </p>
              </div>
              <button
                className="btn-approve-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  approve(app);
                }}
              >
                Approve
              </button>
              <button
                className="btn-reject-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  reject(app);
                }}
              >
                Reject
              </button>
            </div>
          ))
        )}
      </main>

      <div
        className={`modal-overlay${modal ? " active" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setModal(null);
        }}
      >
        {modal && (
          <div className="modal-card">
            <div className="close-icon" onClick={() => setModal(null)}>
              &times;
            </div>
            <div className="detail-header">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={modal.photoURL || PLACEHOLDER}
                className="detail-img"
                alt=""
              />
              <div className="detail-name">{modal.displayName}</div>
              <div className="detail-email">{modal.email}</div>
            </div>
            <div className="detail-body">
              <div className="detail-item">
                <div className="detail-label">Specialization</div>
                <div className="detail-value">{modal.specialization || "N/A"}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Date of Birth</div>
                <div className="detail-value">{modal.dob || "N/A"}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Location</div>
                <div className="detail-value">{modal.location || "N/A"}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Portfolio / LinkedIn URL</div>
                <div className="detail-value">
                  {modal.portfolioLink ? (
                    <a href={modal.portfolioLink} target="_blank" rel="noreferrer">
                      {modal.portfolioLink}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-approve-sm btn-full-width"
                onClick={() => approve(modal)}
              >
                Approve Reporter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
