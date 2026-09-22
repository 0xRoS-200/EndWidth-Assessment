import { Bot, Trash2, ChevronDown, Wifi } from "lucide-react";
import EMPLOYEES from "../constants/employees";

export default function Sidebar({ employeeId, onEmployeeChange, onClearChat }) {
  const emp = EMPLOYEES[employeeId];

  return (
    <aside className="w-64 flex-shrink-0 bg-[#0d1117] border-r border-white/[0.06]
                      flex flex-col h-full">
      {/* Logo / brand */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500
                          flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100 leading-tight">Employee AI</p>
            <p className="text-[11px] text-slate-500 leading-tight">Assistant</p>
          </div>
        </div>
      </div>

      {/* Employee selector */}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
          Logged in as
        </p>
        <div className="relative">
          <select
            value={employeeId}
            onChange={(e) => onEmployeeChange(e.target.value)}
            className="w-full appearance-none bg-[#1e2433] border border-white/[0.08] rounded-xl
                       px-3 py-2.5 text-sm text-slate-200 pr-8 cursor-pointer
                       focus:outline-none focus:border-blue-500/50 transition-colors"
          >
            {Object.entries(EMPLOYEES).map(([id, info]) => (
              <option key={id} value={id}>
                {id} — {info.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Employee card */}
        {emp && (
          <div className="mt-3 px-3 py-2.5 rounded-xl bg-[#1e2433] border border-white/[0.05]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700
                              flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {emp.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-medium text-slate-200">{emp.name}</p>
                <p className="text-[11px] text-slate-500">{emp.department}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status & actions */}
      <div className="px-4 py-4 border-t border-white/[0.06] space-y-2">
        {/* Online indicator */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5
                        border border-emerald-500/10">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-400 font-medium">Backend connected</span>
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Clear chat button */}
        <button
          onClick={onClearChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500
                     hover:text-red-400 hover:bg-red-500/10 border border-transparent
                     hover:border-red-500/20 transition-all duration-150 text-xs font-medium"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear conversation
        </button>
      </div>
    </aside>
  );
}
