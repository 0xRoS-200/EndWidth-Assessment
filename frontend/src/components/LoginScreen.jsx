import { useState } from "react";
import { login } from "../api/client";

const DEMO_CREDENTIALS = [
  { id: "EMP001", name: "Rahul Sharma",  dept: "Engineering", pass: "Rahul@123", initials: "RS", grad: "linear-gradient(135deg,#3D5AFF,#6B5AFF)" },
  { id: "EMP002", name: "Priya Nair",    dept: "HR",          pass: "Priya@123", initials: "PN", grad: "linear-gradient(135deg,#6B5AFF,#a78bfa)" },
  { id: "EMP003", name: "Arjun Mehta",   dept: "Finance",     pass: "Arjun@123", initials: "AM", grad: "linear-gradient(135deg,#3D99FF,#3D5AFF)" },
];

/* ── Inline SVG logo ── */
function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lm1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6B8AFF" />
          <stop offset="100%" stopColor="#3D5AFF" />
        </linearGradient>
        <linearGradient id="lm2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6B5AFF" />
        </linearGradient>
      </defs>
      <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" stroke="url(#lm1)" strokeWidth="1.5" fill="none" />
      <polygon points="20,8 30,14 30,26 20,32 10,26 10,14" stroke="url(#lm2)" strokeWidth="1" fill="rgba(61,90,255,0.1)" />
      <circle cx="20" cy="20" r="3" fill="url(#lm2)" />
      <line x1="20" y1="8"  x2="20" y2="20" stroke="url(#lm1)" strokeWidth="0.9" opacity="0.7"/>
      <line x1="30" y1="14" x2="20" y2="20" stroke="url(#lm1)" strokeWidth="0.9" opacity="0.7"/>
      <line x1="30" y1="26" x2="20" y2="20" stroke="url(#lm1)" strokeWidth="0.9" opacity="0.7"/>
      <line x1="20" y1="32" x2="20" y2="20" stroke="url(#lm1)" strokeWidth="0.9" opacity="0.7"/>
      <line x1="10" y1="26" x2="20" y2="20" stroke="url(#lm1)" strokeWidth="0.9" opacity="0.7"/>
      <line x1="10" y1="14" x2="20" y2="20" stroke="url(#lm1)" strokeWidth="0.9" opacity="0.7"/>
    </svg>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

/* ── Input field ── */
function Field({ label, icon, children }) {
  return (
    <div style={{ marginBottom: "13px" }}>
      <label style={{
        display: "block", fontSize: "10.5px", fontWeight: 600,
        color: "rgba(180,195,255,0.5)", marginBottom: "6px",
        textTransform: "uppercase", letterSpacing: "0.08em",
      }}>
        {label}
      </label>
      <div
        className="input-focus"
        style={{
          display: "flex", alignItems: "center", gap: "8px",
          background: "rgba(10,14,50,0.55)",
          border: "1px solid rgba(61,90,255,0.2)",
          borderRadius: "9px",
          padding: "0 12px",
        }}
      >
        <span style={{ color: "rgba(180,195,255,0.35)", display: "flex", flexShrink: 0 }}>{icon}</span>
        {children}
      </div>
    </div>
  );
}

export default function LoginScreen({ onLoginSuccess }) {
  const [employeeId, setEmployeeId] = useState("EMP001");
  const [password,   setPassword]   = useState("Rahul@123");
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState("");
  const [isLoading,  setIsLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!employeeId.trim() || !password.trim()) { setError("Please fill in both fields."); return; }
    setError("");
    setIsLoading(true);
    try {
      const { user } = await login(employeeId, password);
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px", position: "relative",
    }}>
      <div className="aura-bg" />

      {/* Subtle ambient orbs */}
      <div style={{
        position: "fixed", top: "20%", left: "15%",
        width: "260px", height: "260px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(61,90,255,0.1) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} className="animate-float" />
      <div style={{
        position: "fixed", bottom: "18%", right: "12%",
        width: "200px", height: "200px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(167,139,250,0.09) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* ── Card ── */}
      <div
        className="animate-fade"
        style={{
          width: "100%", maxWidth: "380px",
          position: "relative", zIndex: 1,
          background: "rgba(12,16,48,0.82)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderRadius: "20px",
          border: "1px solid rgba(61,90,255,0.22)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(61,90,255,0.15)",
          overflow: "hidden",
        }}
      >
        {/* Subtle top gradient bar */}
        <div style={{
          height: "2px",
          background: "linear-gradient(90deg, transparent, #3D5AFF 40%, #a78bfa 70%, transparent)",
        }} />

        <div style={{ padding: "24px 26px 26px" }}>

          {/* ── Brand row ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            marginBottom: "22px",
          }}>
            <div style={{
              width: "38px", height: "38px",
              background: "rgba(61,90,255,0.14)",
              border: "1px solid rgba(61,90,255,0.3)",
              borderRadius: "11px",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 16px rgba(61,90,255,0.2)",
            }}>
              <LogoMark />
            </div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#e8edff", letterSpacing: "-0.2px", lineHeight: 1.2 }}>
                NexusAI
              </div>
              <div style={{ fontSize: "11px", color: "rgba(180,195,255,0.45)", letterSpacing: "0.01em" }}>
                Employee Assistant
              </div>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="animate-fade-in" style={{
              display: "flex", alignItems: "center", gap: "7px",
              padding: "8px 12px", borderRadius: "8px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.22)",
              color: "#fca5a5", fontSize: "12px",
              marginBottom: "14px",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit}>
            <Field
              label="Employee ID"
              icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/>
                </svg>
              }
            >
              <input
                id="employee-id-input"
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="EMP001"
                required
                style={{
                  flex: 1, padding: "10px 0", border: "none", outline: "none",
                  background: "transparent", fontSize: "13.5px",
                  color: "#e8edff", fontFamily: "inherit",
                }}
              />
            </Field>

            <Field
              label="Password"
              icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              }
            >
              <input
                id="password-input"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                style={{
                  flex: 1, padding: "10px 0", border: "none", outline: "none",
                  background: "transparent", fontSize: "13.5px",
                  color: "#e8edff", fontFamily: "inherit",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(180,195,255,0.35)", display: "flex",
                  padding: "2px", transition: "color 0.15s", flexShrink: 0,
                }}
                onMouseOver={(e) => e.currentTarget.style.color = "rgba(180,195,255,0.75)"}
                onMouseOut={(e) => e.currentTarget.style.color = "rgba(180,195,255,0.35)"}
              >
                <EyeIcon open={showPass} />
              </button>
            </Field>

            <button
              type="submit"
              id="signin-button"
              disabled={isLoading}
              className="btn-accent"
              style={{
                width: "100%", padding: "11px",
                borderRadius: "9px", fontSize: "13.5px",
                marginTop: "4px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
              }}
            >
              {isLoading ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ animation: "spin-slow 0.9s linear infinite" }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* ── Demo accounts ── */}
          <div style={{
            marginTop: "18px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(61,90,255,0.12)",
          }}>
            <p style={{
              fontSize: "10px", fontWeight: 600,
              color: "rgba(180,195,255,0.35)",
              textTransform: "uppercase", letterSpacing: "0.1em",
              marginBottom: "10px",
            }}>
              Demo — click to autofill
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {DEMO_CREDENTIALS.map((demo) => {
                const selected = employeeId === demo.id;
                return (
                  <button
                    key={demo.id}
                    id={`demo-${demo.id.toLowerCase()}`}
                    type="button"
                    onClick={() => { setEmployeeId(demo.id); setPassword(demo.pass); setError(""); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "8px 10px",
                      border: selected ? "1px solid rgba(61,90,255,0.45)" : "1px solid rgba(61,90,255,0.1)",
                      borderRadius: "9px",
                      background: selected ? "rgba(61,90,255,0.13)" : "rgba(20,28,68,0.35)",
                      cursor: "pointer", textAlign: "left",
                      transition: "all 0.15s ease",
                      fontFamily: "inherit",
                    }}
                    onMouseOver={(e) => { if (!selected) { e.currentTarget.style.borderColor = "rgba(61,90,255,0.3)"; e.currentTarget.style.background = "rgba(61,90,255,0.08)"; }}}
                    onMouseOut={(e) => { if (!selected) { e.currentTarget.style.borderColor = "rgba(61,90,255,0.1)"; e.currentTarget.style.background = "rgba(20,28,68,0.35)"; }}}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "7px",
                      background: demo.grad,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 700, fontSize: "10px",
                      flexShrink: 0, letterSpacing: "0.02em",
                    }}>
                      {demo.initials}
                    </div>

                    {/* Name + dept */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#d8e0ff", lineHeight: 1.2 }}>{demo.name}</div>
                      <div style={{ fontSize: "10.5px", color: "rgba(180,195,255,0.4)", marginTop: "1px" }}>{demo.id} · {demo.dept}</div>
                    </div>

                    {/* Checkmark when selected */}
                    {selected && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b8aff" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
