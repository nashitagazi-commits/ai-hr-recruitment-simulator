import { Fragment, useEffect, useState } from "react"
import { getMyJobs } from "../Services/jobs"
import { getCandidates, getInterviewTranscript, setDecision } from "../Services/recruiter"
import { getErrorMessage } from "../Services/api"

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
    </div>
  )
}

export default Ranking
