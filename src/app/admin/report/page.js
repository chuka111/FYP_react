"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";

function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso.replace("+00:00", "Z")).toLocaleTimeString(undefined, {
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendanceReportPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [report, setReport]       = useState(null);
  const [date, setDate]           = useState(todayISO());
  const [fetching, setFetching]   = useState(false);
  const [filterFlag, setFilterFlag] = useState("ALL");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user]);

  async function fetchReport(d) {
    setFetching(true);
    try {
      const data = await apiGet(`/admin/attendance-report?target_date=${d}`);
      setReport(data);
    } catch (err) {
      if (err.message.includes("403")) router.replace("/dashboard");
      console.error(err);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (user) fetchReport(date);
  }, [user, date]);

  if (loading || !user) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #ffffff10", borderTop: "3px solid #818cf8", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const rows = report?.report || [];
  const filtered = rows.filter(r => {
    if (filterFlag === "ALL")       return true;
    if (filterFlag === "OK")        return r.on_time;
    if (filterFlag === "LATE")      return r.flags.includes("late_in");
    if (filterFlag === "EARLY_OUT") return r.flags.includes("early_out");
    if (filterFlag === "NO_SHOW")   return r.flags.includes("no_show");
    return true;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg-base: #0a0a0f; --bg-surface: #111118; --bg-elevated: #1a1a24;
          --bg-hover: #ffffff08; --border: #ffffff0d; --border-strong: #ffffff18;
          --text-primary: #e8eaf0; --text-secondary: #8892a4; --text-muted: #4a5568;
          --accent: #818cf8; --accent-dim: #818cf815; --accent-border: #818cf830;
          --green: #3ddc84; --green-dim: #3ddc8415;
          --red: #ff5f6d; --red-dim: #ff5f6d15;
          --amber: #fbbf24; --amber-dim: #fbbf2415;
          --radius-sm: 6px; --radius-md: 10px; --radius-lg: 14px;
        }
        @keyframes fade-in  { from{opacity:0} to{opacity:1} }
        @keyframes scale-in { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
        @keyframes spin     { to{transform:rotate(360deg)} }

        .report-page { display:flex; min-height:100vh; background:var(--bg-base); font-family:'DM Sans',sans-serif; color:var(--text-primary); }

        .sidebar { width:220px; flex-shrink:0; background:var(--bg-surface); border-right:1px solid var(--border); display:flex; flex-direction:column; padding:24px 0; position:sticky; top:0; height:100vh; }
        .logo { display:flex; align-items:center; gap:10px; padding:0 20px 28px; font-size:18px; font-weight:800; letter-spacing:-.5px; color:var(--text-primary); font-family:'Syne',sans-serif; }
        .logo-icon { width:32px; height:32px; border-radius:8px; background:linear-gradient(135deg,var(--accent),#9b5de5); display:flex; align-items:center; justify-content:center; font-size:16px; }
        .nav { flex:1; padding:0 12px; display:flex; flex-direction:column; gap:2px; }
        .nav-item { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:var(--radius-md); font-size:14px; font-weight:600; cursor:pointer; color:var(--text-secondary); border:none; background:none; text-align:left; width:100%; font-family:'Syne',sans-serif; transition:background .15s,color .15s; }
        .nav-item:hover { background:var(--bg-hover); color:var(--text-primary); }
        .nav-item.active { background:var(--accent-dim); color:#a5b4fc; }
        .sidebar-bottom { padding:16px; border-top:1px solid var(--border); margin-top:8px; }
        .logout-btn { width:100%; background:transparent; border:1px solid var(--border-strong); border-radius:var(--radius-md); padding:8px; color:var(--text-secondary); font-size:13px; font-weight:600; cursor:pointer; font-family:'Syne',sans-serif; }

        .main { flex:1; overflow-y:auto; padding:36px 44px; animation:fade-in .4s ease; }
        .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; flex-wrap:wrap; gap:12px; }
        .page-title { font-size:26px; font-weight:800; letter-spacing:-.8px; font-family:'Syne',sans-serif; margin-bottom:4px; }
        .page-subtitle { font-size:13px; color:var(--text-secondary); font-family:'JetBrains Mono',monospace; }

        .date-input { background:var(--bg-surface); border:1px solid var(--border-strong); border-radius:var(--radius-md); padding:9px 14px; color:var(--text-primary); font-size:13px; font-family:'JetBrains Mono',monospace; outline:none; cursor:pointer; }
        .date-input:focus { border-color:var(--accent); }

        /* summary strip */
        .summary-strip { display:flex; gap:12px; margin-bottom:24px; flex-wrap:wrap; }
        .summary-card { flex:1; min-width:120px; background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-lg); padding:18px 20px; animation:scale-in .3s ease both; }
        .summary-num { font-size:28px; font-weight:800; letter-spacing:-1px; font-family:'Syne',sans-serif; }
        .summary-lbl { font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-top:4px; }

        /* filters */
        .filter-row { display:flex; align-items:center; gap:8px; margin-bottom:16px; flex-wrap:wrap; }
        .filter-btn { background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-sm); padding:7px 14px; color:var(--text-secondary); font-size:12px; font-weight:700; cursor:pointer; letter-spacing:.5px; font-family:'Syne',sans-serif; transition:all .15s; }
        .filter-btn:hover { background:var(--bg-hover); color:var(--text-primary); }
        .filter-btn.active { background:var(--accent-dim); border-color:var(--accent-border); color:#a5b4fc; }

        /* table */
        .table-wrap { background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-lg); overflow:hidden; }
        .report-table { width:100%; border-collapse:collapse; }
        .report-table th { text-align:left; padding:12px 16px; font-size:11px; font-weight:700; color:var(--text-muted); letter-spacing:1px; text-transform:uppercase; border-bottom:1px solid var(--border); background:var(--bg-base); }
        .report-table td { padding:13px 16px; font-size:13px; color:var(--text-secondary); border-bottom:1px solid rgba(255,255,255,.04); }
        .report-table tr:last-child td { border-bottom:none; }
        .report-table tbody tr:hover td { background:var(--bg-elevated); }
        .emp-name { font-weight:700; color:var(--text-primary); font-size:13px; }
        .shift-chip { display:inline-block; background:var(--accent-dim); color:var(--accent); border:1px solid var(--accent-border); border-radius:999px; padding:2px 10px; font-size:11px; font-weight:700; }
        .time-val { font-family:'JetBrains Mono',monospace; font-size:12px; }

        /* flag badges */
        .flag-list { display:flex; flex-wrap:wrap; gap:4px; }
        .flag { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:999px; font-size:11px; font-weight:700; letter-spacing:.3px; }
        .flag-ok        { background:var(--green-dim); color:var(--green); border:1px solid rgba(61,220,132,.25); }
        .flag-late      { background:var(--amber-dim); color:var(--amber); border:1px solid rgba(251,191,36,.25); }
        .flag-early     { background:var(--amber-dim); color:var(--amber); border:1px solid rgba(251,191,36,.25); }
        .flag-noshow    { background:var(--red-dim);   color:var(--red);   border:1px solid rgba(255,95,109,.25); }
        .flag-noclkout  { background:var(--red-dim);   color:var(--red);   border:1px solid rgba(255,95,109,.25); }

        .empty { padding:48px; text-align:center; color:var(--text-muted); font-size:14px; }
        .loading-row td { text-align:center; padding:32px; color:var(--text-muted); }

        @media (max-width:768px) {
          .sidebar { display:none; }
          .main { padding:20px 16px; }
          .summary-strip { gap:8px; }
          .summary-card { padding:14px; }
          .report-table th, .report-table td { padding:10px 10px; }
        }
      `}</style>

      <div className="report-page">

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-icon">◉</div>
            PunchIn
          </div>
          <nav className="nav">
            <button className="nav-item" onClick={() => router.push("/dashboard")}>
              <span>⊞</span> Dashboard
            </button>
            <button className="nav-item" onClick={() => router.push("/admin")}>
              <span>◈</span> Admin
            </button>
            <button className="nav-item" onClick={() => router.push("/admin/roster")}>
              <span>▦</span> Roster
            </button>
            <button className="nav-item active">
              <span>◎</span> Report
            </button>
          </nav>
          <div className="sidebar-bottom">
            <button className="logout-btn" onClick={async () => { await logout(); router.replace("/login"); }}>
              Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          <div className="page-header">
            <div>
              <div className="page-title">Attendance Report</div>
              <div className="page-subtitle">{report ? fmtDate(date) : "Loading…"}</div>
            </div>
            <input
              className="date-input"
              type="date"
              value={date}
              max={todayISO()}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          {/* Summary strip */}
          {report && (
            <div className="summary-strip">
              {[
                { label: "Scheduled", value: report.total_scheduled, color: "var(--accent)" },
                { label: "On Time",   value: report.on_time,         color: "var(--green)"  },
                { label: "Late In",   value: report.late,            color: "var(--amber)"  },
                { label: "Left Early",value: report.early_out,       color: "var(--amber)"  },
                { label: "No Show",   value: report.no_show,         color: "var(--red)"    },
              ].map(({ label, value, color }, i) => (
                <div className="summary-card" key={label} style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="summary-num" style={{ color }}>{value}</div>
                  <div className="summary-lbl">{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="filter-row">
            {[
              { key: "ALL",       label: "All" },
              { key: "OK",        label: "On Time" },
              { key: "LATE",      label: "Late In" },
              { key: "EARLY_OUT", label: "Left Early" },
              { key: "NO_SHOW",   label: "No Show" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`filter-btn ${filterFlag === key ? "active" : ""}`}
                onClick={() => setFilterFlag(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Shift</th>
                  <th>Scheduled</th>
                  <th>Clocked In</th>
                  <th>Clocked Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {fetching && (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Loading…</td></tr>
                )}

                {!fetching && filtered.length === 0 && (
                  <tr><td colSpan={7} className="empty">
                    {rows.length === 0
                      ? "No shifts scheduled for this date."
                      : "No employees match this filter."}
                  </td></tr>
                )}

                {!fetching && filtered.map(row => (
                  <tr key={row.employee_id}>
                    <td><div className="emp-name">{row.employee_name}</div></td>
                    <td><span className="shift-chip">{row.shift_name}</span></td>
                    <td>
                      <span className="time-val">
                        {row.shift_start} – {row.shift_end}
                      </span>
                    </td>
                    <td>
                      <span className="time-val" style={{ color: row.flags.includes("late_in") ? "var(--amber)" : "var(--text-secondary)" }}>
                        {fmtTime(row.clocked_in)}
                        {row.late_by_mins && (
                          <span style={{ fontSize: 11, marginLeft: 4, color: "var(--amber)" }}>
                            +{row.late_by_mins}m
                          </span>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className="time-val" style={{ color: row.flags.includes("early_out") ? "var(--amber)" : "var(--text-secondary)" }}>
                        {fmtTime(row.clocked_out)}
                        {row.early_by_mins && (
                          <span style={{ fontSize: 11, marginLeft: 4, color: "var(--amber)" }}>
                            -{row.early_by_mins}m
                          </span>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className="time-val">{row.hours_worked ?? 0}h</span>
                    </td>
                    <td>
                      <div className="flag-list">
                        {row.flags.length === 0 && (
                          <span className="flag flag-ok">✓ On time</span>
                        )}
                        {row.flags.includes("no_show") && (
                          <span className="flag flag-noshow">✗ No show</span>
                        )}
                        {row.flags.includes("late_in") && (
                          <span className="flag flag-late">⚠ Late in</span>
                        )}
                        {row.flags.includes("early_out") && (
                          <span className="flag flag-early">⚠ Left early</span>
                        )}
                        {row.flags.includes("no_clock_out") && (
                          <span className="flag flag-noclkout">⚠ No clock out</span>
                        )}
                      </div>
                    </td>
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