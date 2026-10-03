import { useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import VoiceRecorder from "../components/VoiceRecorder"
import { startInterview, submitAnswer, transcribe, speakFallback } from "../Services/interview"
import { getErrorMessage } from "../Services/api"

// The route is /interview/:candidateId. The value in the URL is the APPLICATION id.
function Interview() {
  const { candidateId: applicationId } = useParams()

  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [timeLimit, setTimeLimit] = useState(60)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isComplete, setIsComplete] = useState(false)
  const [completeMessage, setCompleteMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [sendError, setSendError] = useState("")
  const [sending, setSending] = useState(false)

  // VOICE AI STATE
  const [liveTranscript, setLiveTranscript] = useState("")
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [micErrorMsg, setMicErrorMsg] = useState(null)

  const chatEndRef = useRef(null)
  const startedRef = useRef(false)
  const answerRef = useRef("")
  answerRef.current = answer

  // 1) start (or resume) the interview
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    startInterview(applicationId)
      .then((data) => {
        setSession(data)
        setMessages((data.messages || []).map((m) => ({ sender: m.sender, text: m.text })))
        setCurrentIndex(data.current_index || 0)
        setTimeLimit(data.time_limit || 60)
        setTimeLeft(data.time_limit || 60)
        if (data.status === "completed") {
          setCompleteMessage("You have already completed this interview.")
          setIsComplete(true)
        }
      })
      .catch((err) => setLoadError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [applicationId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 2) countdown per question
  useEffect(() => {
    if (loading || loadError || isComplete || sending) return
    if (timeLeft === 0) {
      if (!sendError) handleSend()
      return
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, loading, loadError, isComplete, sending, sendError])

  // 3) send the answer to the backend
  const handleSend = async () => {
    if (sending || isComplete || !session) return
    const text = answerRef.current.trim() || "(No answer)"
    setSending(true)
    setSendError("")
    try {
      const res = await submitAnswer(session.session_id, text, timeLimit - timeLeft)
      setMessages((prev) => [
        ...prev,
        { sender: "candidate", text },
        ...(res.next_question ? [{ sender: "ai", text: res.next_question }] : []),
      ])
      setAnswer("")
      setLiveTranscript("")
      if (res.done) {
        setCompleteMessage(res.message || "Interview complete. Thank you!")
        setIsComplete(true)
      } else {
        setCurrentIndex(res.current_index)
        setTimeLeft(timeLimit)
      }
    } catch (err) {
      setSendError(getErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  // VOICE AI HANDLERS
  const handleAudioChunk = () => {}

  const handleRecordingComplete = async (blob) => {
    setIsTranscribing(true)
    setMicErrorMsg(null)
    try {
      const text = await transcribe(blob)
      setLiveTranscript(text)
      setAnswer(text) // fills the text box so the candidate can review/edit before sending
    } catch (err) {
      setMicErrorMsg(getErrorMessage(err))
    } finally {
      setIsTranscribing(false)
    }
  }

  const lastQuestion = [...messages].reverse().find((m) => m.sender === "ai")?.text

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Preparing your interview...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg text-center">
          <h1 className="text-xl font-bold text-gray-800">Could not start the interview</h1>
          <p role="alert" className="mt-3 text-sm text-red-600">{loadError}</p>
          <div className="mt-6 flex justify-center gap-4">
            <button onClick={() => window.location.reload()} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
              Try again
            </button>
            <Link to="/candidate-dashboard" className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg text-center">
          <h1 className="text-3xl font-bold text-gray-800">Interview Complete</h1>
          <p className="mt-4 text-gray-500">
            {completeMessage || "Thank you! Your responses have been submitted for evaluation."}
          </p>
          <Link to="/candidate-dashboard" className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg flex flex-col h-[85vh]">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <span className="font-semibold text-gray-700">
            Question {currentIndex + 1} of {session?.total_questions}
          </span>
          <span className={`font-mono text-sm ${timeLeft <= 10 ? "text-red-600" : "text-gray-500"}`}>{timeLeft}s</span>
        </div>

        {/* CHAT WINDOW */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                msg.sender === "ai" ? "self-start bg-gray-100 text-gray-800" : "self-end bg-blue-600 text-white"
              }`}
            >
              {msg.text}
            </div>
          ))}
          {lastQuestion && (
            <button
              type="button"
              onClick={() => speakFallback(lastQuestion)}
              className="self-start text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Listen to question
            </button>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* VOICE RECORDER */}
        <div className="border-t border-gray-200 px-4 pt-3">
          <VoiceRecorder
            ttsAudioUrl={null}
            transcript={liveTranscript}
            isTranscribing={isTranscribing}
            onAudioChunk={handleAudioChunk}
            onRecordingComplete={handleRecordingComplete}
            onMicError={(msg) => setMicErrorMsg(msg)}
            maxDurationMs={timeLimit * 1000}
          />
          {micErrorMsg && <p className="text-center text-xs text-rose-500 mt-1">{micErrorMsg}</p>}
        </div>

        {sendError && (
          <p role="alert" className="px-4 pt-2 text-sm text-red-600">
            {sendError} Press Send to try again.
          </p>
        )}

        {/* TEXT INPUT AREA */}
        <div className="flex items-center gap-2 border-t border-gray-200 p-4">
          <input
            type="text"
            placeholder="Type your answer or use the mic above..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={sending}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Interview
