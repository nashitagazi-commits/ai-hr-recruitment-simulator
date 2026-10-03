import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { uploadResume, confirmResume } from "../Services/resume"
import { getErrorMessage } from "../Services/api"

const MAX_MB = 5

function UploadResume() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [stage, setStage] = useState("idle") // idle | uploading | parsing | done
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState("")
  const [fileName, setFileName] = useState("")
  const [result, setResult] = useState(null)
  const [confirming, setConfirming] = useState(false)

  const validate = (file) => {
    if (!file) return "No file selected."
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    if (!isPdf) return "Only PDF files are allowed."
    if (file.size === 0) return "This file is empty."
    if (file.size > MAX_MB * 1024 * 1024) return `File is too large. Maximum size is ${MAX_MB} MB.`
    return ""
  }

  const handleFile = async (file) => {
    setError("")
    const problem = validate(file)
    if (problem) {
      setError(problem)
      return
    }
    setFileName(file.name)
    setProgress(0)
    setStage("uploading")
    try {
      const data = await uploadResume(file, (pct) => {
        setProgress(pct)
        if (pct >= 100) setStage("parsing") // file is up, server is reading it
      })
      setResult(data)
      setStage("done")
    } catch (err) {
      setError(getErrorMessage(err))
      setStage("idle")
    }
  }

  const reset = () => {
    setStage("idle")
    setResult(null)
    setProgress(0)
    setError("")
    setFileName("")
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleConfirm = async () => {
    try {
      setConfirming(true)
      setError("")
      await confirmResume(result.resume_id)
      navigate("/jobs")
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setConfirming(false)
    }
  }

  const parsed = result?.parsed || {}
  const skills = parsed.skills || []
  const education = parsed.education || []

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Upload your resume</h1>
      <p className="mt-1 text-gray-500">We'll pull out your skills and experience automatically.</p>

      {error && (
        <div role="alert" className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* STEP 1: choose file */}
      {stage === "idle" && (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFile(e.dataTransfer.files?.[0])
          }}
          className={`mt-6 flex flex-col items-center rounded-xl border-2 border-dashed p-10 text-center ${
            dragOver ? "border-indigo-500 bg-indigo-50" : "border-gray-300 bg-white"
          }`}
        >
          <p className="text-gray-700">Drag and drop your PDF resume here</p>
          <p className="my-2 text-sm text-gray-400">or</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700"
          >
            Browse file
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <p className="mt-3 text-xs text-gray-400">PDF only, up to {MAX_MB} MB</p>
        </div>
      )}

      {/* STEP 2: uploading */}
      {stage === "uploading" && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-700">Uploading {fileName}</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="h-2 rounded-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-gray-500">{progress}%</p>
        </div>
      )}

      {/* STEP 3: parsing */}
      {stage === "parsing" && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-gray-700">Parsing your resume...</p>
        </div>
      )}

      {/* STEP 4: preview */}
      {stage === "done" && result && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <p className="font-semibold text-green-600">Resume parsed successfully</p>

          <dl className="mt-5 space-y-4 text-sm">
            <div className="grid grid-cols-3 gap-4">
              <dt className="text-gray-500">Name</dt>
              <dd className="col-span-2 text-gray-900">{parsed.name || "Not found"}</dd>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <dt className="text-gray-500">Skills</dt>
              <dd className="col-span-2 flex flex-wrap gap-2">
                {skills.length ? (
                  skills.map((s) => (
                    <span key={s} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">No known skills found</span>
                )}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <dt className="text-gray-500">Experience</dt>
              <dd className="col-span-2 text-gray-900">
                {parsed.experience_years ? `${parsed.experience_years} years` : "Not found"}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <dt className="text-gray-500">Education</dt>
              <dd className="col-span-2 text-gray-900">
                {education.length ? education.map((e, i) => <p key={i}>{e}</p>) : "Not found"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex items-center gap-4">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {confirming ? "Saving..." : "Confirm & Continue"}
            </button>
            <button type="button" onClick={reset} className="text-sm text-gray-500 hover:text-gray-700">
              Choose a different file
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadResume
