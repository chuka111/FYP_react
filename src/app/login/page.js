"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr]           = useState("");
  const [busy, setBusy]         = useState(false);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/dashboard");
    } catch (e) {
      setErr(e?.code === "auth/invalid-credential"
        ? "Incorrect email or password."
        : e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <style>{`
        .login-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--bg-base);
          overflow: hidden;
        }

        .login-left {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 48px;
          background: var(--bg-surface);
          border-right: 1px solid var(--border);
          overflow: hidden;
        }

        .login-left::before {
          content: '';
          position: absolute;
          top: -120px; left: -120px;
          width: 480px; height: 480px;
          background: radial-gradient(circle, rgba(108,99,255,0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        .login-grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .login-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.5px;
          position: relative;
          z-index: 1;
          opacity: 0;
          animation: fade-in 0.5s 0.1s cubic-bezier(0.16,1,0.3,1) forwards;
        }

        .login-brand-icon {
          width: 34px; height: 34px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--accent), #9b5de5);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }

        .login-hero {
          position: relative;
          z-index: 1;
          opacity: 0;
          animation: fade-in 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) forwards;
        }

        .login-hero-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: var(--accent);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .login-hero-label::before {
          content: '';
          display: inline-block;
          width: 20px; height: 1px;
          background: var(--accent);
        }

        .login-hero h1 {
          font-size: clamp(32px, 3.5vw, 44px);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -1.5px;
          color: var(--text-primary);
          margin-bottom: 16px;
        }

        .login-hero h1 span {
          background: linear-gradient(135deg, var(--accent) 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .login-hero p {
          font-size: 15px;
          color: var(--text-secondary);
          max-width: 340px;
          line-height: 1.7;
        }

        .login-stats {
          display: flex;
          gap: 32px;
          position: relative;
          z-index: 1;
          opacity: 0;
          animation: fade-in 0.6s 0.35s cubic-bezier(0.16,1,0.3,1) forwards;
        }

        .login-stat-num {
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.5px;
        }

        .login-stat-label {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .camera-widget {
          position: absolute;
          bottom: 40px; right: 40px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-lg);
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          opacity: 0;
          animation: slide-in-left 0.6s 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
        }

        .camera-icon {
          width: 36px; height: 36px;
          border-radius: 8px;
          background: var(--green-dim);
          border: 1px solid rgba(61,220,132,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          animation: float 3s ease-in-out infinite;
        }

        .camera-text-top {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .camera-text-sub {
          font-size: 11px;
          color: var(--text-secondary);
          font-family: 'JetBrains Mono', monospace;
          margin-top: 2px;
        }

        .login-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .login-form-wrap {
          width: 100%;
          max-width: 380px;
          opacity: 0;
          animation: scale-in 0.5s 0.2s cubic-bezier(0.16,1,0.3,1) forwards;
        }

        .login-form-title {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.8px;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        .login-form-sub {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 32px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 7px;
        }

        .form-input {
          width: 100%;
          background: var(--bg-elevated);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-md);
          padding: 13px 16px;
          font-size: 14px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'JetBrains Mono', monospace;
        }

        .form-input::placeholder {
          color: var(--text-muted);
        }

        .form-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-dim);
        }

        .form-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--red-dim);
          border: 1px solid rgba(255,95,109,0.25);
          border-radius: var(--radius-md);
          padding: 11px 14px;
          font-size: 13px;
          color: var(--red);
          margin-bottom: 16px;
          animation: scale-in 0.2s cubic-bezier(0.16,1,0.3,1);
        }

        .submit-btn {
          width: 100%;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: var(--radius-md);
          padding: 14px;
          font-size: 15px;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          cursor: pointer;
          margin-top: 8px;
          letter-spacing: 0.3px;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(108,99,255,0.35);
        }

        .submit-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(108,99,255,0.45);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0px);
        }

        .submit-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .btn-spinner {
          width: 16px; height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid #fff;
          animation: spin 0.7s linear infinite;
        }

        .login-divider {
          height: 1px;
          background: var(--border);
          margin: 28px 0;
        }

        .login-note {
          font-size: 12px;
          color: var(--text-muted);
          text-align: center;
          line-height: 1.6;
        }

        @media (max-width: 700px) {
          .login-root { grid-template-columns: 1fr; }
          .login-left { display: none; }
          .login-right { padding: 32px 24px; align-items: flex-start; padding-top: 80px; }
        }
      `}</style>

      <div className="login-root">
        <div className="login-left">
          <div className="login-grid-bg" />

          <div className="login-brand">
            Smart Punch In (FYP)
          </div>

          <div className="login-hero">
            <div className="login-hero-label">Attendance System</div>
            <h1>
              Check your work status live<br />
            </h1>
            <p>
              Real time facial recognition attendance.
              Clock in with just your face!
            </p>
          </div>

          <div>
            <div className="camera-widget">
              <div className="camera-icon">📷</div>
              <div>
                <div className="camera-text-top">Pi Camera Active</div>
                <div className="camera-text-sub">Recognition running</div>
              </div>
              <span className="live-dot" style={{ marginLeft: 8 }} />
            </div>
          </div>  
        </div>

        <div className="login-right">
          <div className="login-form-wrap">
            <div className="login-form-title">Welcome back</div>
            <div className="login-form-sub">Sign in to view your attendance</div>

            <form onSubmit={onSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  className="form-input"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  className="form-input"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {err && (
                <div className="form-error">
                  <span>ERROR!!!</span> {err}
                </div>
              )}

              <button className="submit-btn" type="submit" disabled={busy}>
                {busy ? <><div className="btn-spinner" /> Signing in…</> : "Sign in"}
              </button>
            </form>

            <div className="login-divider" />
            <div className="login-note">
              Don't have an account? Contact your admin.<br />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}