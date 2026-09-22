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

// Human-readable tool labels
const TOOL_LABELS = {
  search_company_documents: "Searching documents",
  get_employee_info: "Fetching employee info",
  apply_leave: "Applying leave",
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [userProfile, setUserProfile] = useState(null);
  const [sessionId, setSessionId] = useState(() => uuidv4());
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTools, setActiveTools] = useState([]); // tools currently executing
  const [streamingText, setStreamingText] = useState(""); // accumulates current answer
  const bottomRef = useRef(null);

  // Sync profile from backend on login / mount if token exists
  const fetchProfile = useCallback(async () => {
    if (!getStoredToken()) return;
    try {
      const profile = await getMe();
      setUserProfile(profile);
    } catch {
      // If token expired or invalid, log out
      clearAuth();
      setCurrentUser(null);
      setUserProfile(null);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser, fetchProfile]);

  // Scroll to bottom whenever content changes
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
    try {
      await clearSession(sessionId);
    } catch {
      // ignore
    }
    clearAuth();
    setCurrentUser(null);
    setUserProfile(null);
    setMessages([]);
    setStreamingText("");
    setActiveTools([]);
    setSessionId(uuidv4());
  }, [sessionId]);

  const handleSend = useCallback(
    async (text) => {
      if (isLoading) return;

      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setIsLoading(true);
      setStreamingText("");
      setActiveTools([]);

      let accumulated = "";

      try {
        await streamChat(text, sessionId, {
          onToolStart: (tool) => {
            setActiveTools((prev) => [...prev, tool]);
          },
          onToolEnd: (tool) => {
            setActiveTools((prev) => prev.filter((t) => t !== tool));
          },
          onToken: (token) => {
            accumulated += token;
            setStreamingText(accumulated);
          },
          onDone: ({ sources, tools_used }) => {
            // Commit streamed text as a proper message
            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                content: accumulated,
                sources: sources ?? [],
                toolsUsed: tools_used ?? [],
              },
            ]);
            setStreamingText("");
            setActiveTools([]);

            // If leave was applied or employee info queried, refresh profile to reflect new balance
            if (tools_used?.includes("apply_leave")) {
              fetchProfile();
            }
          },
          onError: (msg) => {
            setMessages((prev) => [
              ...prev,
              { role: "error", content: msg },
            ]);
            setStreamingText("");
            setActiveTools([]);
          },
        });
      } catch (err) {
        if (err.message && (err.message.includes("401") || err.message.includes("403"))) {
          handleLogout();
          return;
        }
        setMessages((prev) => [
          ...prev,
          {
            role: "error",
            content: err.message || "Could not reach the assistant. Is the backend running?",
          },
        ]);
        setStreamingText("");
        setActiveTools([]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, isLoading, fetchProfile, handleLogout]
  );

  const handleClear = useCallback(async () => {
    await clearSession(sessionId);
    setSessionId(uuidv4());
    setMessages([]);
    setStreamingText("");
    setActiveTools([]);
  }, [sessionId]);

  // If user is not logged in, show Login Screen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-[#0d1117] text-slate-200 overflow-hidden">
      <Sidebar
        user={currentUser}
        userProfile={userProfile}
        onClearChat={handleClear}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="px-6 py-4 border-b border-white/[0.06] bg-[#0d1117] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-sm font-semibold text-slate-100">
                Employee AI Assistant
              </h1>
              <p className="text-xs text-slate-500">
                Logged in as <span className="text-slate-300 font-medium">{currentUser.name}</span> ({currentUser.employee_id})
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
              <span className="hidden sm:block">Powered by Gemini</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-medium">
                RAG + Agent
              </span>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
          <div className="max-w-3xl mx-auto flex flex-col gap-5 min-h-full">
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

                {/* Live tool activity banner */}
                {activeTools.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15 animate-fade-in">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                    <span className="text-xs text-emerald-400 font-medium">
                      {TOOL_LABELS[activeTools[activeTools.length - 1]] ?? activeTools[activeTools.length - 1]}…
                    </span>
                  </div>
                )}

                {/* Streaming answer bubble */}
                {streamingText && (
                  <div className="flex gap-3 animate-fade-in">
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-md">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.607L5 14.5m14.8.5l1.196 4.765a1.5 1.5 0 01-1.455 1.885H4.459a1.5 1.5 0 01-1.455-1.885L4.2 15" />
                      </svg>
                    </div>
                    <div className="max-w-[72%] px-4 py-3 rounded-2xl rounded-tl-sm bg-[#1e2433] border border-white/[0.06] text-slate-200 text-sm leading-relaxed shadow-sm">
                      {streamingText}
                      <span className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 animate-pulse align-middle" />
                    </div>
                  </div>
                )}

                {/* Typing indicator */}
                {isLoading && !streamingText && activeTools.length === 0 && (
                  <TypingIndicator />
                )}
              </>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <ChatInput onSend={handleSend} disabled={isLoading} />
      </main>
    </div>
  );
}
