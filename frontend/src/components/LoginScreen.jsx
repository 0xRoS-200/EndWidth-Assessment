import { useState } from "react";
import { Bot, Lock, User, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { login } from "../api/client";

const DEMO_CREDENTIALS = [
  { id: "EMP001", name: "Rahul Sharma", role: "Software Engineer", dept: "Engineering", pass: "Rahul@123" },
  { id: "EMP002", name: "Priya Nair", role: "HR Business Partner", dept: "HR", pass: "Priya@123" },
  { id: "EMP003", name: "Arjun Mehta", role: "Financial Analyst", dept: "Finance", pass: "Arjun@123" },
];

export default function LoginScreen({ onLoginSuccess }) {
  const [employeeId, setEmployeeId] = useState("EMP001");
  const [password, setPassword] = useState("Rahul@123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!employeeId.trim() || !password.trim()) {
      setError("Please enter both Employee ID and password.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const { user } = await login(employeeId, password);
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = (demo) => {
    setEmployeeId(demo.id);
    setPassword(demo.pass);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Subtle background ambient lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-blue-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[300px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 shadow-xl shadow-blue-500/20 mb-4 ring-1 ring-white/20">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Employee AI Assistant
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Secure Employee Portal with JWT Authentication
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#161b22]/90 border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-red-400 text-xs animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Employee ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP001"
                  required
                  className="w-full bg-[#0d1117] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-[#0d1117] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test Accounts */}
          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <div className="flex items-center gap-1.5 mb-3 text-slate-400 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Demo Accounts (Click to Fill)</span>
            </div>

            <div className="space-y-2">
              {DEMO_CREDENTIALS.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => handleQuickSelect(demo)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    employeeId === demo.id
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                      : "bg-[#0d1117]/60 border-white/[0.05] hover:bg-white/[0.03] text-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-200">{demo.id}</span>
                      <span className="text-xs text-slate-400">• {demo.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{demo.role} ({demo.dept})</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-400">
                    {demo.pass}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-600 mt-6">
          Tokens expire in 8 hours • Secure Bearer JWT verification on all assistant APIs
        </p>
      </div>
    </div>
  );
}
