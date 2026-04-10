"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, subscribeToEvents } from "@/lib/api";

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

  const [summary, setSummary]           = useState(null);
  const [dataReady, setDataReady]       = useState(false);
  const [selectedEmp, setSelectedEmp]   = useState(null);
  const [empHistory, setEmpHistory]     = useState([]);
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [togglingId, setTogglingId]     = useState(null);
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [, setTick]                     = useState(0);
  const cleanupRef                      = useRef(null);

  //registration modal states for employee registration
  const [showAddModal, setShowAddModal]           = useState(false);
  const [unlinkedEmployees, setUnlinkedEmployees] = useState([]);
  const [selectedName, setSelectedName]           = useState("");
  const [newEmail, setNewEmail]                   = useState("");
  const [adding, setAdding]                       = useState(false);
  const [addError, setAddError]                   = useState("");
  const [addSuccess, setAddSuccess]               = useState("");

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

  // registration for employees
  async function openAddModal() {
    setSelectedName("");
    setNewEmail("");
    setAddError("");
    setAddSuccess("");
    setShowAddModal(true);
    try {
      const data = await apiGet("/admin/employees/unlinked");
      setUnlinkedEmployees(data.employees || []);
    } catch (err) { console.error(err); }
  }

  function closeAddModal() {
    if (adding) return;
    setShowAddModal(false);
    setAddError("");
    setAddSuccess("");
  }

  async function linkEmployee() {
    if (!selectedName || !newEmail.trim()) {
      setAddError("Please select an employee and enter an email.");
      return;
    }
    setAdding(true);
    setAddError("");
    setAddSuccess("");
    try {
      await apiPost("/admin/employees/link", {
        name: selectedName,
        email: newEmail.trim(),
      });
      setAddSuccess(`Invite sent to ${newEmail.trim()}`);
      setSelectedName("");
      setNewEmail("");
      await fetchSummary();
    } catch (err) {
      setAddError(err.message || "Failed to link employee.");
    } finally {
      setAdding(false);
    }
  }

  if (loading || !user || !dataReady) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #ffffff10", borderTop: "3px solid #818cf8", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

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
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg-base:        #0a0a0f;
          --bg-surface:     #111118;
          --bg-elevated:    #1a1a24;
          --bg-hover:       #ffffff08;
          --border:         #ffffff0d;
          --border-strong:  #ffffff18;
          --text-primary:   #e8eaf0;
          --text-secondary: #8892a4;
          --text-muted:     #4a5568;
          --accent:         #818cf8;
          --accent-dim:     #818cf815;
          --accent-border:  #818cf830;
          --green:          #3ddc84;
          --green-dim:      #3ddc8415;
          --red:            #ff5f6d;
          --red-dim:        #ff5f6d15;
          --amber:          #fbbf24;
          --radius-sm:      6px;
          --radius-md:      10px;
          --radius-lg:      14px;
        }
        @keyframes fade-in        { from { opacity:0 } to { opacity:1 } }
        @keyframes fade-in-fast   { from { opacity:0 } to { opacity:1 } }
        @keyframes scale-in       { from { opacity:0; transform:scale(.97) } to { opacity:1; transform:scale(1) } }
        @keyframes slide-in-right { from { transform:translateX(100%) } to { transform:translateX(0) } }
        @keyframes slide-up       { from { opacity:0; transform:translateY(16px) scale(.97) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes spin           { to { transform:rotate(360deg) } }
        @keyframes pulse          { 0%,100%{opacity:1} 50%{opacity:.35} }

        .live-dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:var(--green); box-shadow:0 0 6px var(--green); animation:pulse 2s infinite; }
        .badge-in  { background:var(--green-dim); color:var(--green); border:1px solid rgba(61,220,132,.25); font-size:11px; font-weight:700; padding:2px 10px; border-radius:999px; letter-spacing:.5px; }
        .badge-out { background:var(--red-dim);   color:var(--red);   border:1px solid rgba(255,95,109,.25); font-size:11px; font-weight:700; padding:2px 10px; border-radius:999px; letter-spacing:.5px; }

        .admin-page { display:flex; min-height:100vh; background:var(--bg-base); font-family:'DM Sans',sans-serif; color:var(--text-primary); }

        .admin-sidebar { width:220px; flex-shrink:0; background:var(--bg-surface); border-right:1px solid var(--border); display:flex; flex-direction:column; padding:24px 0; position:sticky; top:0; height:100vh; }
        .admin-logo { display:flex; align-items:center; gap:10px; padding:0 20px 28px; font-size:18px; font-weight:800; letter-spacing:-.5px; color:var(--text-primary); font-family:'Syne',sans-serif; }
        .admin-logo-icon { width:32px; height:32px; border-radius:8px; background:linear-gradient(135deg,var(--accent),#9b5de5); display:flex; align-items:center; justify-content:center; font-size:16px; }
        .admin-nav { flex:1; padding:0 12px; display:flex; flex-direction:column; gap:2px; }
        .nav-item { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:var(--radius-md); font-size:14px; font-weight:600; cursor:pointer; color:var(--text-secondary); transition:background .15s,color .15s; border:none; background:none; text-align:left; width:100%; font-family:'Syne',sans-serif; }
        .nav-item:hover { background:var(--bg-hover); color:var(--text-primary); }
        .nav-item.active { background:var(--accent-dim); color:#a5b4fc; }
        .nav-icon { font-size:15px; width:20px; text-align:center; }
        .admin-sidebar-bottom { padding:16px; border-top:1px solid var(--border); margin-top:8px; }
        .logout-btn { width:100%; background:transparent; border:1px solid var(--border-strong); border-radius:var(--radius-md); padding:8px; color:var(--text-secondary); font-size:13px; font-weight:600; cursor:pointer; font-family:'Syne',sans-serif; transition:background .15s; }
        .logout-btn:hover { background:var(--bg-hover); color:var(--text-primary); }

        .admin-main { flex:1; overflow-y:auto; padding:36px 44px; animation:fade-in .4s cubic-bezier(.16,1,.3,1); }
        .admin-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
        .admin-title { font-size:26px; font-weight:800; letter-spacing:-.8px; color:var(--text-primary); margin-bottom:4px; font-family:'Syne',sans-serif; }
        .admin-subtitle { font-size:13px; color:var(--text-secondary); font-family:'JetBrains Mono',monospace; }
        .live-badge { display:flex; align-items:center; gap:8px; background:var(--green-dim); border:1px solid rgba(61,220,132,.2); border-radius:999px; padding:7px 16px; font-size:12px; font-weight:700; color:var(--green); letter-spacing:.5px; font-family:'Syne',sans-serif; }

        .stat-strip { display:flex; align-items:center; background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-lg); margin-bottom:20px; overflow:hidden; animation:scale-in .4s cubic-bezier(.16,1,.3,1); }
        .stat-item { flex:1; padding:20px 24px; text-align:center; border-right:1px solid var(--border); }
        .stat-item:last-child { border-right:none; }
        .stat-num { font-size:28px; font-weight:800; letter-spacing:-1px; font-family:'Syne',sans-serif; }
        .stat-lbl { font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-top:4px; }

        .filter-row { display:flex; align-items:center; gap:10px; margin-bottom:20px; }
        .search-input { flex:1; background:var(--bg-surface); border:1px solid var(--border-strong); border-radius:var(--radius-md); padding:10px 14px; color:var(--text-primary); font-size:13px; outline:none; font-family:'JetBrains Mono',monospace; transition:border-color .2s; }
        .search-input:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-dim); }
        .search-input::placeholder { color:var(--text-muted); }
        .filter-btns { display:flex; gap:6px; }
        .filter-btn { background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-sm); padding:8px 14px; color:var(--text-secondary); font-size:12px; font-weight:700; cursor:pointer; letter-spacing:.5px; font-family:'Syne',sans-serif; transition:all .15s; }
        .filter-btn:hover { background:var(--bg-hover); color:var(--text-primary); }
        .filter-btn.active { background:var(--accent-dim); border-color:var(--accent-border); color:#a5b4fc; }

        .add-emp-btn { display:flex; align-items:center; gap:6px; background:var(--accent); border:none; border-radius:var(--radius-md); padding:10px 18px; color:#fff; font-size:13px; font-weight:700; cursor:pointer; white-space:nowrap; font-family:'Syne',sans-serif; transition:opacity .15s,transform .15s; letter-spacing:.3px; }
        .add-emp-btn:hover { opacity:.88; transform:translateY(-1px); }

        .emp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:14px; }
        .emp-card { background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-lg); overflow:hidden; cursor:pointer; transition:border-color .2s,transform .15s; animation:scale-in .35s cubic-bezier(.16,1,.3,1) both; }
        .emp-card:hover { border-color:var(--border-strong); transform:translateY(-2px); }
        .emp-card-strip { height:3px; }
        .emp-card-body { padding:16px 18px; }
        .emp-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
        .emp-avatar { width:38px; height:38px; border-radius:50%; background:var(--accent-dim); border:1px solid var(--accent-border); display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:800; color:var(--accent); }
        .emp-name { font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:2px; font-family:'Syne',sans-serif; }
        .emp-email { font-size:11px; color:var(--text-secondary); margin-bottom:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-family:'JetBrains Mono',monospace; }
        .admin-tag { display:inline-block; font-size:10px; font-weight:700; background:var(--accent-dim); color:var(--accent); border-radius:4px; padding:2px 7px; letter-spacing:.5px; border:1px solid var(--accent-border); margin-bottom:8px; }
        .emp-meta { display:flex; justify-content:space-between; font-size:12px; color:var(--text-secondary); margin-bottom:4px; font-family:'JetBrains Mono',monospace; }
        .toggle-btn { width:100%; border-radius:var(--radius-sm); padding:8px 0; font-size:12px; font-weight:700; cursor:pointer; margin-top:10px; transition:opacity .15s; letter-spacing:.5px; font-family:'Syne',sans-serif; }
        .toggle-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .empty-grid { grid-column:1/-1; text-align:center; color:var(--text-muted); padding:48px; font-size:14px; }

        .drawer-overlay { position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:40; animation:fade-in-fast .2s ease; }
        .drawer { position:fixed; top:0; right:0; bottom:0; width:380px; background:var(--bg-surface); border-left:1px solid var(--border-strong); z-index:50; overflow-y:auto; display:flex; flex-direction:column; animation:slide-in-right .3s cubic-bezier(.16,1,.3,1); }
        .drawer-header { display:flex; align-items:center; gap:12px; padding:24px 20px; border-bottom:1px solid var(--border); }
        .drawer-avatar { width:44px; height:44px; border-radius:50%; flex-shrink:0; background:var(--accent-dim); border:1px solid var(--accent-border); display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:800; color:var(--accent); }
        .drawer-name { font-size:16px; font-weight:800; color:var(--text-primary); font-family:'Syne',sans-serif; }
        .drawer-email { font-size:12px; color:var(--text-secondary); margin-top:2px; font-family:'JetBrains Mono',monospace; }
        .drawer-close { margin-left:auto; background:none; border:none; color:var(--text-secondary); font-size:18px; cursor:pointer; width:32px; height:32px; border-radius:6px; display:flex; align-items:center; justify-content:center; transition:background .15s; }
        .drawer-close:hover { background:var(--bg-hover); }
        .drawer-status { padding:20px; border-bottom:1px solid var(--border); }
        .drawer-big-badge { display:inline-flex; align-items:center; gap:8px; padding:10px 16px; border-radius:var(--radius-md); font-size:14px; font-weight:800; border:1px solid; margin-bottom:10px; font-family:'Syne',sans-serif; }
        .drawer-meta { font-size:13px; color:var(--text-secondary); margin-bottom:4px; font-family:'JetBrains Mono',monospace; }
        .drawer-section-title { font-size:11px; font-weight:700; color:var(--text-muted); letter-spacing:1.5px; text-transform:uppercase; padding:16px 20px 10px; }
        .hist-list { padding:0 20px 24px; }
        .hist-row { display:flex; align-items:flex-start; gap:10px; margin-bottom:14px; }
        .hist-dot { width:8px; height:8px; border-radius:50%; margin-top:5px; flex-shrink:0; }
        .hist-status { font-size:13px; color:var(--text-primary); font-weight:700; font-family:'Syne',sans-serif; }
        .hist-meta { font-size:12px; color:var(--text-secondary); font-family:'JetBrains Mono',monospace; margin-top:2px; }

        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.65); z-index:60; animation:fade-in-fast .2s ease; display:flex; align-items:center; justify-content:center; }
        .modal { background:var(--bg-surface); border:1px solid var(--border-strong); border-radius:18px; padding:32px; width:420px; max-width:90vw; animation:slide-up .3s cubic-bezier(.16,1,.3,1); box-shadow:0 24px 64px rgba(0,0,0,.6); }
        .modal-title { font-size:20px; font-weight:800; color:var(--text-primary); margin-bottom:6px; font-family:'Syne',sans-serif; }
        .modal-subtitle { font-size:13px; color:var(--text-secondary); margin-bottom:24px; line-height:1.6; }
        .field-group { display:flex; flex-direction:column; gap:6px; margin-bottom:16px; }
        .field-label { font-size:11px; font-weight:700; color:var(--text-secondary); letter-spacing:.8px; text-transform:uppercase; }
        .field-input { background:var(--bg-base); border:1px solid var(--border-strong); border-radius:var(--radius-md); padding:11px 14px; color:var(--text-primary); font-size:14px; outline:none; font-family:'JetBrains Mono',monospace; transition:border-color .2s; width:100%; }
        .field-input:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-dim); }
        .field-input::placeholder { color:var(--text-muted); }
        .field-input:disabled { opacity:.5; cursor:not-allowed; }
        .modal-error { background:var(--red-dim); border:1px solid rgba(255,95,109,.25); border-radius:var(--radius-sm); padding:10px 14px; color:var(--red); font-size:13px; margin-bottom:16px; }
        .modal-success { background:var(--green-dim); border:1px solid rgba(61,220,132,.25); border-radius:var(--radius-sm); padding:10px 14px; color:var(--green); font-size:13px; margin-bottom:16px; display:flex; align-items:center; gap:8px; font-weight:600; }
        .modal-actions { display:flex; gap:10px; margin-top:8px; }
        .modal-cancel { flex:1; background:transparent; border:1px solid var(--border-strong); border-radius:var(--radius-md); padding:11px; color:var(--text-secondary); font-size:13px; font-weight:600; cursor:pointer; font-family:'Syne',sans-serif; transition:background .15s; }
        .modal-cancel:hover { background:var(--bg-hover); color:var(--text-primary); }
        .modal-confirm { flex:2; background:var(--accent); border:none; border-radius:var(--radius-md); padding:11px; color:#fff; font-size:13px; font-weight:700; cursor:pointer; font-family:'Syne',sans-serif; transition:opacity .15s,transform .15s; }
        .modal-confirm:hover:not(:disabled) { opacity:.88; transform:translateY(-1px); }
        .modal-confirm:disabled { opacity:0.5; cursor:not-allowed; }
      `}</style>

      <div className="admin-page">

        {/*Sidebar*/}
        <aside className="admin-sidebar">
          <div className="admin-logo">
            <div className="admin-logo-icon">◉</div>
            PunchIn
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

        {/*Main*/}
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

          {/*Dashboard status */}
          <div className="stat-strip">
            {[
              { label: "Total",     value: summary?.total_employees ?? "—", color: "var(--accent)" },
              { label: "In Office", value: summary?.currently_in ?? "—",    color: "var(--green)"  },
              { label: "Out",       value: summary?.currently_out ?? "—",   color: "var(--red)"    },
              { label: "Rate", color: "var(--amber)",
                value: summary
                  ? `${Math.round((summary.currently_in / Math.max(summary.total_employees, 1)) * 100)}%`
                  : "—" },
            ].map(({ label, value, color }) => (
              <div className="stat-item" key={label}>
                <div className="stat-num" style={{ color }}>{value}</div>
                <div className="stat-lbl">{label}</div>
              </div>
            ))}
          </div>

          {/*Filters and add button*/}
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
            <button className="add-emp-btn" onClick={openAddModal}>
              + Link Employee
            </button>
          </div>

          {/*Employee grid*/}
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
                        background: isIn ? "var(--red-dim)"   : "var(--green-dim)",
                        color:      isIn ? "var(--red)"       : "var(--green)",
                        border:     `1px solid ${isIn ? "rgba(255,95,109,.25)" : "rgba(61,220,132,.25)"}`,
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
            {filtered.length === 0 && (
              <div className="empty-grid">No employees match your filter.</div>
            )}
          </div>
        </main>
      </div>

      {/*Employee detail*/}
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
                        background:  isIn ? "var(--green-dim)" : "var(--red-dim)",
                        color:       isIn ? "var(--green)"     : "var(--red)",
                        borderColor: isIn ? "rgba(61,220,132,.3)" : "rgba(255,95,109,.3)",
                      }}
                    >
                      {isIn ? "● CLOCKED IN" : "○ CLOCKED OUT"}
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
                      {entry.status}{" "}
                      <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>via {entry.source}</span>
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

      {/*Link employee modal*/}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Link Employee Account</div>
            <div className="modal-subtitle">
              Select an employee to add their email, and send them a login invite.
            </div>

            {addSuccess && (
              <div className="modal-success">
                <span>✓</span> {addSuccess}
              </div>
            )}

            {addError && (
              <div className="modal-error">{addError}</div>
            )}

            {!addSuccess && (
              <>
                <div className="field-group">
                  <label className="field-label">Employee</label>
                  {unlinkedEmployees.length === 0 ? (
                    <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "10px 0" }}>
                      All employees already have an email linked.
                    </div>
                  ) : (
                    <select
                      className="field-input"
                      value={selectedName}
                      onChange={(e) => setSelectedName(e.target.value)}
                      disabled={adding}
                    >
                      <option value="">Select an employee…</option>
                      {unlinkedEmployees.map((e) => (
                        <option key={e.id} value={e.name}>{e.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="field-group">
                  <label className="field-label">Email Address</label>
                  <input
                    className="field-input"
                    type="email"
                    placeholder="e.g. chuka@atu.ie"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    disabled={adding || unlinkedEmployees.length === 0}
                  />
                </div>
              </>
            )}

            <div className="modal-actions">
              <button className="modal-cancel" onClick={closeAddModal} disabled={adding}>
                {addSuccess ? "Close" : "Cancel"}
              </button>
              {!addSuccess && (
                <button
                  className="modal-confirm"
                  disabled={adding || !selectedName || !newEmail.trim() || unlinkedEmployees.length === 0}
                  onClick={linkEmployee}
                >
                  {adding ? "Sending invite…" : "Link & Send Invite"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}