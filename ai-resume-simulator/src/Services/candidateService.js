import api from "./api"

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "")

function mapProfile(p) {
  return {
    id: p.id,
    name: p.name || "",
    email: p.email || "",
    phone: p.phone || "",
    location: p.location || "",
    skills: p.skills || [],
    resumeName: p.resume?.filename || "",
    overallMatchScore: Math.round(p.overall_match_score || 0),
  }
}

export async function getCandidateProfile() {
  const res = await api.get("/candidate/profile")
  return mapProfile(res.data)
}

// Same shape the dashboard already expects; status is "Applied" | "Screened" | "Interviewed" | "Result"
export async function getCandidateApplications() {
  const res = await api.get("/candidate/dashboard")
  return (res.data.applications || []).map((a) => ({
    id: a.application_id,
    jobId: String(a.job_id),
    title: a.job_title,
    company: a.company,
    location: a.location || "",
    matchScore: Math.round(a.match_percent || 0),
    aiScore: a.ai_score,
    decision: a.decision,
    feedback: a.feedback,
    status: cap(a.status),
  }))
}

export async function updateCandidateProfile(updatedProfile) {
  const body = {
    name: updatedProfile.name,
    phone: updatedProfile.phone,
    location: updatedProfile.location,
    skills: updatedProfile.skills,
  }
  const res = await api.put("/candidate/profile", body)
  return mapProfile(res.data)
}
