import api from "./api"

// kept so old imports of mockJobs do not crash; real data now comes from the backend
export const mockJobs = []

function mapJob(j) {
  return {
    id: j.id,
    title: j.title,
    company: j.company,
    location: j.location,
    skills: j.skills || [],
    matchScore: Math.round(j.match_percent || 0),
    description: j.description || "",
    requirements: j.requirements || [],
    roleType: j.role_type,
    applied: !!j.applied,
  }
}

// filters (optional): { search, role, location, skill }
export async function getJobs(filters = {}) {
  const res = await api.get("/jobs", { params: filters })
  return res.data.map(mapJob)
}

export async function getJobById(id) {
  try {
    const res = await api.get(`/jobs/${id}`)
    return mapJob(res.data)
  } catch (err) {
    if (err.response?.status === 404) return null
    throw err
  }
}

// returns { application_id, match_percent, status }
export async function applyToJob(id) {
  const res = await api.post(`/jobs/${id}/apply`)
  return res.data
}

// recruiter only — creates a new job posting
export async function createJob(jobData) {
  const res = await api.post("/jobs", jobData)
  return mapJob(res.data)
}

// recruiter only — jobs they've posted
export async function getMyJobs() {
  const res = await api.get("/jobs/mine")
  return res.data.map(mapJob)
}