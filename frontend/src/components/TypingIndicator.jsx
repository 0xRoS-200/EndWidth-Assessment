export default function TypingIndicator() {
  return (
    <div className="animate-fade-in" style={{
      display: "flex",
      gap: "10px",
      marginBottom: "18px",
      alignItems: "flex-start",
    }}>
      {/* AI avatar */}
      <div style={{
        width: "34px", height: "34px", borderRadius: "10px", flexShrink: 0,
        background: "rgba(61,90,255,0.15)",
        border: "1px solid rgba(61,90,255,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
          <defs>
            <linearGradient id="tigrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6b8aff"/>
              <stop offset="100%" stopColor="#a78bfa"/>
            </linearGradient>
          </defs>
          <path stroke="url(#tigrad)" strokeLinecap="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
      </div>

      {/* Dots bubble */}
      <div className="msg-ai" style={{
        padding: "12px 18px",
        borderRadius: "18px 18px 18px 4px",
        display: "flex",
        gap: "5px",
        alignItems: "center",
      }}>
        <span className="typing-dot" style={{
          width: "7px", height: "7px", borderRadius: "50%",
          background: "rgba(107,138,255,0.7)",
          display: "inline-block",
        }} />
        <span className="typing-dot" style={{
          width: "7px", height: "7px", borderRadius: "50%",
          background: "rgba(107,138,255,0.7)",
          display: "inline-block",
        }} />
        <span className="typing-dot" style={{
          width: "7px", height: "7px", borderRadius: "50%",
          background: "rgba(107,138,255,0.7)",
          display: "inline-block",
        }} />
      </div>
    </div>
  );
}
