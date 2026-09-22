const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Send a chat message to the backend (standard, non-streaming).
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
 * Send a chat message using the streaming SSE endpoint.
 *
 * @param {string} employeeId
 * @param {string} message
 * @param {string} sessionId
 * @param {object} callbacks
 * @param {(tool: string) => void}   callbacks.onToolStart  - fired when a tool begins
 * @param {(tool: string) => void}   callbacks.onToolEnd    - fired when a tool finishes
 * @param {(token: string) => void}  callbacks.onToken      - fired for each answer word
 * @param {(meta: {sources, tools_used}) => void} callbacks.onDone - fired on completion
 * @param {(msg: string) => void}    callbacks.onError      - fired on error
 */
export async function streamChat(employeeId, message, sessionId, callbacks) {
  const { onToolStart, onToolEnd, onToken, onDone, onError } = callbacks;

  const res = await fetch(`${API_BASE}/chat/stream`, {
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
  await fetch(`${API_BASE}/session/${sessionId}`, { method: "DELETE" }).catch(
    () => {}
  );
}
