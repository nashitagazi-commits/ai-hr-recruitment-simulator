import { apiRequest } from "./apiClient"

// Same function name/arguments as before, so HRCopilot.jsx needs no change.
// Backend contract: POST /api/copilot/query  { message, filters: { skill, min_score, location } }
export async function sendCopilotQuery({ query, filters = {}, signal }) {
  const skills = filters.skills || []
  const hasScore = filters.minScore !== null && filters.minScore !== undefined && filters.minScore !== ""
  const body = {
    message: [query, ...skills].join(" ").trim(),
    filters: {
      ...(skills[0] && { skill: skills[0] }),
      ...(hasScore && { min_score: Number(filters.minScore) }),
      ...(filters.location && { location: filters.location }),
    },
  }

  const data = await apiRequest("/api/copilot/query", { method: "POST", body, signal })

  return {
    reply: data?.reply ?? "",
    candidates: (data?.candidates ?? []).map((c) => ({
      id: c.application_id,
      name: c.name,
      score: Math.round(c.score ?? 0),
      skills: c.skills || [],
      location: c.location || "-",
      experience_years: c.experience_years ?? 0,
      summary: c.summary || "",
    })),
  }
}
