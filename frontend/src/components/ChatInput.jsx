import { useRef, useEffect } from "react";
import { Send } from "lucide-react";

export default function ChatInput({ onSend, disabled }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 130) + "px";
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
    <div style={{
      padding: "10px 20px 14px",
      background: "rgba(7,9,26,0.9)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(61,90,255,0.12)",
      flexShrink: 0,
    }}>
      {/* Centred, max-width wrapper — same width as the message thread above */}
      <div style={{
        maxWidth: "700px",
        margin: "0 auto",
        width: "100%",
      }}>
        <div
          className="input-focus"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(14,20,58,0.8)",
            border: "1.5px solid rgba(61,90,255,0.22)",
            borderRadius: "12px",
            padding: "10px 10px 10px 16px",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        >
          <textarea
            ref={textareaRef}
            id="chat-textarea"
            rows={1}
            placeholder="Ask about policies, leave balance, or submit a request…"
            disabled={disabled}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: "13.5px",
              color: "#e8edff",
              lineHeight: "1.5",
              maxHeight: "130px",
              fontFamily: "inherit",
              padding: "0",
              margin: "0",
              display: "block",
            }}
          />
          <button
            id="chat-send-btn"
            onClick={submit}
            disabled={disabled}
            className="btn-accent"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Send size={14} />
          </button>
        </div>

        <p style={{
          textAlign: "center",
          fontSize: "10.5px",
          color: "rgba(180,195,255,0.25)",
          marginTop: "6px",
          letterSpacing: "0.01em",
        }}>
          Press <kbd>Enter</kbd> to send &middot; <kbd>Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
