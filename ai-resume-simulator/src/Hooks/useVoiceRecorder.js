import { useRef, useState, useCallback, useEffect } from "react";

/**
 * useVoiceRecorder
 * ------------------------------------------------------------------
 * Wraps the browser MediaRecorder + Web Audio APIs so components don't
 * have to deal with getUserMedia, permission errors, or audio metering
 * directly.
 *
 * Usage:
 *   const {
 *     isRecording, isSupported, error, audioLevels,
 *     start, stop, reset,
 *   } = useVoiceRecorder({
 *     onChunk: (blob) => sendToBackend(blob),   // fires every `chunkMs`
 *     onStop: (blob) => sendFinalToBackend(blob), // full recording
 *     chunkMs: 3000,        // omit/0 to disable streaming chunks
 *     maxDurationMs: 60000, // auto-stop safety net (pair with Task 6 timer)
 *   });
 */
export function useVoiceRecorder({
  onChunk,
  onStop,
  chunkMs = 0,
  maxDurationMs = null,
} = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  // 12 bars, 0-1 range, driven by the analyser for the waveform UI
  const [audioLevels, setAudioLevels] = useState(new Array(12).fill(0.05));

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const chunksRef = useRef([]);
  const maxDurationTimerRef = useRef(null);

  const isSupported =
    typeof window !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window.MediaRecorder !== "undefined";

  const stopMetering = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const meter = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    // Collapse the FFT bins into 12 bars for a simple waveform display
    const bars = 12;
    const bucket = Math.floor(data.length / bars) || 1;
    const next = new Array(bars).fill(0).map((_, i) => {
      let sum = 0;
      for (let j = i * bucket; j < i * bucket + bucket; j++) sum += data[j] || 0;
      const avg = sum / bucket / 255; // 0-1
      return Math.max(0.05, avg);
    });
    setAudioLevels(next);
    rafRef.current = requestAnimationFrame(meter);
  }, []);

  const cleanupStream = useCallback(() => {
    stopMetering();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    if (maxDurationTimerRef.current) clearTimeout(maxDurationTimerRef.current);
    maxDurationTimerRef.current = null;
  }, [stopMetering]);

  const start = useCallback(async () => {
    setError(null);

    if (!isSupported) {
      setError("Voice recording isn't supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // --- audio metering for the waveform ---
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      rafRef.current = requestAnimationFrame(meter);

      // --- recording ---
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
          if (chunkMs > 0) onChunk?.(e.data, false);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        onStop?.(finalBlob);
        cleanupStream();
      };

      recorder.onerror = () => {
        setError("Recording failed unexpectedly. Please try again.");
        cleanupStream();
        setIsRecording(false);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(chunkMs > 0 ? chunkMs : undefined);
      setIsRecording(true);

      if (maxDurationMs) {
        maxDurationTimerRef.current = setTimeout(() => stop(), maxDurationMs);
      }
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError(
          "Microphone access was denied. Please allow microphone permission in your browser settings and try again."
        );
      } else if (err.name === "NotFoundError") {
        setError("No microphone was found on this device.");
      } else {
        setError("Couldn't start the microphone. Please try again.");
      }
      cleanupStream();
      setIsRecording(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, chunkMs, maxDurationMs, meter, onChunk, onStop, cleanupStream]);

  const stop = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      cleanupStream();
    }
    setIsRecording(false);
  }, [cleanupStream]);

  const reset = useCallback(() => {
    setError(null);
    setAudioLevels(new Array(12).fill(0.05));
  }, []);

  // Safety: release the mic if the component unmounts mid-recording
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state !== "inactive") {
        mediaRecorderRef.current?.stop();
      }
      cleanupStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isRecording, isSupported, error, audioLevels, start, stop, reset };
}
