import { auth } from "@/lib/firebase";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

async function getIdTokenOrNull() {
  const u = auth.currentUser;
  if (!u) return null;
  return await u.getIdToken();
}

export async function apiGet(path) {
  const token = await getIdTokenOrNull();
  const res = await fetch(`${BASE}${path}`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return await res.json();
}

export async function apiPost(path, body) {
  const token = await getIdTokenOrNull();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });

  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return await res.json();
}