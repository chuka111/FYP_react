"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, subscribeToEvents } from "@/lib/api";
import { SkeletonAdmin } from "@/components/LoadingSkeletons";

function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function elapsed(iso) {
  if (!iso) return "never";
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
}

export default function AdminPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [summary, setSummary]       = useState(null);
  const [dataReady, setDataReady]   = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empHistory, setEmpHistory] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [, setTick] = useState(0);
  const cleanupRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user]);

  async function fetchSummary() {
    try {
      const data = await apiGet("/admin/summary");
      setSummary(data);
      setDataReady(true);
    } catch (err) {
      if (err.message.includes("403")) router.replace("/dashboard");
      console.error(err);
    }
  }

  useEffect(() => {
    if (!user) return;
    fetchSummary();
    user.getIdToken().then((token) => {
      cleanupRef.current = subscribeToEvents(token, (payload) => {
        if (payload.type === "clock_event") {
          setSummary((prev) => {
            if (!prev) return prev;
            const updated = prev.employees.map((e) =>
              e.id === payload.employee_id
                ? { ...e, status: payload.current.status, last_event: payload.current.last_event }
                : e
            );
            return {
              ...prev,
              employees: updated,
              currently_in: updated.filter((e) => e.status === "IN").length,
              currently_out: updated.filter((e) => e.status !== "IN").length,
            };
          });
        }
      });
    });
    return () => cleanupRef.current?.();
  }, [user]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  async function openDrawer(emp) {
    setSelectedEmp(emp);
    setDrawerOpen(true);
    setEmpHistory([]);
    try {
      const data = await apiGet(`/admin/employees/${emp.id}/history?limit=50`);
      setEmpHistory(data.entries || []);
    } catch (err) { console.error(err); }
  }

  async function manualToggle(e, empId) {
    e.stopPropagation();
    setTogglingId(empId);
    try {
      await apiPost(`/admin/employees/${empId}/clock`);
    } catch (err) { console.error(err); }
    finally { setTogglingId(null); }
  }

  if (loading || !user || !dataReady) return <SkeletonAdmin />;

  const employees = summary?.employees || [];
  const filtered = employees.filter((e) => {
    const matchSearch = !search ||
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <style>{`
        .admin-page { display: flex; min-height: 100vh; background: var(--bg-base); }

        .admin-sidebar {
          width: 220px; flex-shrink: 0; background: var(--bg-surface);
          border-right: 1px solid var(--border); display: flex; flex-direction: column;
          padding: 24px 0; position: sticky; top: 0; height: 100vh;
        }
        .admin-logo {
          display: flex; align-items: center; gap: 10px;
          padding: 0 20px 28px; font-size: 18px; font-weight: 800;
          letter-spacing: -.5px; color: var(--text-primary);
        }
        .admin-logo-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: linear-gradient(135deg, var(--accent), #9b5de5);
          display: flex; align-items: center; justify-content: center; font-size: 16px;
        }
        .admin-nav { flex: 1; padding: 0 12px; display: flex; flex-direction: column; gap: 2px; }
        .nav-item {
          display: flex; align-items: center; gap: 10px; padding: 9px 12px;
          border-radius: var(--radius-md); font-size: 14px; font-weight: 600;
          cursor: pointer; color: var(--text-secondary); transition: background .15s, color .15s;
          border: none; background: none; text-align: left; width: 100%; font-family: 'Syne', sans-serif;
        }
        .nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
        .nav-item.active { background: var(--accent-dim); color: #a5b4fc; }
        .nav-icon { font-size: 15px; width: 20px; text-align: center; }
        .admin-sidebar-bottom { padding: 16px; border-top: 1px solid var(--border); margin-top: 8px; }
        .logout-btn {
          width: 100%; background: transparent; border: 1px solid var(--border-strong);
          border-radius: var(--radius-md); padding: 8px; color: var(--text-secondary);
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: background .15s; font-family: 'Syne', sans-serif;
        }
        .logout-btn:hover { background: var(--bg-hover); color: var(--text-primary); }

        .admin-main { flex: 1; overflow-y: auto; padding: 36px 44px; animation: fade-in .4s cubic-bezier(.16,1,.3,1); }
        .admin-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
        .admin-title { font-size: 26px; font-weight: 800; letter-spacing: -.8px; color: var(--text-primary); margin-bottom: 4px; }
        .admin-subtitle { font-size: 13px; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace; }
        .live-badge {
          display: flex; align-items: center; gap: 8px;
          background: var(--green-dim); border: 1px solid rgba(61,220,132,.2);
          border-radius: 999px; padding: 7px 16px;
          font-size: 12px; font-weight: 700; color: var(--green); letter-spacing: .5px;
        }

        .stat-strip {
          display: flex; align-items: center; gap: 0;
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: var(--radius-lg); margin-bottom: 20px; overflow: hidden;
          animation: scale-in .4s cubic-bezier(.16,1,.3,1);
        }
        .stat-item {
          flex: 1; padding: 20px 24px; text-align: center;
          border-right: 1px solid var(--border);
        }
        .stat-item:last-child { border-right: none; }
        .stat-num { font-size: 28px; font-weight: 800; letter-spacing: -1px; }
        .stat-lbl {
          font-size: 11px; font-weight: 700; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;
        }

        .filter-row { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .search-input {
          flex: 1; background: var(--bg-surface); border: 1px solid var(--border-strong);
          border-radius: var(--radius-md); padding: 10px 14px;
          color: var(--text-primary); font-size: 13px; outline: none;
          font-family: 'JetBrains Mono', monospace; transition: border-color .2s;
        }
        .search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-dim); }
        .search-input::placeholder { color: var(--text-muted); }
        .filter-btns { display: flex; gap: 6px; }
        .filter-btn {
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: var(--radius-sm); padding: 8px 14px;
          color: var(--text-secondary); font-size: 12px; font-weight: 700;
          cursor: pointer; letter-spacing: .5px; font-family: 'Syne', sans-serif;
          transition: all .15s;
        }
        .filter-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        .filter-btn.active {
          background: var(--accent-dim); border-color: var(--accent-border); color: #a5b4fc;
        }

        .emp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 14px;
        }
        .emp-card {
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: var(--radius-lg); overflow: hidden;
          cursor: pointer; transition: border-color .2s, transform .15s;
          animation: scale-in .35s cubic-bezier(.16,1,.3,1) both;
        }
        .emp-card:hover { border-color: var(--border-strong); transform: translateY(-2px); }
        .emp-card-strip { height: 3px; }
        .emp-card-body { padding: 16px 18px; }
        .emp-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .emp-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          background: var(--accent-dim); border: 1px solid var(--accent-border);
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 800; color: var(--accent);
        }
        .emp-name { font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
        .emp-email { font-size: 11px; color: var(--text-secondary); margin-bottom: 8px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'JetBrains Mono', monospace; }
        .admin-tag {
          display: inline-block; font-size: 10px; font-weight: 700;
          background: var(--accent-dim); color: var(--accent);
          border-radius: 4px; padding: 2px 7px; letter-spacing: .5px;
          border: 1px solid var(--accent-border); margin-bottom: 8px;
        }
        .emp-meta {
          display: flex; justify-content: space-between;
          font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;
          font-family: 'JetBrains Mono', monospace;
        }
        .toggle-btn {
          width: 100%; border: none; border-radius: var(--radius-sm);
          padding: 8px 0; font-size: 12px; font-weight: 700;
          cursor: pointer; margin-top: 10px; transition: opacity .15s;
          letter-spacing: .5px; font-family: 'Syne', sans-serif;
        }
        .toggle-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .empty-grid { grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 48px; font-size: 14px; }

        .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 40; animation: fade-in-fast .2s ease; }
        .drawer {
          position: fixed; top: 0; right: 0; bottom: 0; width: 380px;
          background: var(--bg-surface); border-left: 1px solid var(--border-strong);
          z-index: 50; overflow-y: auto; display: flex; flex-direction: column;
          animation: slide-in-right .3s cubic-bezier(.16,1,.3,1);
        }
        .drawer-header {
          display: flex; align-items: center; gap: 12px;
          padding: 24px 20px; border-bottom: 1px solid var(--border);
        }
        .drawer-avatar {
          width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
          background: var(--accent-dim); border: 1px solid var(--accent-border);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 800; color: var(--accent);
        }
        .drawer-name { font-size: 16px; font-weight: 800; color: var(--text-primary); }
        .drawer-email { font-size: 12px; color: var(--text-secondary); margin-top: 2px; font-family: 'JetBrains Mono', monospace; }
        .drawer-close {
          margin-left: auto; background: none; border: none;
          color: var(--text-secondary); font-size: 18px; cursor: pointer;
          width: 32px; height: 32px; border-radius: 6px; display: flex;
          align-items: center; justify-content: center;
          transition: background .15s;
        }
        .drawer-close:hover { background: var(--bg-hover); }
        .drawer-status { padding: 20px; border-bottom: 1px solid var(--border); }
        .drawer-big-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 16px; border-radius: var(--radius-md);
          font-size: 14px; font-weight: 800; border: 1px solid; margin-bottom: 10px;
        }
        .drawer-meta { font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; font-family: 'JetBrains Mono', monospace; }
        .drawer-section-title {
          font-size: 11px; font-weight: 700; color: var(--text-muted);
          letter-spacing: 1.5px; text-transform: uppercase;
          padding: 16px 20px 10px;
        }
        .hist-list { padding: 0 20px 24px; }
        .hist-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 14px; }
        .hist-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
        .hist-status { font-size: 13px; color: var(--text-primary); font-weight: 700; }
        .hist-meta { font-size: 12px; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
      `}</style>

      <div className="admin-page">
        <aside className="admin-sidebar">
          <div className="admin-logo">
            Smart Punch In
          </div>
          <nav className="admin-nav">
            <button className="nav-item" onClick={() => router.push("/dashboard")}>
              <span className="nav-icon">⊞</span> Dashboard
            </button>
            <button className="nav-item active">
              <span className="nav-icon">◈</span> Admin
            </button>
          </nav>
          <div className="admin-sidebar-bottom">
            <button className="logout-btn" onClick={async () => { await logout(); router.replace("/login"); }}>
              Sign out
            </button>
          </div>
        </aside>

        <main className="admin-main">
          <header className="admin-header">
            <div>
              <div className="admin-title">Admin Overview</div>
              <div className="admin-subtitle">
                {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </div>
            </div>
            <div className="live-badge"><span className="live-dot" /> Live</div>
          </header>

          <div className="stat-strip">
            {[
              { label: "Total", value: summary?.total_employees ?? "—", color: "var(--accent)" },
              { label: "In Office", value: summary?.currently_in ?? "—", color: "var(--green)" },
              { label: "Out", value: summary?.currently_out ?? "—", color: "var(--red)" },
              {
                label: "Rate",
                value: summary ? `${Math.round((summary.currently_in / Math.max(summary.total_employees, 1)) * 100)}%` : "—",
                color: "var(--amber)",
              },
            ].map(({ label, value, color }) => (
              <div className="stat-item" key={label}>
                <div className="stat-num" style={{ color }}>{value}</div>
                <div className="stat-lbl">{label}</div>
              </div>
            ))}
          </div>

          <div className="filter-row">
            <input
              className="search-input"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="filter-btns">
              {["ALL", "IN", "OUT"].map((f) => (
                <button
                  key={f}
                  className={`filter-btn ${filterStatus === f ? "active" : ""}`}
                  onClick={() => setFilterStatus(f)}
                >{f}</button>
              ))}
            </div>
          </div>

          <div className="emp-grid">
            {filtered.map((emp, i) => {
              const isIn = emp.status === "IN";
              return (
                <div
                  key={emp.id}
                  className="emp-card"
                  style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                  onClick={() => openDrawer(emp)}
                >
                  <div className="emp-card-strip" style={{ background: isIn ? "var(--green)" : "var(--bg-elevated)" }} />
                  <div className="emp-card-body">
                    <div className="emp-top">
                      <div className="emp-avatar">{(emp.name || emp.email || "?")?.[0]?.toUpperCase()}</div>
                      <span className={isIn ? "badge-in" : "badge-out"}>{isIn ? "IN" : "OUT"}</span>
                    </div>
                    <div className="emp-name">{emp.name || "Unnamed"}</div>
                    <div className="emp-email">{emp.email || "—"}</div>
                    {emp.is_admin ? <div className="admin-tag">Admin</div> : null}
                    <div className="emp-meta">
                      <span>{isIn ? "In for" : "Last seen"}</span>
                      <span style={{ color: "var(--text-primary)" }}>{elapsed(emp.last_event)}</span>
                    </div>
                    <div className="emp-meta">
                      <span>Today</span>
                      <span style={{ color: "var(--accent)" }}>{emp.hours_today ?? 0}h</span>
                    </div>
                    <button
                      className="toggle-btn"
                      style={{
                        background: isIn ? "var(--red-dim)" : "var(--green-dim)",
                        color: isIn ? "var(--red)" : "var(--green)",
                        border: `1px solid ${isIn ? "rgba(255,95,109,.25)" : "rgba(61,220,132,.25)"}`,
                      }}
                      disabled={togglingId === emp.id}
                      onClick={(e) => manualToggle(e, emp.id)}
                    >
                      {togglingId === emp.id ? "…" : isIn ? "Clock Out" : "Clock In"}
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="empty-grid">No employees match your filter.</div>}
          </div>
        </main>
      </div>

      {drawerOpen && selectedEmp && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <aside className="drawer">
            <div className="drawer-header">
              <div className="drawer-avatar">{(selectedEmp.name || selectedEmp.email || "?")?.[0]?.toUpperCase()}</div>
              <div>
                <div className="drawer-name">{selectedEmp.name || "Unnamed"}</div>
                <div className="drawer-email">{selectedEmp.email || "No email"}</div>
              </div>
              <button className="drawer-close" onClick={() => setDrawerOpen(false)}>✕</button>
            </div>

            <div className="drawer-status">
              {(() => {
                const isIn = selectedEmp.status === "IN";
                return (
                  <>
                    <div
                      className="drawer-big-badge"
                      style={{
                        background: isIn ? "var(--green-dim)" : "var(--red-dim)",
                        color: isIn ? "var(--green)" : "var(--red)",
                        borderColor: isIn ? "rgba(61,220,132,.3)" : "rgba(255,95,109,.3)",
                      }}
                    >
                      {isIn ? "CLOCKED IN" : "CLOCKED OUT"}
                    </div>
                    <div className="drawer-meta">Last event: {fmtDateTime(selectedEmp.last_event)}</div>
                    <div className="drawer-meta">Today: {selectedEmp.hours_today ?? 0} hours</div>
                  </>
                );
              })()}
            </div>

            <div className="drawer-section-title">Recent Activity</div>
            <div className="hist-list">
              {empHistory.length === 0 && (
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading…</div>
              )}
              {empHistory.map((entry) => (
                <div key={entry.id} className="hist-row">
                  <div className="hist-dot" style={{ background: entry.status === "IN" ? "var(--green)" : "var(--red)" }} />
                  <div>
                    <div className="hist-status" style={{ color: entry.status === "IN" ? "var(--green)" : "var(--red)" }}>
                      {entry.status} <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>via {entry.source}</span>
                    </div>
                    <div className="hist-meta">
                      {fmtDateTime(entry.ts_utc)}
                      {entry.confidence != null && ` · ${(entry.confidence * 100).toFixed(1)}% conf`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </>
      )}
    </>
  );
}