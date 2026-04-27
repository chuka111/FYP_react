"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
// ─── helpers ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function mondayOf(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmtDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    month: "short", day: "numeric",
  });
}


export default function RosterPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [roster, setRoster]           = useState(null);
  const [shifts, setShifts]           = useState([]);
  const [weekStart, setWeekStart]     = useState(mondayOf());
  const [assigning, setAssigning]     = useState(null); // { employee_id, date }
  const [selectedShift, setSelectedShift] = useState("");
  const [saving, setSaving]           = useState(false);

  // shift creation modal
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftName, setShiftName]     = useState("");
  const [shiftStart, setShiftStart]   = useState("09:00");
  const [shiftEnd, setShiftEnd]       = useState("17:00");
  const [shiftSaving, setShiftSaving] = useState(false);
  const [shiftError, setShiftError]   = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user]);

  async function fetchRoster() {
    try {
      const data = await apiGet(`/admin/roster?week=${weekStart}`);
      setRoster(data);
      setShifts(data.shifts || []);
    } catch (err) {
      if (err.message.includes("403")) router.replace("/dashboard");
      console.error(err);
    }
  }

  useEffect(() => {
    if (user) fetchRoster();
  }, [user, weekStart]);

  function prevWeek() { setWeekStart(addDays(weekStart, -7)); }
  function nextWeek() { setWeekStart(addDays(weekStart, 7)); }

  function openAssign(employee_id, date, currentShiftId) {
    setAssigning({ employee_id, date });
    setSelectedShift(currentShiftId ? String(currentShiftId) : "");
  }

  async function saveAssignment() {
    if (!assigning) return;
    setSaving(true);
    try {
        if (selectedShift === "clear") {
        const row = roster.rows.find(r => r.employee_id === assigning.employee_id);
        const entry = row?.days[assigning.date];
        if (entry) {
            await apiDelete(`/admin/roster/${entry.id}`);
        }
      } else if (selectedShift) {
        await apiPost("/admin/roster", {
          employee_id: assigning.employee_id,
          shift_id: parseInt(selectedShift),
          date: assigning.date,
        });
      }
      setAssigning(null);
      await fetchRoster();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function createShift() {
    if (!shiftName.trim() || !shiftStart || !shiftEnd) {
      setShiftError("All fields are required.");
      return;
    }
    setShiftSaving(true);
    setShiftError("");
    try {
      await apiPost("/admin/shifts", {
        name: shiftName.trim(),
        start_time: shiftStart,
        end_time: shiftEnd,
      });
      setShiftName("");
      setShiftStart("09:00");
      setShiftEnd("17:00");
      setShowShiftModal(false);
      await fetchRoster();
    } catch (err) {
      setShiftError(err.message || "Failed to create shift.");
    } finally {
      setShiftSaving(false);
    }
  }

  if (loading || !user || !roster) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #ffffff10", borderTop: "3px solid #818cf8", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const days = roster.days || [];

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
        @keyframes slide-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin     { to{transform:rotate(360deg)} }

        .roster-page { display:flex; min-height:100vh; background:var(--bg-base); font-family:'DM Sans',sans-serif; color:var(--text-primary); }

        /* sidebar */
        .sidebar { width:220px; flex-shrink:0; background:var(--bg-surface); border-right:1px solid var(--border); display:flex; flex-direction:column; padding:24px 0; position:sticky; top:0; height:100vh; }
        .logo { display:flex; align-items:center; gap:10px; padding:0 20px 28px; font-size:18px; font-weight:800; letter-spacing:-.5px; color:var(--text-primary); font-family:'Syne',sans-serif; }
        .logo-icon { width:32px; height:32px; border-radius:8px; background:linear-gradient(135deg,var(--accent),#9b5de5); display:flex; align-items:center; justify-content:center; font-size:16px; }
        .nav { flex:1; padding:0 12px; display:flex; flex-direction:column; gap:2px; }
        .nav-item { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:var(--radius-md); font-size:14px; font-weight:600; cursor:pointer; color:var(--text-secondary); border:none; background:none; text-align:left; width:100%; font-family:'Syne',sans-serif; transition:background .15s,color .15s; }
        .nav-item:hover { background:var(--bg-hover); color:var(--text-primary); }
        .nav-item.active { background:var(--accent-dim); color:#a5b4fc; }
        .sidebar-bottom { padding:16px; border-top:1px solid var(--border); margin-top:8px; }
        .logout-btn { width:100%; background:transparent; border:1px solid var(--border-strong); border-radius:var(--radius-md); padding:8px; color:var(--text-secondary); font-size:13px; font-weight:600; cursor:pointer; font-family:'Syne',sans-serif; }

        /* main */
        .main { flex:1; overflow-x:auto; padding:36px 44px; animation:fade-in .4s ease; }
        .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; flex-wrap:wrap; gap:12px; }
        .page-title { font-size:26px; font-weight:800; letter-spacing:-.8px; font-family:'Syne',sans-serif; margin-bottom:4px; }
        .page-subtitle { font-size:13px; color:var(--text-secondary); font-family:'JetBrains Mono',monospace; }
        .header-actions { display:flex; gap:10px; align-items:center; }

        /* week nav */
        .week-nav { display:flex; align-items:center; gap:10px; background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-md); padding:6px 10px; }
        .week-btn { background:none; border:none; color:var(--text-secondary); font-size:18px; cursor:pointer; width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:6px; transition:background .15s; }
        .week-btn:hover { background:var(--bg-hover); color:var(--text-primary); }
        .week-label { font-size:13px; font-weight:700; color:var(--text-primary); font-family:'JetBrains Mono',monospace; white-space:nowrap; }

        .add-shift-btn { background:var(--accent); border:none; border-radius:var(--radius-md); padding:9px 16px; color:#fff; font-size:13px; font-weight:700; cursor:pointer; font-family:'Syne',sans-serif; transition:opacity .15s; }
        .add-shift-btn:hover { opacity:.88; }

        /* shifts legend */
        .shifts-legend { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px; }
        .shift-chip { display:flex; align-items:center; gap:6px; background:var(--bg-surface); border:1px solid var(--border); border-radius:999px; padding:4px 12px; font-size:12px; font-weight:600; color:var(--text-secondary); }
        .shift-dot { width:8px; height:8px; border-radius:50%; }

        /* roster grid */
        .roster-wrap { background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-lg); overflow:hidden; min-width:700px; }
        .roster-grid { width:100%; border-collapse:collapse; }
        .roster-grid th { padding:12px 14px; font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid var(--border); background:var(--bg-base); text-align:center; }
        .roster-grid th.name-col { text-align:left; width:160px; }
        .roster-grid td { padding:10px 8px; border-bottom:1px solid var(--border); border-right:1px solid var(--border); vertical-align:middle; text-align:center; }
        .roster-grid td.name-cell { text-align:left; padding:10px 14px; font-weight:600; font-size:13px; color:var(--text-primary); }
        .roster-grid tr:last-child td { border-bottom:none; }
        .roster-grid td:last-child { border-right:none; }
        .roster-grid tr:hover td { background:var(--bg-hover); }

        .shift-badge { display:inline-block; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; transition:opacity .15s; letter-spacing:.3px; }
        .shift-badge:hover { opacity:.8; }
        .empty-cell { width:100%; height:32px; border:1px dashed var(--border-strong); border-radius:6px; cursor:pointer; transition:background .15s; display:flex; align-items:center; justify-content:center; font-size:18px; color:var(--text-muted); }
        .empty-cell:hover { background:var(--bg-hover); color:var(--accent); border-color:var(--accent-border); }
        .today-col { background:#818cf808 !important; }

        /* assign popover */
        .popover-overlay { position:fixed; inset:0; z-index:40; }
        .popover { position:fixed; background:var(--bg-surface); border:1px solid var(--border-strong); border-radius:var(--radius-lg); padding:16px; width:240px; z-index:50; box-shadow:0 12px 40px rgba(0,0,0,.5); animation:slide-up .2s ease; }
        .popover-title { font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:.8px; margin-bottom:10px; }
        .shift-option { display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:var(--radius-sm); cursor:pointer; font-size:13px; color:var(--text-secondary); transition:background .15s; border:none; background:none; width:100%; text-align:left; font-family:'DM Sans',sans-serif; }
        .shift-option:hover { background:var(--bg-hover); color:var(--text-primary); }
        .shift-option.selected { background:var(--accent-dim); color:#a5b4fc; }
        .clear-option { color:var(--red) !important; }
        .clear-option:hover { background:var(--red-dim) !important; }
        .popover-actions { display:flex; gap:8px; margin-top:12px; border-top:1px solid var(--border); padding-top:12px; }
        .pop-cancel { flex:1; background:transparent; border:1px solid var(--border-strong); border-radius:var(--radius-sm); padding:7px; color:var(--text-secondary); font-size:12px; font-weight:600; cursor:pointer; font-family:'Syne',sans-serif; }
        .pop-save { flex:2; background:var(--accent); border:none; border-radius:var(--radius-sm); padding:7px; color:#fff; font-size:12px; font-weight:700; cursor:pointer; font-family:'Syne',sans-serif; transition:opacity .15s; }
        .pop-save:disabled { opacity:.5; cursor:not-allowed; }

        /* shift creation modal */
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.65); z-index:60; display:flex; align-items:center; justify-content:center; animation:fade-in .2s ease; }
        .modal { background:var(--bg-surface); border:1px solid var(--border-strong); border-radius:18px; padding:28px; width:380px; max-width:90vw; box-shadow:0 24px 64px rgba(0,0,0,.6); animation:slide-up .3s ease; }
        .modal-title { font-size:18px; font-weight:800; color:var(--text-primary); margin-bottom:6px; font-family:'Syne',sans-serif; }
        .modal-subtitle { font-size:13px; color:var(--text-secondary); margin-bottom:20px; }
        .field-group { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
        .field-label { font-size:11px; font-weight:700; color:var(--text-secondary); letter-spacing:.8px; text-transform:uppercase; }
        .field-input { background:var(--bg-base); border:1px solid var(--border-strong); border-radius:var(--radius-md); padding:10px 14px; color:var(--text-primary); font-size:14px; outline:none; font-family:'JetBrains Mono',monospace; transition:border-color .2s; width:100%; }
        .field-input:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-dim); }
        .time-row { display:flex; gap:10px; }
        .time-row .field-group { flex:1; }
        .modal-error { background:var(--red-dim); border:1px solid rgba(255,95,109,.25); border-radius:var(--radius-sm); padding:8px 12px; color:var(--red); font-size:12px; margin-bottom:12px; }
        .modal-actions { display:flex; gap:10px; margin-top:4px; }
        .modal-cancel { flex:1; background:transparent; border:1px solid var(--border-strong); border-radius:var(--radius-md); padding:10px; color:var(--text-secondary); font-size:13px; font-weight:600; cursor:pointer; font-family:'Syne',sans-serif; }
        .modal-confirm { flex:2; background:var(--accent); border:none; border-radius:var(--radius-md); padding:10px; color:#fff; font-size:13px; font-weight:700; cursor:pointer; font-family:'Syne',sans-serif; transition:opacity .15s; }
        .modal-confirm:disabled { opacity:.5; cursor:not-allowed; }

        .empty-roster { padding:48px; text-align:center; color:var(--text-muted); font-size:14px; }
      `}</style>

      <div className="roster-page">

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
            <button className="nav-item active">
              <span>▦</span> Roster
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
              <div className="page-title">Weekly Roster</div>
              <div className="page-subtitle">
                {fmtDate(weekStart)} — {fmtDate(addDays(weekStart, 6))}
              </div>
            </div>
            <div className="header-actions">
              {/* Week navigation */}
              <div className="week-nav">
                <button className="week-btn" onClick={prevWeek}>‹</button>
                <span className="week-label">
                  {fmtDate(weekStart)} – {fmtDate(addDays(weekStart, 6))}
                </span>
                <button className="week-btn" onClick={nextWeek}>›</button>
              </div>
              <button className="add-shift-btn" onClick={() => { setShiftError(""); setShowShiftModal(true); }}>
                + New Shift
              </button>
            </div>
          </div>

          {/* Shift legend */}
          {shifts.length > 0 && (
            <div className="shifts-legend">
              {shifts.map((s, i) => (
                <div className="shift-chip" key={s.id}>
                  <div className="shift-dot" style={{ background: shiftColor(i).bg }} />
                  {s.name} · {s.start_time}–{s.end_time}
                </div>
              ))}
            </div>
          )}

          {/* Grid */}
          <div className="roster-wrap">
            {roster.rows.length === 0 ? (
              <div className="empty-roster">
                No employees yet. Add employees via the Admin page first.
              </div>
            ) : (
              <table className="roster-grid">
                <thead>
                  <tr>
                    <th className="name-col">Employee</th>
                    {days.map((d, i) => {
                      const isToday = d === new Date().toISOString().slice(0, 10);
                      return (
                        <th key={d} style={isToday ? { color: "var(--accent)" } : {}}>
                          <div>{DAY_NAMES[i]}</div>
                          <div style={{ fontWeight: 400, fontSize: 10 }}>{fmtDate(d)}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {roster.rows.map((row) => (
                    <tr key={row.employee_id}>
                      <td className="name-cell">{row.name}</td>
                      {days.map((d, i) => {
                        const entry = row.days[d];
                        const isToday = d === new Date().toISOString().slice(0, 10);
                        const shiftIdx = entry ? shifts.findIndex(s => s.id === entry.shift_id) : -1;
                        const color = shiftIdx >= 0 ? shiftColor(shiftIdx) : null;
                        return (
                          <td key={d} className={isToday ? "today-col" : ""}>
                            {entry ? (
                              <span
                                className="shift-badge"
                                style={{ background: color.dim, color: color.bg, border: `1px solid ${color.border}` }}
                                onClick={(e) => { e.stopPropagation(); openAssign(row.employee_id, d, entry.shift_id); }}
                                title={`${entry.shift_name} ${entry.start_time}–${entry.end_time}`}
                              >
                                {entry.shift_name}
                              </span>
                            ) : (
                              <div
                                className="empty-cell"
                                onClick={(e) => { e.stopPropagation(); openAssign(row.employee_id, d, null); }}
                              >
                                +
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* Assign popup */}
      {assigning && (
        <>
          <div className="popover-overlay" onClick={() => setAssigning(null)} />
          <div className="popover" style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
            <div className="popover-title">Assign Shift</div>
            {shifts.length === 0 && (
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>
                No shifts yet — create one first.
              </div>
            )}
            {shifts.map((s, i) => {
              const color = shiftColor(i);
              return (
                <button
                  key={s.id}
                  className={`shift-option ${selectedShift === String(s.id) ? "selected" : ""}`}
                  onClick={() => setSelectedShift(String(s.id))}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: color.bg, flexShrink: 0 }} />
                  {s.name} · {s.start_time}–{s.end_time}
                </button>
              );
            })}
            {assigning && roster.rows.find(r => r.employee_id === assigning.employee_id)?.days[assigning.date] && (
              <button className="shift-option clear-option" onClick={() => setSelectedShift("clear")}>
                ✕ Clear shift
              </button>
            )}
            <div className="popover-actions">
              <button className="pop-cancel" onClick={() => setAssigning(null)}>Cancel</button>
              <button
                className="pop-save"
                disabled={saving || (!selectedShift)}
                onClick={saveAssignment}
              >
                {saving ? "…" : "Save"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create shift modal */}
      {showShiftModal && (
        <div className="modal-overlay" onClick={() => setShowShiftModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">New Shift</div>
            <div className="modal-subtitle">Define a shift template to use in the roster.</div>

            {shiftError && <div className="modal-error">{shiftError}</div>}

            <div className="field-group">
              <label className="field-label">Shift Name</label>
              <input
                className="field-input"
                placeholder="e.g. Morning, Evening, Night"
                value={shiftName}
                onChange={e => setShiftName(e.target.value)}
                disabled={shiftSaving}
              />
            </div>

            <div className="time-row">
              <div className="field-group">
                <label className="field-label">Start Time</label>
                <input
                  className="field-input"
                  type="time"
                  value={shiftStart}
                  onChange={e => setShiftStart(e.target.value)}
                  disabled={shiftSaving}
                />
              </div>
              <div className="field-group">
                <label className="field-label">End Time</label>
                <input
                  className="field-input"
                  type="time"
                  value={shiftEnd}
                  onChange={e => setShiftEnd(e.target.value)}
                  disabled={shiftSaving}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowShiftModal(false)} disabled={shiftSaving}>Cancel</button>
              <button
                className="modal-confirm"
                disabled={shiftSaving || !shiftName.trim()}
                onClick={createShift}
              >
                {shiftSaving ? "Saving…" : "Create Shift"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function shiftColor(index) {
  const palette = [
    { bg: "#818cf8", dim: "#818cf815", border: "#818cf840" },
    { bg: "#3ddc84", dim: "#3ddc8415", border: "#3ddc8440" },
    { bg: "#fbbf24", dim: "#fbbf2415", border: "#fbbf2440" },
    { bg: "#f472b6", dim: "#f472b615", border: "#f472b640" },
    { bg: "#38bdf8", dim: "#38bdf815", border: "#38bdf840" },
    { bg: "#fb923c", dim: "#fb923c15", border: "#fb923c40" },
  ];
  return palette[index % palette.length];
}