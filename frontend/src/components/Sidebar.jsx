import { Bot, Trash2, LogOut, ShieldCheck, Wifi } from "lucide-react";

export default function Sidebar({ user, userProfile, onClearChat, onLogout }) {
  const displayName = userProfile?.name || user?.name || "Employee";
  const displayId = user?.employee_id || "EMP";
  const displayDept = userProfile?.department || user?.department || "General";
  const displayRole = userProfile?.role || "Team Member";
  const leaveBalance = userProfile?.leave_balance;

  return (
    <aside className="w-64 flex-shrink-0 bg-[#0d1117] border-r border-white/[0.06] flex flex-col h-full">
      {/* Logo / brand */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100 leading-tight">Employee AI</p>
            <p className="text-[11px] text-slate-500 leading-tight">Assistant</p>
          </div>
        </div>
      </div>

      {/* Authenticated Employee Profile Card */}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Authenticated Profile
          </p>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
            <ShieldCheck className="w-3 h-3" />
            JWT Verified
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#161b22] border border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow">
              {displayName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{displayName}</p>
              <p className="text-[11px] text-slate-400 truncate">{displayRole}</p>
            </div>
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-white/[0.04] grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Emp ID</span>
              <span className="font-mono text-slate-300 font-medium">{displayId}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Dept</span>
              <span className="text-slate-300 font-medium truncate block">{displayDept}</span>
            </div>
            {leaveBalance !== undefined && (
              <div className="col-span-2 pt-1">
                <span className="text-slate-500 text-[10px] uppercase block">Leave Balance</span>
                <span className="text-emerald-400 font-semibold">{leaveBalance} days remaining</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status & actions */}
      <div className="px-4 py-4 border-t border-white/[0.06] space-y-2">
        {/* Online indicator */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-400 font-medium">Backend connected</span>
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Clear chat button */}
        <button
          onClick={onClearChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-150 text-xs font-medium cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear conversation
        </button>

        {/* Sign out button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] border border-transparent transition-all duration-150 text-xs font-medium cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
