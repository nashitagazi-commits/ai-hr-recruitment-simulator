import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { createJob } from "../Services/jobsService"

function PostJob() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "Remote",
    role_type: "Full-time",
    description: "",
    requirements: "",
    skills: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!formData.title || !formData.company || !formData.description) {
      setError("Please fill in title, company, and description")
      return
    }

    const payload = {
      title: formData.title,
      company: formData.company,
      location: formData.location || "Remote",
      role_type: formData.role_type || "Full-time",
      description: formData.description,
      requirements: formData.requirements
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean),
      skills: formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    }

    try {
      setLoading(true)
      await createJob(payload)
      setSuccess(true)
      setTimeout(() => navigate("/recruiter-dashboard"), 1200)
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to post job. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-lg">

        <h1 className="text-3xl font-bold text-center">Post a New Job</h1>
        <p className="mt-2 text-center text-gray-500">This job will appear on every candidate's Jobs page</p>

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
        {success && (
          <div className="mt-6 rounded-lg bg-green-50 p-3 text-sm text-green-600">
            Job posted successfully! Redirecting to dashboard...
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700">Job Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. React Frontend Developer"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company *</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="e.g. TechNova"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Hyderabad or Remote"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role Type</label>
            <select
              name="role_type"
              value={formData.role_type}
              onChange={handleChange}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Internship</option>
              <option>Contract</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Skills Required</label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g. React, Tailwind, JavaScript (comma separated)"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Requirements</label>
            <input
              type="text"
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="e.g. 2+ years experience, Bachelor's degree (comma separated)"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Job Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Posting..." : "Post Job"}
          </button>

        </form>
      </div>
    </div>
  )
}

export default PostJob