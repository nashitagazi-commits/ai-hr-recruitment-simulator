import { useState } from "react";
import VoiceRecorder from "./VoiceRecorder";

/**
 * NOT meant to be used as-is — this is a reference for whoever builds
 * Task 6 (/interview/:candidateId) showing how VoiceRecorder plugs in.
 * Delete this file once Task 6's real chat UI wires up VoiceRecorder
 * directly, or keep it as a local storybook-style test page.
 */
export default function InterviewPageIntegrationExample() {
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micErrorMsg, setMicErrorMsg] = useState(null);

  // Example question coming from the AI/backend team
  const currentQuestion = {
    text: "Tell me about a time you handled a tight deadline.",
    audioUrl: null, // e.g. "https://api.example.com/tts/question-3.mp3"
  };

  // --- Streaming chunks to a Whisper backend over a WebSocket ---
  // const wsRef = useRef(null);
  // useEffect(() => {
  //   const ws = new WebSocket("wss://api.example.com/transcribe");
  //   ws.onmessage = (e) => {
  //     const { text, isFinal } = JSON.parse(e.data);
  //     setLiveTranscript((prev) => (isFinal ? text : prev + text));
  //   };
  //   wsRef.current = ws;
  //   return () => ws.close();
  // }, []);
  // const handleAudioChunk = (blob) => wsRef.current?.send(blob);

  const handleAudioChunk = (blob) => {
    // Replace with real streaming call once the AI team's Whisper
    // endpoint is ready. For now, just log so you can see it firing.
    console.log("audio chunk ready to stream", blob);
  };

  const handleRecordingComplete = async (blob) => {
    setIsTranscribing(true);
    try {
      // const formData = new FormData();
      // formData.append("audio", blob, "answer.webm");
      // const res = await fetch(`/api/interview/${candidateId}/answer`, {
      //   method: "POST",
      //   body: formData,
      // });
      // const { transcript } = await res.json();
      // setLiveTranscript(transcript);

      // --- mock response so the page is testable before backend is ready ---
      await new Promise((r) => setTimeout(r, 800));
      setLiveTranscript(
        "This is a placeholder transcript standing in for the real Whisper response."
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      {/* Task 6's chat bubbles would render above this */}
      <div className="self-start rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2 text-sm text-slate-700">
        {currentQuestion.text}
      </div>

      <VoiceRecorder
        ttsAudioUrl={currentQuestion.audioUrl}
        transcript={liveTranscript}
        isTranscribing={isTranscribing}
        onAudioChunk={handleAudioChunk}
        onRecordingComplete={handleRecordingComplete}
        onMicError={(msg) => setMicErrorMsg(msg)}
        maxDurationMs={60000}
      />

      {micErrorMsg && (
        <p className="text-center text-xs text-rose-500">{micErrorMsg}</p>
      )}
    </div>
  );
}
