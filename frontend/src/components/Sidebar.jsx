import { LogOut, Trash2, ChevronRight } from "lucide-react";
import { LogoIcon } from "./LogoIcon";

const AVATAR_GRADIENTS = {
  EMP001: "linear-gradient(135deg,#3D5AFF,#6B5AFF)",
  EMP002: "linear-gradient(135deg,#6B5AFF,#a78bfa)",
  EMP003: "linear-gradient(135deg,#3D99FF,#3D5AFF)",
};

const QUICK_QUESTIONS = [
  "What is the work from home policy?",
  "How many annual leave days do I get?",
  "How many leaves do I have remaining?",
  "What are the IT security guidelines?",
  "What expenses are reimbursable for travel?",
];

export default function Sidebar({ user, userProfile, onClearChat, onLogout }) {
  const displayName  = userProfile?.name       || user?.name       || "Employee";
  const displayId    = user?.employee_id                            || "EMP";
  const displayDept  = userProfile?.department || user?.department || "General";
  const displayRole  = userProfile?.role                           || "Team Member";
  const leaveBalance = userProfile?.leave_balance;
  const initials     = displayName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const avatarGrad   = AVATAR_GRADIENTS[displayId] || "linear-gradient(135deg,#3D5AFF,#6B5AFF)";

  return (
    <aside style={{
      width: "272px",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "rgba(7,9,26,0.82)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      borderRight: "1px solid rgba(61,90,255,0.18)",
      position: "relative",
      zIndex: 10,
    }}>

      {/* ── Logo / Header ── */}
      <div style={{
        padding: "18px 20px",
        borderBottom: "1px solid rgba(61,90,255,0.12)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}>
        <div style={{
          width: "38px", height: "38px",
          background: "rgba(61,90,255,0.15)",
          borderRadius: "11px",
          border: "1px solid rgba(61,90,255,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <LogoIcon size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "14px", color: "#e8edff", letterSpacing: "-0.2px" }}>
            NexusAI
          </div>
          <div style={{ fontSize: "11px", color: "rgba(180,195,255,0.45)", letterSpacing: "0.02em" }}>
            Employee Assistant
          </div>
        </div>
        <button
          id="sidebar-logout-btn"
          onClick={onLogout}
          title="Sign out"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(180,195,255,0.4)",
            display: "flex", alignItems: "center",
            padding: "6px", borderRadius: "8px",
            transition: "all 0.15s",
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = "#fca5a5"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
          onMouseOut={(e) => { e.currentTarget.style.color = "rgba(180,195,255,0.4)"; e.currentTarget.style.background = "none"; }}
          title="Logout"
        >
          <LogOut size={15} />
        </button>
      </div>

      {/* ── Profile Card ── */}
      <div style={{
        padding: "16px 18px",
        borderBottom: "1px solid rgba(61,90,255,0.1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "12px",
            background: avatarGrad,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: "14px", flexShrink: 0,
            letterSpacing: "0.02em",
            boxShadow: "0 4px 14px rgba(61,90,255,0.3)",
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: "14px", color: "#e8edff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {displayName}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(180,195,255,0.5)", marginTop: "1px" }}>
              {displayRole}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{
          background: "rgba(61,90,255,0.07)",
          border: "1px solid rgba(61,90,255,0.15)",
          borderRadius: "10px",
          padding: "10px 12px",
          fontSize: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "7px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(180,195,255,0.45)" }}>Employee ID</span>
            <code style={{ fontWeight: 600, color: "#93a8ff", fontFamily: "monospace", fontSize: "12px" }}>{displayId}</code>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(180,195,255,0.45)" }}>Department</span>
            <span style={{ fontWeight: 600, color: "#e8edff" }}>{displayDept}</span>
          </div>
          {leaveBalance !== undefined && (
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              paddingTop: "7px",
              borderTop: "1px solid rgba(61,90,255,0.12)",
              marginTop: "2px",
            }}>
              <span style={{ color: "rgba(180,195,255,0.45)" }}>Leave Balance</span>
              <span style={{
                fontWeight: 700, color: "#6ee7b7",
                background: "rgba(52,211,153,0.12)",
                border: "1px solid rgba(52,211,153,0.2)",
                padding: "1px 8px", borderRadius: "6px",
                fontSize: "12px",
              }}>
                {leaveBalance} days
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Questions ── */}
      <div style={{ padding: "14px 18px", flex: 1, overflow: "auto" }}>
        <p style={{
          fontSize: "10px", fontWeight: 600,
          color: "rgba(180,195,255,0.35)",
          textTransform: "uppercase", letterSpacing: "0.1em",
          marginBottom: "10px",
        }}>
          Quick Questions
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {QUICK_QUESTIONS.map((q) => (
            <div key={q} className="sidebar-link" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ChevronRight size={12} style={{ color: "rgba(61,90,255,0.5)", flexShrink: 0 }} />
              <span style={{ fontSize: "12px", lineHeight: "1.4" }}>{q}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Clear Chat ── */}
      <div style={{ padding: "12px 18px", borderTop: "1px solid rgba(61,90,255,0.1)" }}>
        <button
          id="clear-chat-btn"
          onClick={onClearChat}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            width: "100%", padding: "9px 12px",
            border: "1px solid rgba(61,90,255,0.15)",
            borderRadius: "9px",
            background: "rgba(61,90,255,0.05)",
            cursor: "pointer", fontSize: "12px",
            color: "rgba(180,195,255,0.55)",
            fontFamily: "inherit",
            transition: "all 0.15s",
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#fca5a5"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}
          onMouseOut={(e) => { e.currentTarget.style.background = "rgba(61,90,255,0.05)"; e.currentTarget.style.color = "rgba(180,195,255,0.55)"; e.currentTarget.style.borderColor = "rgba(61,90,255,0.15)"; }}
        >
          <Trash2 size={13} />
          Clear conversation
        </button>
      </div>
    </aside>
  );
}
