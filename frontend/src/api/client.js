const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TOKEN_KEY = "employee_ai_token";
const USER_KEY = "employee_ai_user";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getAuthHeaders(contentType = true) {
  const headers = {};
  if (contentType) {
    headers["Content-Type"] = "application/json";
  }
  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Authenticate employee with credentials.
 */
export async function login(employeeId, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employee_id: employeeId.trim().toUpperCase(),
      password,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Login failed (${res.status})`);
  }

  const data = await res.json();
  const user = {
    employee_id: data.employee_id,
    name: data.name,
    department: data.department,
  };
  saveAuth(data.access_token, user);
  return { token: data.access_token, user };
}

/**
 * Fetch profile of currently authenticated employee.
 */
export async function getMe() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(false),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      clearAuth();
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch profile (${res.status})`);
  }

  return res.json();
}

/**
 * Send a chat message to the backend (standard, non-streaming).
 */
export async function sendChat(message, sessionId) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      message,
      session_id: sessionId,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Server error ${res.status}`);
  }

  return res.json();
}

/**
 * Send a chat message using the streaming SSE endpoint.
 *
 * @param {string} message
 * @param {string} sessionId
 * @param {object} callbacks
 * @param {(tool: string) => void}   callbacks.onToolStart  - fired when a tool begins
 * @param {(tool: string) => void}   callbacks.onToolEnd    - fired when a tool finishes
 * @param {(token: string) => void}  callbacks.onToken      - fired for each answer word
 * @param {(meta: {sources, tools_used}) => void} callbacks.onDone - fired on completion
 * @param {(msg: string) => void}    callbacks.onError      - fired on error
 */
export async function streamChat(message, sessionId, callbacks) {
  const { onToolStart, onToolEnd, onToken, onDone, onError } = callbacks;

  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      message,
      session_id: sessionId,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Server error ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop(); // keep incomplete chunk

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(line.slice(6));
        switch (event.type) {
          case "tool_start":
            onToolStart?.(event.tool);
            break;
          case "tool_end":
            onToolEnd?.(event.tool);
            break;
          case "token":
            onToken?.(event.text);
            break;
          case "done":
            onDone?.({ sources: event.sources, tools_used: event.tools_used });
            break;
          case "error":
            onError?.(event.message);
            break;
        }
      } catch {
        // Ignore malformed SSE lines
      }
    }
  }
}

/**
 * Clear server-side conversation history for a session.
 */
export async function clearSession(sessionId) {
  await fetch(`${API_BASE}/session/${sessionId}`, {
    method: "DELETE",
    headers: getAuthHeaders(false),
  }).catch(() => {});
}
