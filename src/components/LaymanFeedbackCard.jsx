import React from 'react';
import { BotMessageSquare, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function LaymanFeedbackCard({ feedback, missingFields = [] }) {
  if (!feedback && missingFields.length === 0) return null;

  return (
    <div className="glass-panel p-5 mt-6 border-blue-400/30 bg-gradient-to-br from-blue-900/20 to-indigo-900/10 animate-fade-in shadow-xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 p-16 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-300 relative z-10">
        <BotMessageSquare size={22} className="shrink-0" />
        AI Assistant Feedback (Simple terms)
      </h3>

      <div className="space-y-4 relative z-10 text-sm leading-relaxed text-slate-200 bg-black/20 p-4 rounded-xl border border-white/5 shadow-inner">
        {/* Render paragraphs cleanly */}
        {feedback?.split('\n').filter(Boolean).map((para, i) => (
          <p key={i} className="flex gap-2 items-start">
            <span className="text-blue-400 mt-1"><Sparkles size={14}/></span>
            {para}
          </p>
        ))}
        {!feedback && <p className="italic text-slate-500">Processing data context...</p>}
      </div>

      {missingFields.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 relative z-10 transition-colors">
          <h4 className="flex items-center gap-2 font-bold text-amber-400 text-sm mb-2">
            <AlertCircle size={16} /> Important Warning
          </h4>
          <p className="text-xs text-amber-200/80 mb-2">
            The insurance company requires the following missing fields before we can send this application. Please fill them out manually in the form above.
          </p>
          <ul className="flex flex-wrap gap-2 mt-2">
            {missingFields.map((field, idx) => (
              <li key={idx} className="bg-amber-900/40 border border-amber-500/40 px-2 py-1 rounded text-xs font-mono text-amber-300">
                {field}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
