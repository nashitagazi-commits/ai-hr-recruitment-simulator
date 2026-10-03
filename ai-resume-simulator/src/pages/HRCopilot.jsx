// src/pages/HRCopilot.jsx  ->  route: /hr-copilot  (recruiter only)
// Height uses --navbar-height (default 0). When Navbar is built, set it in index.css, e.g. :root { --navbar-height: 4rem; }
import { useNavigate } from "react-router-dom";
import useCopilotChat from "../Hooks/useCopilotChat";
import FilterChips from "../components/copilot/FilterChips";
import ChatWindow from "../components/copilot/ChatWindow";
import ChatInput from "../components/copilot/ChatInput";

export default function HRCopilot() {
  const navigate = useNavigate();
  const { messages, filters, isLoading, send, retry, clearChat, toggleFilter, clearFilters } = useCopilotChat();

  // Task 8 owns the detail panel; adjust this target once their route/query param is final.
  const handleViewCandidate = (candidate) => navigate(`/recruiter-dashboard?candidate=${candidate.id}`);

  return (
    <div className="mx-auto flex h-[calc(100dvh-7rem)] min-h-[520px] w-full max-w-4xl flex-col overflow-hidden bg-white sm:border-x sm:border-slate-200">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">HR Copilot</h1>
          <p className="text-xs text-slate-500">Search and rank candidates in natural language</p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            Clear chat
          </button>
        )}
      </header>

      <FilterChips filters={filters} onToggle={toggleFilter} onClear={clearFilters} />

      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        onSend={send}
        onRetry={retry}
        onViewCandidate={handleViewCandidate}
      />

      <ChatInput onSend={send} disabled={isLoading} />
    </div>
  );
}
