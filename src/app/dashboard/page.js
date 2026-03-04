"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const API_BASE = "http://192.168.1.69:8000"; 

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user]);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      const token = await user.getIdToken();

      // Fetch current status
      const statusRes = await fetch(`${API_BASE}/me/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statusData = await statusRes.json();
      setStatus(statusData);

      // Fetch history
      const historyRes = await fetch(`${API_BASE}/me/history?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const historyData = await historyRes.json();
      setHistory(historyData.entries || []);
    }

    fetchData();

    // Poll every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <main style={{ padding: 20 }}>
      <h1>Dashboard</h1>

      <p>Signed in as {user.email}</p>

      <h2>Current Status</h2>
      <p>
        {status ? (
          <>
            <b>{status.status}</b>
            <br />
            Last event: {status.last_event || "None"}
          </>
        ) : (
          "Loading..."
        )}
      </p>

      <h2>Recent History</h2>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Time (UTC)</th>
            <th>Status</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.ts_utc}</td>
              <td>{entry.status}</td>
              <td>{entry.source}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <br />
      <button
        onClick={async () => {
          await logout();
          router.replace("/login");
        }}
      >
        Logout
      </button>
    </main>
  );
}