import { auth } from "@/lib/firebase";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

async function getToken() {
  const u = auth.currentUser;
  if (!u) return null;
  return await u.getIdToken();
}

export async function apiGet(path) {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `GET ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPost(path, body) {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `POST ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPatch(path, body) {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `PATCH ${path} failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Subscribe to Server-Sent Events from /events.
 * Returns a cleanup function.
 *
 * @param {string} token - Firebase ID token
 * @param {function} onMessage - called with parsed JSON payload
 * @param {function} [onError] - optional error handler
 */
export function subscribeToEvents(token, onMessage, onError) {
  const url = new URL(`${BASE}/events`);
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${BASE}/events`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        onError?.(new Error(`SSE connect failed: ${res.status}`));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop(); 
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              onMessage(JSON.parse(line.slice(6)));
            } catch {}
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") onError?.(err);
    }
  })();

  return () => controller.abort();
}