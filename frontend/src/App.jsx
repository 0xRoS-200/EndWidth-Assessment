import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import Sidebar from "./components/Sidebar";
import ChatMessage from "./components/ChatMessage";
import TypingIndicator from "./components/TypingIndicator";
import ChatInput from "./components/ChatInput";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen from "./components/LoginScreen";
import {
  streamChat,
  clearSession,
  getStoredUser,
  getStoredToken,
  getMe,
  clearAuth,
} from "./api/client";

const TOOL_LABELS = {
  search_company_documents: "Searching documents",
  get_employee_info:        "Fetching employee info",
  apply_leave:              "Processing leave request",
};

/* ── Mobile sidebar toggle button ── */
function HamburgerBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "36px", height: "36px",
        background: "rgba(61,90,255,0.12)",
        border: "1px solid rgba(61,90,255,0.25)",
        borderRadius: "9px",
        cursor: "pointer", color: "rgba(180,195,255,0.8)",
        transition: "all 0.15s",
      }}
      onMouseOver={(e) => e.currentTarget.style.background = "rgba(61,90,255,0.22)"}
      onMouseOut={(e) => e.currentTarget.style.background = "rgba(61,90,255,0.12)"}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
  );
}

export default function App() {
  const [currentUser,   setCurrentUser]   = useState(() => getStoredUser());
  const [userProfile,   setUserProfile]   = useState(null);
  const [sessionId,     setSessionId]     = useState(() => uuidv4());
  const [messages,      setMessages]      = useState([]);
  const [isLoading,     setIsLoading]     = useState(false);
  const [activeTools,   setActiveTools]   = useState([]);
  const [streamingText, setStreamingText] = useState("");
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const bottomRef = useRef(null);

  const fetchProfile = useCallback(async () => {
    if (!getStoredToken()) return;
    try {
      const profile = await getMe();
      setUserProfile(profile);
    } catch {
      clearAuth();
      setCurrentUser(null);
      setUserProfile(null);
    }
  }, []);

  useEffect(() => {
    if (currentUser) fetchProfile();
  }, [currentUser, fetchProfile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, streamingText, activeTools]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setMessages([]);
    setStreamingText("");
    setActiveTools([]);
    setSessionId(uuidv4());
  };

  const handleLogout = useCallback(async () => {
    try { await clearSession(sessionId); } catch { /* ignore */ }
    clearAuth();
    setCurrentUser(null);
    setUserProfile(null);
    setMessages([]);
    setStreamingText("");
    setActiveTools([]);
    setSessionId(uuidv4());
  }, [sessionId]);

  const handleSend = useCallback(async (text) => {
    if (isLoading) return;
    setSidebarOpen(false);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsLoading(true);
    setStreamingText("");
    setActiveTools([]);
    let accumulated = "";

    try {
      await streamChat(text, sessionId, {
        onToolStart: (tool) => setActiveTools((prev) => [...prev, tool]),
        onToolEnd:   (tool) => setActiveTools((prev) => prev.filter((t) => t !== tool)),
        onToken:     (token) => { accumulated += token; setStreamingText(accumulated); },
        onDone: ({ sources, tools_used }) => {
          setMessages((prev) => [...prev, {
            role: "ai", content: accumulated,
            sources: sources ?? [], toolsUsed: tools_used ?? [],
          }]);
          setStreamingText("");
          setActiveTools([]);
          if (tools_used?.includes("apply_leave")) fetchProfile();
        },
        onError: (msg) => {
          setMessages((prev) => [...prev, { role: "error", content: msg }]);
          setStreamingText("");
          setActiveTools([]);
        },
      });
    } catch (err) {
      if (err.message?.includes("401") || err.message?.includes("403")) { handleLogout(); return; }
      setMessages((prev) => [...prev, {
        role: "error",
        content: err.message || "Could not reach the assistant. Is the backend running?",
      }]);
      setStreamingText("");
      setActiveTools([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading, fetchProfile, handleLogout]);

  const handleClear = useCallback(async () => {
    await clearSession(sessionId);
    setSessionId(uuidv4());
    setMessages([]);
    setStreamingText("");
    setActiveTools([]);
  }, [sessionId]);

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", position: "relative" }}>
      {/* ── Aura background ── */}
      <div className="aura-bg" />

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 40,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* ── Sidebar (responsive) ── */}
      <div style={{
        position: window.innerWidth < 768 ? "fixed" : "relative",
        zIndex: 50,
        height: "100%",
        transform: window.innerWidth < 768 ? (sidebarOpen ? "translateX(0)" : "translateX(-100%)") : "none",
        transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        flexShrink: 0,
      }}>
        <Sidebar
          user={currentUser}
          userProfile={userProfile}
          onClearChat={handleClear}
          onLogout={handleLogout}
        />
      </div>

      {/* ── Main chat area ── */}
      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        position: "relative",
        zIndex: 1,
      }}>

        {/* ── Header ── */}
        <header style={{
          padding: "11px 20px",
          background: "rgba(7,9,26,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(61,90,255,0.12)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
          zIndex: 10,
        }}>
          {/* Mobile hamburger */}
          <div style={{ display: "none" }} className="mobile-menu-btn">
            <HamburgerBtn onClick={() => setSidebarOpen(!sidebarOpen)} />
          </div>

          {/* Title */}
          <div>
            <div style={{ fontWeight: 600, fontSize: "14px", color: "#e8edff" }}>
              Employee AI Assistant
            </div>
            <div style={{ fontSize: "11px", color: "rgba(180,195,255,0.4)", marginTop: "1px" }}>
              {currentUser.name} &middot; {currentUser.employee_id}
            </div>
          </div>


        </header>

        {/* ── Messages area ── */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px",
        }}>
          <div style={{ maxWidth: "700px", margin: "0 auto", minHeight: "100%", width: "100%" }}>
            {messages.length === 0 && !isLoading && !streamingText ? (
              <WelcomeScreen onSuggestion={handleSend} />
            ) : (
              <>
                {messages.map((msg, i) => (
                  <ChatMessage
                    key={i}
                    role={msg.role}
                    content={msg.content}
                    sources={msg.sources}
                    toolsUsed={msg.toolsUsed}
                  />
                ))}

                {/* Active tool banner */}
                {activeTools.length > 0 && (
                  <div className="animate-fade-in" style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "7px 14px",
                    background: "rgba(61,90,255,0.08)",
                    border: "1px solid rgba(61,90,255,0.18)",
                    borderRadius: "8px",
                    marginBottom: "10px", fontSize: "12px",
                    color: "rgba(147,168,255,0.8)",
                  }}>
                    <span style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: "#6b8aff", flexShrink: 0,
                      animation: "pulse-glow 1.5s infinite",
                      display: "inline-block",
                    }} />
                    {TOOL_LABELS[activeTools[activeTools.length - 1]] ?? activeTools[activeTools.length - 1]}...
                  </div>
                )}

                {/* Streaming bubble */}
                {streamingText && (
                  <div className="animate-fade-in" style={{ display: "flex", gap: "9px", marginBottom: "16px" }}>
                    <div style={{
                      width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
                      background: "rgba(61,90,255,0.18)",
                      border: "1px solid rgba(61,90,255,0.35)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
                        <defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6b8aff"/><stop offset="100%" stopColor="#a78bfa"/></linearGradient></defs>
                        <path stroke="url(#sg)" strokeLinecap="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                      </svg>
                    </div>
                    <div className="msg-ai" style={{
                      padding: "10px 14px",
                      borderRadius: "16px 16px 16px 4px",
                      fontSize: "14px", lineHeight: "1.65",
                      maxWidth: "75%",
                      wordBreak: "break-word",
                    }}>
                      {streamingText}
                      <span style={{
                        display: "inline-block",
                        width: "2px", height: "13px",
                        background: "#6b8aff",
                        marginLeft: "3px",
                        verticalAlign: "middle",
                        animation: "pulse-glow 0.8s infinite",
                        borderRadius: "1px",
                      }} />
                    </div>
                  </div>
                )}

                {/* Typing indicator */}
                {isLoading && !streamingText && activeTools.length === 0 && <TypingIndicator />}
              </>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <ChatInput onSend={handleSend} disabled={isLoading} />
      </main>

      {/* Responsive styles injected via style tag */}
      <style>{`
        @media (max-width: 767px) {
          .mobile-menu-btn { display: flex !important; }
        }
        @media (max-width: 767px) {
          aside {
            position: fixed !important;
          }
        }
        @media (min-width: 768px) {
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
