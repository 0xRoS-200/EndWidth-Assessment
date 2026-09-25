const SUGGESTIONS = [
  { text: "What is the work from home policy?",                  icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { text: "How many annual leave days do I get?",                icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { text: "How many leaves do I have remaining?",               icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { text: "Apply leave from 2026-10-01 to 2026-10-03",          icon: "M12 6v6m0 0v6m0-6h6m-6 0H6" },
  { text: "Does the company provide health benefits?",           icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  { text: "What are the IT security guidelines?",               icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
];

export default function WelcomeScreen({ onSuggestion }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100%",
      padding: "40px 24px",
      textAlign: "center",
    }}>

      {/* ── Hero ── */}
      <div className="animate-fade-in" style={{ marginBottom: "40px" }}>
        {/* Animated icon block */}
        <div className="animate-float" style={{
          width: "80px", height: "80px",
          background: "linear-gradient(135deg, rgba(61,90,255,0.25) 0%, rgba(107,90,255,0.2) 100%)",
          border: "1px solid rgba(61,90,255,0.3)",
          borderRadius: "22px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
          boxShadow: "0 12px 40px rgba(61,90,255,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="url(#wgrad)" strokeWidth="1.5">
            <defs>
              <linearGradient id="wgrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6b8aff" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>

        <h2 style={{
          fontSize: "26px",
          fontWeight: 700,
          color: "#e8edff",
          margin: "0 0 10px",
          letterSpacing: "-0.4px",
          lineHeight: 1.2,
        }}>
          How can I assist you today?
        </h2>
        <p style={{
          fontSize: "14px",
          color: "rgba(180,195,255,0.55)",
          maxWidth: "380px",
          lineHeight: 1.65,
          margin: "0 auto",
        }}>
          Ask about company policies, check your leave balance, or submit a leave request. Powered by retrieval-augmented AI.
        </p>

        {/* Capability badges */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "18px", flexWrap: "wrap" }}>
          {["RAG Retrieval", "Leave Management", "Policy Search", "Agentic AI"].map((cap) => (
            <span key={cap} style={{
              padding: "4px 12px",
              borderRadius: "99px",
              fontSize: "11px",
              fontWeight: 600,
              color: "#93a8ff",
              background: "rgba(61,90,255,0.12)",
              border: "1px solid rgba(61,90,255,0.25)",
              letterSpacing: "0.02em",
            }}>
              {cap}
            </span>
          ))}
        </div>
      </div>

      {/* ── Suggestion grid ── */}
      <div className="animate-fade-in" style={{
        width: "100%",
        maxWidth: "580px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "8px",
      }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s.text}
            className="suggestion-card"
            onClick={() => onSuggestion(s.text)}
          >
            <div style={{
              width: "30px", height: "30px", flexShrink: 0,
              background: "rgba(61,90,255,0.12)",
              border: "1px solid rgba(61,90,255,0.2)",
              borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b8aff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={s.icon} />
              </svg>
            </div>
            <span style={{ fontSize: "13px", lineHeight: 1.45, textAlign: "left" }}>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
