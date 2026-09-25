export default function SourceTag({ source }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "3px 10px",
      borderRadius: "99px",
      fontSize: "11px",
      fontWeight: 500,
      color: "rgba(147,168,255,0.85)",
      background: "rgba(61,90,255,0.12)",
      border: "1px solid rgba(61,90,255,0.22)",
      letterSpacing: "0.01em",
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
      {source}
    </span>
  );
}
