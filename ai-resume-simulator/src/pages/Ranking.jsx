import { Fragment, useEffect, useState } from "react"
import { getMyJobs } from "../Services/jobs"
import { getCandidates, getInterviewTranscript, setDecision } from "../Services/recruiter"
import { getErrorMessage } from "../Services/api"
import { updateJob, deleteJob } from "../Services/jobManage"

const show = (n) => (n === null || n === undefined ? "-" : Math.round(n))

const DECISIONS = [
  ["shortlisted", "Pass / Shortlist", "bg-blue-600 hover:bg-blue-700"],
  ["hired", "Hire", "bg-green-600 hover:bg-green-700"],
  ["rejected", "Reject", "bg-red-600 hover:bg-red-700"],
]
const DECISION_LABEL = { shortlisted: "Shortlisted", hired: "Hired", rejected: "Rejected" }
const DECISION_STYLE = {
  shortlisted: "bg-blue-100 text-blue-700",
  hired: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
}

function CandidateDetail({ c, onDecided }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState("")
  const [msg, setMsg] = useState("")

  useEffect(() => {
    let cancelled = false
    getInterviewTranscript(c.id)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [c.id])

  const decide = async (decision) => {
    setSaving(decision)
    setMsg("")
    setError("")
    try {
      await setDecision(c.id, decision)
      onDecided(c.id, decision)
      setMsg(`Marked as ${DECISION_LABEL[decision]}. The candidate has been notified.`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving("")
    }
  }

  return (
    <div className="space-y-5 text-sm text-gray-700">
      {c.interviewed ? (
        <div className="grid grid-cols-3 gap-4">
          <div><p className="font-semibold">Technical</p><p>{show(c.technical)}/100</p></div>
          <div><p className="font-semibold">Communication</p><p>{show(c.communication)}/100</p></div>
          <div><p className="font-semibold">Confidence</p><p>{show(c.confidence)}/100</p></div>
        </div>
      ) : (
        <p className="text-gray-500">Interview not completed yet. Score shown is the resume match.</p>
      )}

      {/* DECISION */}
      <div>
        <p className="mb-2 font-semibold">
          Decision{" "}
          {c.decision && (
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${DECISION_STYLE[c.decision]}`}>
              {DECISION_LABEL[c.decision]}
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {DECISIONS.map(([value, label, color]) => (
            <button
              key={value}
              type="button"
              disabled={!!saving || c.decision === value}
              onClick={() => decide(value)}
              className={`rounded-lg px-4 py-2 font-semibold text-white disabled:opacity-50 ${color}`}
            >
              {saving === value ? "Saving..." : label}
            </button>
          ))}
        </div>
        {msg && <p role="status" className="mt-2 text-green-700">{msg}</p>}
        {error && <p role="alert" className="mt-2 text-red-600">{error}</p>}
      </div>

      {/* TRANSCRIPT */}
      <div>
        <p className="mb-2 font-semibold">Interview questions and answers</p>
        {loading && <p className="text-gray-500">Loading interview...</p>}
        {!loading && data && data.items.length === 0 && <p className="text-gray-500">No interview has been taken yet.</p>}
        {!loading && data && data.feedback && <p className="mb-2 text-gray-600">AI feedback: {data.feedback}</p>}
        <div className="space-y-3">
          {data?.items.map((item) => (
            <div key={item.index} className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="font-medium text-gray-800">Q{item.index + 1}. {item.question}</p>
              <p className="mt-1 text-gray-600">{item.answer ?? <em className="text-gray-400">Not answered yet</em>}</p>
              {item.scores && (
                <p className="mt-1 text-xs text-gray-400">
                  Technical {show(item.scores.technical)} - Communication {show(item.scores.communication)} - Confidence {show(item.scores.confidence)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const ROLE_TYPES = ["Full-time", "Part-time", "Internship", "Contract"]
const splitList = (text) => text.split(",").map((x) => x.trim()).filter(Boolean)

function JobEditModal({ job, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: job.title || "",
    company: job.company || "",
    location: job.location || "",
    role_type: job.role_type || "Full-time",
    skills: (job.skills || []).join(", "),
    requirements: (job.requirements || []).join(", "),
    description: job.description || "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const input = "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"

  const save = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.company.trim() || !form.description.trim()) {
      setError("Title, company and description are required.")
      return
    }
    setSaving(true)
    setError("")
    try {
      const saved = await updateJob(job.id, {
        title: form.title.trim(),
        company: form.company.trim(),
        location: form.location.trim() || "Remote",
        role_type: form.role_type,
        description: form.description.trim(),
        requirements: splitList(form.requirements),
        skills: splitList(form.skills).map((x) => x.toLowerCase()),
      })
      onSaved(saved)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={save} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-800">Edit job</h2>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">Job title *<input className={input} value={form.title} onChange={set("title")} /></label>
          <label className="text-sm font-medium text-gray-700">Company *<input className={input} value={form.company} onChange={set("company")} /></label>
          <label className="text-sm font-medium text-gray-700">Location<input className={input} value={form.location} onChange={set("location")} /></label>
          <label className="text-sm font-medium text-gray-700">Role type
            <select className={input} value={form.role_type} onChange={set("role_type")}>
              {ROLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>
        <label className="mt-4 block text-sm font-medium text-gray-700">Skills required (comma separated)
          <input className={input} value={form.skills} onChange={set("skills")} />
        </label>
        <label className="mt-4 block text-sm font-medium text-gray-700">Requirements (comma separated)
          <input className={input} value={form.requirements} onChange={set("requirements")} />
        </label>
        <label className="mt-4 block text-sm font-medium text-gray-700">Job description *
          <textarea rows={5} className={input} value={form.description} onChange={set("description")} />
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  )
}

function Ranking() {
  const [jobs, setJobs] = useState([])
  const [jobId, setJobId] = useState("")
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [skillFilter, setSkillFilter] = useState("")
  const [minExperience, setMinExperience] = useState("")
  const [minScore, setMinScore] = useState("")
  const [expandedId, setExpandedId] = useState(null)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState([])
  const [editingJob, setEditingJob] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [jobMsg, setJobMsg] = useState("")

  // 1) load the recruiter's jobs
  useEffect(() => {
    let cancelled = false
    getMyJobs()
      .then((list) => {
        if (cancelled) return
        setJobs(list)
        if (list.length) setJobId(String(list[0].id))
        else setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(getErrorMessage(err))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 2) load candidates for the selected job
  useEffect(() => {
    if (!jobId) return
    let cancelled = false
    const jobTitle = jobs.find((j) => String(j.id) === String(jobId))?.title || ""
    setLoading(true)
    setError("")
    getCandidates(jobId)
      .then((data) => {
        if (cancelled) return
        setCandidates(
          data.candidates.map((c) => ({
            id: c.application_id,
            name: c.name,
            role: jobTitle,
            interviewed: c.ai_score !== null && c.ai_score !== undefined,
            score: c.ai_score ?? c.match_percent ?? 0,
            technical: c.breakdown?.technical,
            communication: c.breakdown?.communication,
            confidence: c.breakdown?.confidence,
            skills: c.skills || [],
            experience: c.experience_years || 0,
            decision: c.decision,
          }))
        )
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [jobId, jobs])

  const filteredCandidates = candidates
    .filter((c) => (skillFilter ? c.skills.some((s) => s.toLowerCase().includes(skillFilter.toLowerCase())) : true))
    .filter((c) => (minExperience ? c.experience >= Number(minExperience) : true))
    .filter((c) => (minScore ? c.score >= Number(minScore) : true))
    .sort((a, b) => b.score - a.score)

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id)

  const toggleCompareSelect = (id) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((c) => c !== id))
    } else if (selectedForCompare.length < 3) {
      setSelectedForCompare([...selectedForCompare, id])
    }
  }

  const handleExportCSV = () => {
    const headers = ["Name", "Role", "Score", "Technical", "Communication", "Confidence", "Experience", "Skills"]
    const rows = filteredCandidates.map((c) => [
      c.name, c.role, show(c.score), show(c.technical), show(c.communication), show(c.confidence), c.experience, c.skills.join("; "),
    ])
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "candidate_rankings.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const selectedJob = jobs.find((j) => String(j.id) === String(jobId))

  const handleJobSaved = (saved) => {
    setJobs((prev) => prev.map((j) => (j.id === saved.id ? saved : j)))
    setEditingJob(false)
    setJobMsg("Job updated.")
  }

  const handleDeleteJob = async () => {
    if (!selectedJob || deleting) return
    if (!window.confirm(`Delete "${selectedJob.title}"? This cannot be undone.`)) return
    setDeleting(true)
    setError("")
    setJobMsg("")
    try {
      let force = false
      try {
        await deleteJob(selectedJob.id)
      } catch (err) {
        if (err.response?.status === 409) {
          if (!window.confirm(`${getErrorMessage(err)}\n\nDelete anyway?`)) return
          force = true
          await deleteJob(selectedJob.id, true)
        } else {
          throw err
        }
      }
      const remaining = jobs.filter((j) => j.id !== selectedJob.id)
      setJobs(remaining)
      setCandidates([])
      setJobId(remaining.length ? String(remaining[0].id) : "")
      if (!remaining.length) setLoading(false)
      setJobMsg(force ? "Job and its applications were deleted." : "Job deleted.")
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const compareList = candidates.filter((c) => selectedForCompare.includes(c.id))
  const colCount = compareMode ? 6 : 5

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800">Recruiter Dashboard</h1>
        <p className="mt-1 text-gray-500">Candidate ranking sorted by AI score</p>

        {error && (
          <div role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {jobMsg && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{jobMsg}</p>}

        {/* MANAGE SELECTED JOB */}
        {selectedJob && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Selected job</p>
              <p className="font-semibold text-gray-800">{selectedJob.title} <span className="font-normal text-gray-500">- {selectedJob.company}, {selectedJob.location}</span></p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditingJob(true)} className="rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-300">
                Edit job
              </button>
              <button type="button" onClick={handleDeleteJob} disabled={deleting} className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {deleting ? "Deleting..." : "Delete job"}
              </button>
            </div>
          </div>
        )}

        {/* FILTERS */}
        <div className="mt-6 flex flex-wrap gap-4 rounded-xl bg-white p-4 shadow">
          {jobs.length > 1 && (
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            placeholder="Filter by skill (e.g. React)"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Min experience (years)"
            value={minExperience}
            onChange={(e) => setMinExperience(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Min score"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          />

          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`rounded-lg px-4 py-2 font-semibold ${compareMode ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            {compareMode ? "Exit Compare Mode" : "Compare Candidates"}
          </button>

          <button
            onClick={handleExportCSV}
            className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>

        {/* COMPARE VIEW */}
        {compareMode && compareList.length > 0 && (
          <div className="mt-6 rounded-xl bg-white p-4 shadow">
            <h2 className="text-lg font-bold text-gray-800">Comparing {compareList.length} Candidates</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {compareList.map((c) => (
                <div key={c.id} className="rounded-lg border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-800">{c.name}</h3>
                  <p className="text-sm text-gray-500">{c.role}</p>
                  <p className="mt-2 text-2xl font-bold text-blue-600">{show(c.score)}</p>
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p>Technical: {show(c.technical)}</p>
                    <p>Communication: {show(c.communication)}</p>
                    <p>Confidence: {show(c.confidence)}</p>
                    <p>Experience: {c.experience} yrs</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CANDIDATE TABLE */}
        <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-sm text-gray-600">
              <tr>
                {compareMode && <th className="px-4 py-3"></th>}
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3">Skills</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((c) => (
                <Fragment key={c.id}>
                  <tr
                    onClick={() => !compareMode && toggleExpand(c.id)}
                    className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                  >
                    {compareMode && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedForCompare.includes(c.id)}
                          onChange={() => toggleCompareSelect(c.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {c.name}
                      {c.decision && (
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${DECISION_STYLE[c.decision]}`}>
                          {DECISION_LABEL[c.decision]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.role}</td>
                    <td className="px-4 py-3 font-semibold text-blue-600">
                      {show(c.score)}
                      {!c.interviewed && <span className="ml-1 text-xs font-normal text-gray-400">resume match</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.experience} yrs</td>
                    <td className="px-4 py-3 text-gray-600">{c.skills.join(", ")}</td>
                  </tr>

                  {expandedId === c.id && !compareMode && (
                    <tr className="bg-gray-50">
                      <td colSpan={colCount} className="px-4 py-4">
                        <CandidateDetail
                          c={c}
                          onDecided={(id, decision) =>
                            setCandidates((prev) => prev.map((x) => (x.id === id ? { ...x, decision } : x)))
                          }
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>

          {loading && <p className="p-6 text-center text-gray-500">Loading candidates...</p>}
          {!loading && jobs.length === 0 && !error && (
            <p className="p-6 text-center text-gray-500">You have no jobs yet. Create a job to start receiving applicants.</p>
          )}
          {!loading && jobs.length > 0 && candidates.length === 0 && !error && (
            <p className="p-6 text-center text-gray-500">No candidates have applied to this job yet.</p>
          )}
          {!loading && candidates.length > 0 && filteredCandidates.length === 0 && (
            <p className="p-6 text-center text-gray-500">No candidates match these filters.</p>
          )}
        </div>
      </div>
      {editingJob && selectedJob && (
        <JobEditModal job={selectedJob} onClose={() => setEditingJob(false)} onSaved={handleJobSaved} />
      )}
    </div>
  )
}

export default Ranking
