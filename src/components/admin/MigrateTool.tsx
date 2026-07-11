"use client";

// Database migration utility, ported from admin/migrate-tool.html. One-off tool
// that sets status:"active" on every article (batched). Admin-gated by layout.

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { migrateAllToActive } from "@/lib/data/admin.client";

interface LogLine {
  text: string;
  type?: "success" | "error" | "warning";
}

export function MigrateTool() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogLine[]>([
    { text: "Logs will appear here..." },
  ]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const append = (text: string, type?: LogLine["type"]) =>
    setLogs((prev) => [...prev, { text, type }]);

  const run = async () => {
    if (!user) return alert("Please login first.");
    if (!confirm("Are you sure? This will update ALL articles to 'Active' status."))
      return;

    setRunning(true);
    setLogs([{ text: "🚀 Starting Migration..." }]);
    try {
      await migrateAllToActive((msg) =>
        append(msg, msg.startsWith("✅") ? "success" : undefined),
      );
      setDone(true);
    } catch (e) {
      append(`❌ ERROR: ${(e as Error).message}`, "error");
      append(
        `\nTIP: Ensure your account (${user.email}) has 'role: admin' in the 'users' collection.`,
        "warning",
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="migrate-page">
      <h1>⚠️ DATABASE MIGRATION TOOL</h1>
      <div className="migrate-auth" style={{ borderColor: user ? "#0f0" : "#f00" }}>
        {user ? (
          <>
            ✅ Logged in as: <b>{user.email}</b>
            <br /> (Ensure this account has Admin role in Firestore)
          </>
        ) : (
          <>❌ NOT LOGGED IN.</>
        )}
      </div>

      <p>
        This tool will update ALL existing articles to set <b>status: &quot;active&quot;</b>.
      </p>

      <button onClick={run} disabled={running || done || !user}>
        {done ? "Migration Complete" : running ? "Running..." : "Start Migration"}
      </button>

      <div className="migrate-logs">
        {logs.map((line, i) => (
          <div key={i} className={line.type}>
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}
