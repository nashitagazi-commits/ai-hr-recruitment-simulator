import { useEffect, useRef, useState } from "react";
import { Mic, Square, Play, Pause, AlertCircle, Loader2 } from "lucide-react";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";

/**
 * VoiceRecorder
 * ------------------------------------------------------------------
 * Drop this inside the Interview page (Task 6). It owns everything
 * audio-related: recording, waveform, TTS playback of the AI's
 * question, and rendering the live transcript as it streams in.
 *
 * It does NOT own the WebSocket/HTTP connection to the backend -
 * that stays with whoever wires up the interview page, so plug your
 * Whisper/TTS endpoints in through the props below.
 *
 * Props
 * ------------------------------------------------------------------
 * ttsAudioUrl      string   URL of the AI's spoken question (TTS output).
 * autoPlayTts      bool     Auto-play the question when the URL changes.
 * transcript       string   Live/near-live transcript text from the backend
 *                            (append as Whisper chunks arrive; component
 *                            just renders whatever you pass in).
 * isTranscribing   bool     Show a "transcribing…" indicator after stop.
 * disabled         bool     Disable the mic (e.g. while the AI is talking).
 * maxDurationMs    number   Auto-stop safety net, e.g. 60000 for a 60s cap.
 * onAudioChunk(blob)        Called every `chunkIntervalMs` while recording,
 *                            for near-real-time streaming to Whisper.
 * onRecordingComplete(blob) Called once with the full recording on stop.
 * onMicError(message)       Called when a permission/device error occurs.
 *
 * Example (inside the interview chat page):
 *   <VoiceRecorder
 *     ttsAudioUrl={currentQuestion.audioUrl}
 *     transcript={liveTranscript}
 *     isTranscribing={waitingForFinalTranscript}
 *     onAudioChunk={(blob) => ws.send(blob)}
 *     onRecordingComplete={(blob) => submitAnswerAudio(candidateId, blob)}
 *   />
 */
export default function VoiceRecorder({
  ttsAudioUrl = null,
  autoPlayTts = false,
  transcript = "",
  isTranscribing = false,
  disabled = false,
  maxDurationMs = 60000,
  chunkIntervalMs = 3000,
  onAudioChunk,
  onRecordingComplete,
  onMicError,
}) {
  const audioRef = useRef(null);
  const [isPlayingTts, setIsPlayingTts] = useState(false);
  const [ttsError, setTtsError] = useState(null);

  const {
    isRecording,
    isSupported,
    error,
    audioLevels,
    start,
    stop,
    reset,
  } = useVoiceRecorder({
    chunkMs: chunkIntervalMs,
    maxDurationMs,
    onChunk: onAudioChunk,
    onStop: onRecordingComplete,
  });

  useEffect(() => {
    if (error) onMicError?.(error);
  }, [error, onMicError]);

  // Reset and optionally auto-play whenever a new question comes in
  useEffect(() => {
    setTtsError(null);
    setIsPlayingTts(false);
    reset();
    if (autoPlayTts && ttsAudioUrl && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Autoplay can be blocked by the browser; user can press Play.
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsAudioUrl]);

  const toggleTtsPlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlayingTts) {
      audio.pause();
    } else {
      audio.play().catch(() => setTtsError("Couldn't play the audio."));
    }
  };

  const handleMicClick = () => {
    if (disabled) return;
    isRecording ? stop() : start();
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* AI question playback */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <button
          type="button"
          onClick={toggleTtsPlayback}
          disabled={!ttsAudioUrl}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={isPlayingTts ? "Pause question audio" : "Play question audio"}
        >
          {isPlayingTts ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-700">AI question audio</p>
          <p className="truncate text-xs text-slate-400">
            {ttsAudioUrl ? "Tap play to hear the question again" : "No audio for this question"}
          </p>
        </div>
        {ttsAudioUrl && (
          <audio
            ref={audioRef}
            src={ttsAudioUrl}
            onPlay={() => setIsPlayingTts(true)}
            onPause={() => setIsPlayingTts(false)}
            onEnded={() => setIsPlayingTts(false)}
            onError={() => setTtsError("Couldn't load the question audio.")}
          />
        )}
      </div>
      {ttsError && (
        <p className="flex items-center gap-1 pt-2 text-xs text-amber-600">
          <AlertCircle size={12} /> {ttsError}
        </p>
      )}

      {/* Recording controls */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <button
          type="button"
          onClick={handleMicClick}
          disabled={disabled || !isSupported}
          className={`relative flex h-16 w-16 items-center justify-center rounded-full text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
            isRecording ? "bg-rose-500 hover:bg-rose-600" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
          aria-pressed={isRecording}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording && (
            <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-rose-400 opacity-60" />
          )}
          {isRecording ? <Square size={22} /> : <Mic size={24} />}
        </button>

        {/* Waveform */}
        <div className="flex h-8 items-end gap-1" aria-hidden="true">
          {audioLevels.map((level, i) => (
            <span
              key={i}
              className={`w-1.5 rounded-full transition-all duration-75 ${
                isRecording ? "bg-indigo-500" : "bg-slate-200"
              }`}
              style={{ height: `${Math.max(6, level * 32)}px` }}
            />
          ))}
        </div>

        <p className="text-xs text-slate-500">
          {!isSupported
            ? "Voice recording isn't supported in this browser."
            : isRecording
            ? "Recording… tap to stop"
            : "Tap the mic to answer"}
        </p>
      </div>

      {/* Mic / permission error */}
      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live transcription */}
      <div className="mt-4 rounded-lg bg-slate-50 p-3">
        <div className="mb-1 flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500">Transcript</span>
          {isTranscribing && (
            <Loader2 size={11} className="animate-spin text-slate-400" />
          )}
        </div>
        <p className="min-h-6 text-sm leading-relaxed text-slate-700">
          {transcript || (
            <span className="text-slate-400">
              {isRecording ? "Listening…" : "Your answer will appear here as you speak."}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
