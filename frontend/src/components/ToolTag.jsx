const TOOL_LABELS = {
  search_company_documents: "Docs Search",
  get_employee_info:        "Employee Info",
  apply_leave:              "Leave Applied",
};

export default function ToolTag({ tool }) {
  const label = TOOL_LABELS[tool] ?? tool;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "3px 10px",
      borderRadius: "99px",
      fontSize: "11px",
      fontWeight: 500,
      color: "rgba(110,231,183,0.85)",
      background: "rgba(52,211,153,0.1)",
      border: "1px solid rgba(52,211,153,0.2)",
      letterSpacing: "0.01em",
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      {label}
    </span>
  );
}
