"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { apiGet, subscribeToEvents } from "@/lib/api";
import { SkeletonDashboard } from "@/components/LoadingSkeletons";

function formatUTC(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function elapsed(iso) {
  if (!iso) return "";
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m ago`;
}

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [employee, setEmployee]   = useState(null);
  const [status, setStatus]       = useState(null);
  const [history, setHistory]     = useState([]);
  const [hours, setHours]         = useState(null);
  const [dataReady, setDataReady] = useState(false);
  const [, setTick]               = useState(0);
  const cleanupRef                = useRef(null);
  const employeeRef               = useRef(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user]);

  async function fetchAll() {
    try {
      const [meData, statusData, histData, hoursData] = await Promise.all([
        apiGet("/me"),
        apiGet("/me/status"),
        apiGet("/me/history?limit=20"),
        apiGet("/me/hours"),
      ]);
      setEmployee(meData.employee);
      employeeRef.current = meData.employee;
      setStatus(statusData);
      setHistory(histData.entries || []);
      setHours(hoursData.hours);
      setDataReady(true);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }

  useEffect(() => {
    if (!user) return;
    fetchAll();
    user.getIdToken().then((token) => {
      cleanupRef.current = subscribeToEvents(token, (payload) => {
        const emp = employeeRef.current;
        if (payload.type === "clock_event" && emp && payload.employee_id === emp.id) {
          setStatus(payload.current);
          fetchAll();
        }
      });
    });
    return () => cleanupRef.current?.();
  }, [user]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (loading || !user || !dataReady) return <SkeletonDashboard />;

  const isIn = status?.status === "IN";
  const initials = (employee?.name || user.email || "?")[0].toUpperCase();

  return (
    <>
      <style>{`
        .dash-page {
          display: flex; min-height: 100vh; background: var(--bg-base);
        }
        .dash-sidebar {
          width: 220px; flex-shrink: 0;
          background: var(--bg-surface); border-right: 1px solid var(--border);
          display: flex; flex-direction: column; padding: 24px 0;
          position: sticky; top: 0; height: 100vh;
        }
        .dash-logo {
          display: flex; align-items: center; gap: 10px;
          padding: 0 20px 28px; font-size: 18px; font-weight: 800;
          letter-spacing: -0.5px; color: var(--text-primary);
        }
        .dash-logo-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: linear-gradient(135deg, var(--accent), #9b5de5);
          display: flex; align-items: center; justify-content: center; font-size: 16px;
        }
        .dash-nav { flex: 1; padding: 0 12px; display: flex; flex-direction: column; gap: 2px; }
        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: var(--radius-md);
          font-size: 14px; font-weight: 600; cursor: pointer;
          color: var(--text-secondary); transition: background .15s, color .15s;
          border: none; background: none; text-align: left; width: 100%; font-family: 'Syne', sans-serif;
        }
        .nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
        .nav-item.active { background: var(--accent-dim); color: #a5b4fc; }
        .nav-icon { font-size: 15px; width: 20px; text-align: center; }
        .dash-sidebar-bottom {
          padding: 16px; border-top: 1px solid var(--border); margin-top: 8px;
        }
        .user-chip {
          display: flex; align-items: center; gap: 10px;
          padding: 10px; border-radius: var(--radius-md);
          background: var(--bg-elevated); margin-bottom: 10px;
        }
        .user-avatar {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, var(--accent), #9b5de5);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800; color: #fff;
        }
        .user-name  { font-size: 13px; font-weight: 700; color: var(--text-primary); }
        .user-email {
          font-size: 11px; color: var(--text-secondary); margin-top: 1px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;
        }
        .logout-btn {
          width: 100%; background: transparent; border: 1px solid var(--border-strong);
          border-radius: var(--radius-md); padding: 8px; color: var(--text-secondary);
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: background .15s, color .15s; font-family: 'Syne', sans-serif;
        }
        .logout-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        .dash-main { flex: 1; overflow-y: auto; padding: 36px 44px; animation: fade-in .4s cubic-bezier(.16,1,.3,1); }
        .dash-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        .dash-title { font-size: 26px; font-weight: 800; letter-spacing: -.8px; color: var(--text-primary); margin-bottom: 4px; }
        .dash-subtitle { font-size: 13px; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace; }
        .live-badge {
          display: flex; align-items: center; gap: 8px;
          background: var(--green-dim); border: 1px solid rgba(61,220,132,.2);
          border-radius: 999px; padding: 7px 16px;
          font-size: 12px; font-weight: 700; color: var(--green); letter-spacing: .5px;
        }
        .dash-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 32px; }
        .stat-card {
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 22px 24px;
          position: relative; overflow: hidden;
          animation: scale-in .4s cubic-bezier(.16,1,.3,1) both;
          transition: border-color .2s;
        }
        .stat-card:hover { border-color: var(--border-strong); }
        .stat-card:nth-child(1) { animation-delay: 0ms; }
        .stat-card:nth-child(2) { animation-delay: 60ms; }
        .stat-card:nth-child(3) { animation-delay: 120ms; }
        .stat-label {
          font-size: 11px; font-weight: 700; color: var(--text-muted);
          letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px;
        }
        .stat-value { font-size: 32px; font-weight: 800; letter-spacing: -1px; margin-bottom: 6px; line-height: 1; }
        .stat-sub { font-size: 12px; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace; }
        .stat-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; }
        .section-title {
          font-size: 11px; font-weight: 700; color: var(--text-muted);
          letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px;
        }
        .table-wrap {
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: var(--radius-lg); overflow: hidden;
          animation: fade-in .4s .25s cubic-bezier(.16,1,.3,1) both;
        }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th {
          text-align: left; padding: 12px 18px; font-size: 11px; font-weight: 700;
          color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase;
          border-bottom: 1px solid var(--border); background: var(--bg-base);
        }
        .data-table td {
          padding: 12px 18px; font-size: 13px; color: var(--text-secondary);
          border-bottom: 1px solid rgba(255,255,255,.04);
          font-family: 'JetBrains Mono', monospace;
        }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tbody tr:hover td { background: var(--bg-elevated); transition: background .1s; }
        .empty-row td { text-align: center; color: var(--text-muted); padding: 36px; font-size: 14px; }
        .source-tag {
          font-size: 10px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase;
          padding: 2px 8px; border-radius: 4px; background: var(--bg-elevated); color: var(--text-muted);
        }
      `}</style>

      <div className="dash-page">
        <aside className="dash-sidebar">
          <div className="dash-logo">
            Smart Punch In
          </div>
          <nav className="dash-nav">
            <button className="nav-item active">
              <span className="nav-icon">⊞</span> Dashboard
            </button>
            {employee?.is_admin && (
              <button className="nav-item" onClick={() => router.push("/admin")}>
                <span className="nav-icon">◈</span> Admin
              </button>
            )}
          </nav>
          <div className="dash-sidebar-bottom">
            <div className="user-chip">
              <div className="user-avatar">{initials}</div>
              <div style={{ minWidth: 0 }}>
                <div className="user-name">{employee?.name || "Employee"}</div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>
            <button className="logout-btn" onClick={async () => { await logout(); router.replace("/login"); }}>
              Sign out
            </button>
          </div>
        </aside>

        <main className="dash-main">
          <header className="dash-header">
            <div>
              <div className="dash-title">My Attendance</div>
              <div className="dash-subtitle">
                {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </div>
            </div>
            <div className="live-badge">
              <span className="live-dot" /> Live
            </div>
          </header>

          <div className="dash-cards">
            <div className="stat-card">
              <div className="stat-label">Current Status</div>
              <div className="stat-value" style={{ color: isIn ? "var(--green)" : "var(--red)" }}>
                {isIn ? "IN" : "OUT"}
              </div>
              <div className="stat-sub">
                {status?.last_event ? `${formatUTC(status.last_event)} · ${elapsed(status.last_event)}` : "No events yet"}
              </div>
              <div className="stat-bar" style={{ background: `linear-gradient(90deg, transparent, ${isIn ? "var(--green)" : "var(--red)"})` }} />
            </div>

            <div className="stat-card">
              <div className="stat-label">Hours Today</div>
              <div className="stat-value" style={{ color: "yellow" }}>
                {hours !== null ? `${hours}H` : "—"}
              </div>
              <div className="stat-sub">{new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
              <div className="stat-bar" style={{ background: "linear-gradient(90deg, transparent, var(--accent))" }} />
            </div>

            <div className="stat-card">
              <div className="stat-label">Recent Events</div>
              <div className="stat-value" style={{ color: "blue" }}>{history.length}</div>
              <div className="stat-sub">last 20 entries</div>
              <div className="stat-bar" style={{ background: "linear-gradient(90deg, transparent, var(--amber))" }} />
            </div>
          </div>

          <div className="section-title">Recent Activity</div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time (UTC)</th><th>Status</th><th>Source</th><th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 && (
                  <tr className="empty-row"><td colSpan={4}>No entries yet</td></tr>
                )}
                {history.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatUTC(entry.ts_utc)}</td>
                    <td><span className={entry.status === "IN" ? "badge-in" : "badge-out"}>{entry.status}</span></td>
                    <td><span className="source-tag">{entry.source}</span></td>
                    <td>{entry.confidence != null ? `${(entry.confidence * 100).toFixed(1)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </>
  );
}