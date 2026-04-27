"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmtDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function isToday(dateStr) {
  return dateStr === new Date().toISOString().slice(0, 10);
}

function isTomorrow(dateStr) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dateStr === tomorrow.toISOString().slice(0, 10);
}

function dayLabel(dateStr) {
  if (isToday(dateStr)) return "Today";
  if (isTomorrow(dateStr)) return "Tomorrow";
  return fmtDate(dateStr);
}

export default function RosterPanel() {
  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/me/roster")
      .then(data => setRoster(data.roster || []))
      .catch(err => console.error("Roster fetch:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <style>{`
        .roster-panel { margin-top: 24px; }
        .roster-panel-title {
          font-size: 16px; font-weight: 700; color: #94a3b8;
          margin-bottom: 14px; font-family: 'Syne', sans-serif;
        }
        .roster-panel-wrap {
          background: #111118; border: 1px solid #ffffff0d;
          border-radius: 12px; overflow: hidden;
        }
        .roster-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 13px 18px; border-bottom: 1px solid #ffffff06;
          transition: background .15s;
        }
        .roster-row:last-child { border-bottom: none; }
        .roster-row:hover { background: #ffffff04; }
        .roster-row.today { background: #818cf808; border-left: 3px solid #818cf8; }
        .roster-day { font-size: 13px; font-weight: 600; color: #e2e8f0; min-width: 110px; }
        .roster-day.muted { color: #64748b; font-weight: 400; }
        .roster-shift {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: #94a3b8;
        }
        .roster-shift-name {
          font-weight: 700; padding: 2px 10px; border-radius: 999px;
          font-size: 11px; letter-spacing: .3px;
        }
        .roster-time { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #64748b; }
        .roster-empty {
          padding: 24px; text-align: center;
          color: #4a5568; font-size: 13px;
        }
        .roster-loading { padding: 24px; text-align: center; color: #4a5568; font-size: 13px; }
        .no-shift { font-size: 12px; color: #4a5568; font-style: italic; }
      `}</style>

      <div className="roster-panel">
        <h2 className="roster-panel-title">My Schedule — Next 14 Days</h2>
        <div className="roster-panel-wrap">
          {loading && <div className="roster-loading">Loading schedule…</div>}

          {!loading && roster?.length === 0 && (
            <div className="roster-empty">No shifts scheduled yet.</div>
          )}

          {!loading && roster?.length > 0 && (() => {
            // Build full 14-day list
            const today = new Date();
            const days = Array.from({ length: 14 }, (_, i) => {
              const d = new Date(today);
              d.setDate(today.getDate() + i);
              return d.toISOString().slice(0, 10);
            });

            const rosterMap = {};
            roster.forEach(r => { rosterMap[r.date] = r; });

            return days.map(date => {
              const entry = rosterMap[date];
              const todayRow = isToday(date);
              return (
                <div key={date} className={`roster-row ${todayRow ? "today" : ""}`}>
                  <div className={`roster-day ${!todayRow ? "muted" : ""}`}>
                    {dayLabel(date)}
                  </div>
                  {entry ? (
                    <div className="roster-shift">
                      <span
                        className="roster-shift-name"
                        style={{ background: "#818cf820", color: "#818cf8", border: "1px solid #818cf840" }}
                      >
                        {entry.shift_name}
                      </span>
                      <span className="roster-time">
                        {entry.start_time} – {entry.end_time}
                      </span>
                    </div>
                  ) : (
                    <span className="no-shift">No shift assigned</span>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>
    </>
  );
}