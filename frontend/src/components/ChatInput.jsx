import { useRef, useEffect } from "react";
import { Send } from "lucide-react";

export default function ChatInput({ onSend, disabled }) {
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  });

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const text = textareaRef.current?.value.trim();
    if (!text || disabled) return;
    onSend(text);
    textareaRef.current.value = "";
    textareaRef.current.style.height = "auto";
  }

  return (
    <div className="px-4 pb-4 pt-3 bg-[#0d1117] border-t border-white/[0.06]">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-3 bg-[#1e2433] border border-white/[0.08] rounded-2xl
                        px-4 py-3 focus-within:border-blue-500/50 transition-colors duration-200 shadow-lg">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Ask about policies, leave, benefits…"
            disabled={disabled}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none resize-none text-slate-200
                       placeholder-slate-500 text-sm leading-relaxed max-h-[120px]
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={submit}
            disabled={disabled}
            aria-label="Send message"
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                       bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-40
                       disabled:cursor-not-allowed text-white transition-all duration-150 shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-xs text-slate-600 mt-2">
          Press <kbd className="font-mono">Enter</kbd> to send &nbsp;·&nbsp; <kbd className="font-mono">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
