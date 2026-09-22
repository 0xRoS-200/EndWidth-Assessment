const SUGGESTIONS = [
  "What is the work from home policy?",
  "How many annual leave days do I get?",
  "How many leaves do I have remaining?",
  "Apply leave from 2026-10-01 to 2026-10-03 for personal work",
  "Does the company provide pet insurance?",
  "What are the IT security guidelines?",
];

export default function WelcomeScreen({ onSuggestion }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      {/* Glowing orb */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500
                        flex items-center justify-center shadow-2xl shadow-blue-500/25">
          <span className="text-4xl">💼</span>
        </div>
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-blue-500/20
                        to-emerald-500/20 blur-xl -z-10 animate-pulse" />
      </div>

      <h2 className="text-2xl font-bold text-slate-100 mb-2">How can I help you?</h2>
      <p className="text-slate-500 text-sm max-w-sm mb-8 leading-relaxed">
        Ask about company policies, check your leave balance, or submit a leave application.
      </p>

      {/* Suggested prompts grid */}
      <div className="grid grid-cols-1 gap-2.5 w-full max-w-lg">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="w-full text-left px-4 py-3 rounded-xl text-sm text-slate-400
                       bg-[#1e2433] border border-white/[0.06]
                       hover:border-blue-500/40 hover:text-slate-200 hover:bg-[#232c40]
                       transition-all duration-150 group"
          >
            <span className="text-blue-500 mr-2 opacity-60 group-hover:opacity-100">→</span>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
