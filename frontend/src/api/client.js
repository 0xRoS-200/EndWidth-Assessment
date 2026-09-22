const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Send a chat message to the backend.
 * @param {string} employeeId
 * @param {string} message
 * @param {string} sessionId
 * @returns {Promise<{answer:string, sources:string[], tools_used:string[], session_id:string}>}
 */
export async function sendChat(employeeId, message, sessionId) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employee_id: employeeId,
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
 * Clear server-side conversation history for a session.
 */
export async function clearSession(sessionId) {
  await fetch(`${API_BASE}/session/${sessionId}`, { method: "DELETE" }).catch(
    () => {}
  );
}
