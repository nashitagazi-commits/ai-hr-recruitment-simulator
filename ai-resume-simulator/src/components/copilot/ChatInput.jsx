// src/components/copilot/ChatInput.jsx
import { useState } from "react";

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-slate-200 bg-white p-3 sm:p-4">
      <textarea
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='Ask e.g. "Show me top 5 Python candidates"'
        aria-label="Message HR Copilot"
        className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="h-11 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Send
      </button>
    </div>
  );
}
