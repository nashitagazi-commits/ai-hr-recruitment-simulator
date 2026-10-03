import api from "./api"

// NOTE: the id passed in is the APPLICATION id (dashboard -> application.id)
export const startInterview = (applicationId) => api.post(`/interview/start/${applicationId}`).then((r) => r.data)
export const getInterview = (sessionId) => api.get(`/interview/${sessionId}`).then((r) => r.data)
export const submitAnswer = (sessionId, answer, time_taken) =>
  api.post(`/interview/${sessionId}/answer`, { answer, time_taken }).then((r) => r.data)

// voice: blob from MediaRecorder -> transcript text
export const transcribe = (blob) => {
  const form = new FormData()
  form.append("audio", blob, "answer.webm")
  return api.post("/interview/transcribe", form).then((r) => r.data.text)
}

// returns an object URL to play, or null (backend TTS not configured yet)
export const getQuestionAudio = async (sessionId, index) => {
  try {
    const res = await api.get(`/interview/${sessionId}/question/${index}/audio`, { responseType: "blob" })
    return URL.createObjectURL(res.data)
  } catch {
    return null
  }
}

export const speakFallback = (text) => {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
}
