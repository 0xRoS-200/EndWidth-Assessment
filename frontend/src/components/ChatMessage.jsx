import { Bot, User } from "lucide-react";
import SourceTag from "./SourceTag";
import ToolTag from "./ToolTag";

export default function ChatMessage({ role, content, sources = [], toolsUsed = [] }) {
  const isUser = role === "user";
  const isError = role === "error";

  return (
    <div
      className={`flex gap-3 animate-fade-in ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white shadow-md
          ${isUser
            ? "bg-gradient-to-br from-blue-500 to-indigo-600"
            : isError
            ? "bg-gradient-to-br from-red-500 to-rose-700"
            : "bg-gradient-to-br from-emerald-500 to-blue-600"
          }`}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[72%] flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
            ${isUser
              ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-sm"
              : isError
              ? "bg-red-500/10 border border-red-500/30 text-red-400 rounded-tl-sm"
              : "bg-[#1e2433] border border-white/[0.06] text-slate-200 rounded-tl-sm"
            }`}
        >
          {content}
        </div>

        {/* Meta — sources & tools */}
        {(sources.length > 0 || toolsUsed.length > 0) && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {sources.map((s) => (
              <SourceTag key={s} source={s} />
            ))}
            {toolsUsed.map((t) => (
              <ToolTag key={t} tool={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
