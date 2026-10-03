import api from "./api";

// filters: { skill, min_score, location }  -> from your filter chips
export const askCopilot = (message, filters = {}) => api.post("/copilot/query", { message, filters }).then((r) => r.data);
// returns { reply: "...", candidates: [{application_id, name, score, skills, location}] }
