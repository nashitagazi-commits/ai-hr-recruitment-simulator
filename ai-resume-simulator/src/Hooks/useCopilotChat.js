// src/hooks/useCopilotChat.js
import { useCallback, useEffect, useRef, useState } from "react";
import { sendCopilotQuery } from "../Services/copilotService";

const STORAGE_KEY = "hr-copilot-chat";
export const EMPTY_FILTERS = { skills: [], minScore: null, location: null };

const loadMessages = () => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

let idCounter = Date.now();
const nextId = () => ++idCounter;

export default function useCopilotChat() {
  const [messages, setMessages] = useState(loadMessages);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef(null);

  // Keep chat history for the whole browser session
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* storage unavailable - ignore */
    }
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (text) => {
      const query = text.trim();
      if (!query || isLoading) return;

      const userMsg = { id: nextId(), role: "user", content: query, ts: Date.now() };
      const history = messages
        .filter((m) => !m.error)
        .slice(-10)
        .map(({ role, content }) => ({ role, content }));

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const { reply, candidates } = await sendCopilotQuery({
          query,
          filters,
          history,
          signal: controller.signal,
        });
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "assistant", content: reply, candidates, ts: Date.now() },
        ]);
      } catch (err) {
        if (err.name === "AbortError") return;
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            error: true,
            retryText: query,
            content: err.message || "Something went wrong.",
            ts: Date.now(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, filters, isLoading]
  );

  const retry = useCallback(
    (errorMsg) => {
      // drop the failed reply and the user message before it, then resend
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === errorMsg.id);
        return prev.filter((_, i) => i !== idx && i !== idx - 1);
      });
      setTimeout(() => send(errorMsg.retryText), 0);
    },
    [send]
  );

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setIsLoading(false);
  }, []);

  // group: "skills" (multi-select) | "minScore" | "location" (single-select, click again to unset)
  const toggleFilter = useCallback((group, value) => {
    setFilters((prev) => {
      if (group === "skills") {
        const has = prev.skills.includes(value);
        return { ...prev, skills: has ? prev.skills.filter((s) => s !== value) : [...prev.skills, value] };
      }
      return { ...prev, [group]: prev[group] === value ? null : value };
    });
  }, []);

  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  return { messages, filters, isLoading, send, retry, clearChat, toggleFilter, clearFilters };
}
