"use client";


export function PageLoader() {
  return (
    <>
      <style>{`
        .page-loader {
          position: fixed;
          inset: 0;
          background: var(--bg-base);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          z-index: 9999;
          animation: fade-in-fast 0.2s ease both;
        }

        .page-loader-logo {
          font-size: 28px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -1px;
          display: flex;
          align-items: center;
          gap: 10px;
          opacity: 0;
          animation: fade-in 0.4s 0.1s cubic-bezier(0.16,1,0.3,1) forwards;
        }

        .page-loader-icon {
          width: 36px; height: 36px;
          border-radius: 9px;
          background: linear-gradient(135deg, var(--accent), #9b5de5);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }

        .page-loader-ring {
          width: 40px; height: 40px;
          border-radius: 50%;
          border: 2.5px solid var(--border-strong);
          border-top: 2.5px solid var(--accent);
          animation: spin 0.75s linear infinite;
          opacity: 0;
          animation: spin 0.75s linear infinite, fade-in 0.4s 0.2s ease forwards;
        }

        .page-loader-text {
          font-size: 13px;
          color: var(--text-secondary);
          font-family: 'JetBrains Mono', monospace;
          opacity: 0;
          animation: fade-in 0.4s 0.3s ease forwards;
        }
      `}</style>
      <div className="page-loader">
        <div className="page-loader-logo">
          <div className="page-loader-icon">◉</div>
          PunchIn
        </div>
        <div className="page-loader-ring" />
        <div className="page-loader-text">Loading…</div>
      </div>
    </>
  );
}


export function SkeletonDashboard() {
  return (
    <>
      <style>{`
        .skeleton-layout {
          display: flex;
          min-height: 100vh;
          background: var(--bg-base);
        }

        .skeleton-sidebar {
          width: 220px;
          flex-shrink: 0;
          background: var(--bg-surface);
          border-right: 1px solid var(--border);
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-main {
          flex: 1;
          padding: 32px 40px;
        }

        .skeleton-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .skeleton-cards {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .skeleton-table-row {
          height: 44px;
          margin-bottom: 8px;
        }

        .sk { background: var(--bg-elevated); border-radius: var(--radius-sm); }
        .sk-animate {
          background: linear-gradient(
            90deg,
            var(--bg-elevated) 0px,
            var(--bg-hover) 200px,
            var(--bg-elevated) 400px
          );
          background-size: 600px;
          animation: shimmer 1.4s ease-in-out infinite;
          border-radius: var(--radius-sm);
        }
      `}</style>

      <div className="skeleton-layout">
        <div className="skeleton-sidebar">
          <div className="sk-animate" style={{ height: 28, width: 120, marginBottom: 20 }} />
          {[80, 100, 90].map((w, i) => (
            <div key={i} className="sk-animate" style={{ height: 36, width: `${w}%`, borderRadius: 8 }} />
          ))}
        </div>

        <div className="skeleton-main">
          <div className="skeleton-header">
            <div>
              <div className="sk-animate" style={{ height: 28, width: 220, marginBottom: 8 }} />
              <div className="sk-animate" style={{ height: 14, width: 160 }} />
            </div>
            <div className="sk-animate" style={{ height: 34, width: 80, borderRadius: 999 }} />
          </div>

          <div className="skeleton-cards">
            {[0, 1, 2].map((i) => (
              <div key={i} className="sk" style={{ height: 120, borderRadius: 12, padding: 20 }}>
                <div className="sk-animate" style={{ height: 12, width: 80, marginBottom: 12 }} />
                <div className="sk-animate" style={{ height: 32, width: 100, marginBottom: 8 }} />
                <div className="sk-animate" style={{ height: 10, width: 140 }} />
              </div>
            ))}
          </div>

          <div className="sk" style={{ borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div className="sk-animate" style={{ height: 14, width: 140 }} />
            </div>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-table-row sk-animate" style={{ margin: '0 16px 1px', borderRadius: 4 }} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function SkeletonAdmin() {
  return (
    <>
      <div className="skeleton-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <div className="skeleton-sidebar" style={{
          width: 220, flexShrink: 0, background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)', padding: '24px 16px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div className="sk-animate" style={{ height: 28, width: 120, marginBottom: 20, borderRadius: 6 }} />
          {[80, 100, 90].map((w, i) => (
            <div key={i} className="sk-animate" style={{ height: 36, width: `${w}%`, borderRadius: 8 }} />
          ))}
        </div>

        <div style={{ flex: 1, padding: '32px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div className="sk-animate" style={{ height: 28, width: 200, marginBottom: 8, borderRadius: 6 }} />
              <div className="sk-animate" style={{ height: 14, width: 150, borderRadius: 4 }} />
            </div>
            <div className="sk-animate" style={{ height: 34, width: 80, borderRadius: 999 }} />
          </div>

          <div className="sk-animate" style={{ height: 80, borderRadius: 12, marginBottom: 20 }} />
          <div className="sk-animate" style={{ height: 44, borderRadius: 8, marginBottom: 20 }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 14 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="sk-animate" style={{ height: 200, borderRadius: 12 }} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}