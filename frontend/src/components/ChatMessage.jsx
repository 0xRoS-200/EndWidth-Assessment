import SourceTag from "./SourceTag";
import ToolTag from "./ToolTag";

/* ── Simple inline markdown renderer ── */
/* Handles: **bold**, *italic*, `code`, line breaks, numbered lists, bullet lists */
function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Blank line → spacer
    if (line.trim() === "") {
      elements.push(<div key={key++} style={{ height: "6px" }} />);
      continue;
    }

    // Bullet list item
    const bulletMatch = line.match(/^[\s]*[-*]\s+(.*)/);
    if (bulletMatch) {
      elements.push(
        <div key={key++} style={{ display: "flex", gap: "8px", marginBottom: "3px" }}>
          <span style={{ color: "rgba(147,168,255,0.7)", flexShrink: 0, marginTop: "1px" }}>•</span>
          <span>{renderInline(bulletMatch[1])}</span>
        </div>
      );
      continue;
    }

    // Numbered list item
    const numberedMatch = line.match(/^[\s]*(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      elements.push(
        <div key={key++} style={{ display: "flex", gap: "8px", marginBottom: "3px" }}>
          <span style={{ color: "rgba(147,168,255,0.7)", flexShrink: 0, minWidth: "16px", textAlign: "right" }}>{numberedMatch[1]}.</span>
          <span>{renderInline(numberedMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Heading (## or #)
    const headingMatch = line.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const sizes = { 1: "16px", 2: "15px", 3: "14px" };
      elements.push(
        <div key={key++} style={{ fontWeight: 700, fontSize: sizes[level] || "14px", color: "#e8edff", marginBottom: "4px", marginTop: "6px" }}>
          {renderInline(headingMatch[2])}
        </div>
      );
      continue;
    }

    // Normal paragraph line
    elements.push(
      <div key={key++} style={{ marginBottom: "2px" }}>
        {renderInline(line)}
      </div>
    );
  }

  return elements;
}

/* ── Inline formatting: **bold**, *italic*, `code` ── */
function renderInline(text) {
  if (!text) return null;
  // Split on **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ fontWeight: 700, color: "#e8edff" }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i} style={{ fontStyle: "italic" }}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} style={{
          fontFamily: "monospace", fontSize: "12.5px",
          background: "rgba(61,90,255,0.18)", color: "#93a8ff",
          padding: "1px 6px", borderRadius: "4px",
          border: "1px solid rgba(61,90,255,0.2)",
        }}>{part.slice(1, -1)}</code>
      );
    }
    return part;
  });
}

/* ── Avatars ── */
function UserAvatar() {
  return (
    <div style={{
      width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg,#3D5AFF,#6B5AFF)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
  );
}

function AiAvatar() {
  return (
    <div style={{
      width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
      background: "rgba(61,90,255,0.18)",
      border: "1px solid rgba(61,90,255,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
        <defs>
          <linearGradient id="aigrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6b8aff"/><stop offset="100%" stopColor="#a78bfa"/>
          </linearGradient>
        </defs>
        <path stroke="url(#aigrad)" strokeLinecap="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
      </svg>
    </div>
  );
}

function ErrorAvatar() {
  return (
    <div style={{
      width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
      background: "rgba(239,68,68,0.12)",
      border: "1px solid rgba(239,68,68,0.25)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>
  );
}

export default function ChatMessage({ role, content, sources = [], toolsUsed = [] }) {
  const isUser  = role === "user";
  const isError = role === "error";

  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        gap: "9px",
        marginBottom: "16px",
        alignItems: "flex-start",
      }}
    >
      {isUser ? <UserAvatar /> : isError ? <ErrorAvatar /> : <AiAvatar />}

      <div style={{
        maxWidth: "75%",
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        alignItems: isUser ? "flex-end" : "flex-start",
      }}>
        <div
          className={isUser ? "msg-user" : isError ? "msg-error" : "msg-ai"}
          style={{
            padding: "10px 14px",
            borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            fontSize: "14px",
            lineHeight: "1.65",
            wordBreak: "break-word",
          }}
        >
          {/* Render markdown for AI messages, plain text for user/error */}
          {isUser || isError ? content : renderMarkdown(content)}
        </div>

        {(sources.length > 0 || toolsUsed.length > 0) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", paddingLeft: "2px" }}>
            {sources.map((s) => <SourceTag key={s} source={s} />)}
            {toolsUsed.map((t) => <ToolTag key={t} tool={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}
