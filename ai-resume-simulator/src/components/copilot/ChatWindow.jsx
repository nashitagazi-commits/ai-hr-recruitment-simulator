// src/components/copilot/ChatWindow.jsx
import { useEffect, useRef } from "react";
import MessageBubble, { TypingIndicator } from "./MessageBubble";

const SUGGESTIONS = [
  "Show me top 5 Python candidates",
  "Who are the best React developers?",
  "Candidates with score above 85",
  "Top 3 candidates in Chennai",
];

function EmptyState({ onSuggestion }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-2xl">🤖</div>
      <h2 className="text-lg font-semibold text-slate-900">Hi, I'm your HR Copilot</h2>
      <p className="mt-1 max-w-md text-sm text-slate-500">
        Ask in plain English to search candidates, filter by skill or score, and get hiring recommendations.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggestion(s)}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-primary-500 hover:text-primary-700"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatWindow({ messages, isLoading, onSend, onRetry, onViewCandidate }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-3 py-4 sm:px-6" role="log" aria-live="polite">
      {messages.length === 0 && !isLoading ? (
        <EmptyState onSuggestion={onSend} />
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} onRetry={onRetry} onViewCandidate={onViewCandidate} />
          ))}
          {isLoading && <TypingIndicator />}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
