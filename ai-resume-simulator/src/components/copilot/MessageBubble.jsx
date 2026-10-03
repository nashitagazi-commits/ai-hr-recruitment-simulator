// src/components/copilot/MessageBubble.jsx
import CandidateCard from "./CandidateCard";

const formatTime = (ts) =>
  ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

export default function MessageBubble({ message, onRetry, onViewCandidate }) {
  const isUser = message.role === "user";
  const candidates = message.candidates || [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[92%] flex-col gap-2 sm:max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
            isUser
              ? "rounded-br-sm bg-primary-600 text-white"
              : message.error
              ? "rounded-bl-sm border border-rose-200 bg-rose-50 text-rose-800"
              : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"
          }`}
        >
          {message.content}
          {message.error && (
            <button
              type="button"
              onClick={() => onRetry(message)}
              className="mt-2 block text-xs font-semibold text-rose-700 underline hover:text-rose-900"
            >
              Try again
            </button>
          )}
        </div>

        {candidates.length > 0 && (
          <div className="grid w-full gap-3 sm:grid-cols-2">
            {candidates.map((c, i) => (
              <CandidateCard key={c.id ?? i} candidate={c} rank={i + 1} onView={onViewCandidate} />
            ))}
          </div>
        )}

        <span className="px-1 text-[11px] text-slate-400">{formatTime(message.ts)}</span>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start" role="status" aria-label="Copilot is thinking">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
            style={{ animationDelay: `${d}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
