import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import Sidebar from "./components/Sidebar";
import ChatMessage from "./components/ChatMessage";
import TypingIndicator from "./components/TypingIndicator";
import ChatInput from "./components/ChatInput";
import WelcomeScreen from "./components/WelcomeScreen";
import { sendChat, clearSession } from "./api/client";

export default function App() {
  const [employeeId, setEmployeeId] = useState("EMP001");
  const [sessionId, setSessionId] = useState(() => uuidv4());
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = useCallback(
    async (text) => {
      if (isLoading) return;

      // Add user message immediately
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setIsLoading(true);

      try {
        const data = await sendChat(employeeId, text, sessionId);
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: data.answer,
            sources: data.sources ?? [],
            toolsUsed: data.tools_used ?? [],
          },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "error",
            content: err.message || "Could not reach the assistant. Is the backend running?",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [employeeId, sessionId, isLoading]
  );

  const handleClear = useCallback(async () => {
    await clearSession(sessionId);
    setSessionId(uuidv4());
    setMessages([]);
  }, [sessionId]);

  // When switching employees, clear the chat & start fresh session
  const handleEmployeeChange = useCallback(
    async (newId) => {
      if (newId === employeeId) return;
      await clearSession(sessionId);
      setSessionId(uuidv4());
      setMessages([]);
      setEmployeeId(newId);
    },
    [employeeId, sessionId]
  );

  return (
    <div className="flex h-screen bg-[#0d1117] text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        employeeId={employeeId}
        onEmployeeChange={handleEmployeeChange}
        onClearChat={handleClear}
      />

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="px-6 py-4 border-b border-white/[0.06] bg-[#0d1117] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-sm font-semibold text-slate-100">
                Employee AI Assistant
              </h1>
              <p className="text-xs text-slate-500">
                Ask about policies, leave, benefits &amp; more
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
              <span className="hidden sm:block">Powered by Gemini</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400
                               border border-blue-500/20 text-[11px] font-medium">
                RAG + Agent
              </span>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5 scroll-smooth">
          <div className="max-w-3xl mx-auto flex flex-col gap-5 min-h-full">
            {messages.length === 0 && !isLoading ? (
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
                {isLoading && <TypingIndicator />}
              </>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input bar */}
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </main>
    </div>
  );
}
