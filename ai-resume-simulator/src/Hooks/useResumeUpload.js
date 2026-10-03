import { useCallback, useState } from "react";

/**
 * useResumeUpload
 * ------------------------------------------------------------------
 * Drives the whole upload → parsing → preview flow so the page
 * component only has to render whatever `status` currently is.
 *
 * status: "idle" | "uploading" | "parsing" | "preview" | "error"
 *
 * `onUpload(file, onProgress)` must return a Promise that resolves
 * with the parsed resume data (name, skills, experience, education)
 * once the backend/AI team's parser is done. Call `onProgress(pct)`
 * as the upload progresses (0-100). Once progress hits 100 but the
 * promise hasn't resolved yet, the hook automatically flips the
 * status to "parsing" so the UI can show "Parsing your resume...".
 *
 * If you don't pass `onUpload`, a mock implementation is used so the
 * page is fully testable before the backend endpoint exists.
 */
const DEFAULT_MAX_SIZE_MB = 5;

function mockUpload(file, onProgress) {
  return new Promise((resolve) => {
    let pct = 0;
    const timer = setInterval(() => {
      pct += 10;
      onProgress(Math.min(pct, 100));
      if (pct >= 100) {
        clearInterval(timer);
        // simulate the backend taking a moment to parse after upload finishes
        setTimeout(() => {
          resolve({
            name: "Jordan Lee",
            skills: ["React", "Node.js", "Python", "SQL"],
            experience: "3 years",
            education: "B.Tech, Computer Science",
          });
        }, 1400);
      }
    }, 150);
  });
}

export function useResumeUpload({
  onUpload = mockUpload,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
} = {}) {
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState("");
  const [parsedData, setParsedData] = useState(null);

  const validate = useCallback(
    (file) => {
      if (!file) return "No file selected.";
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) return "Only PDF files are accepted.";
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        return `File is too large. Max size is ${maxSizeMB}MB.`;
      }
      return null;
    },
    [maxSizeMB]
  );

  const upload = useCallback(
    async (file) => {
      const validationError = validate(file);
      if (validationError) {
        setError(validationError);
        setStatus("error");
        return;
      }

      setError(null);
      setFileName(file.name);
      setParsedData(null);
      setProgress(0);
      setStatus("uploading");

      try {
        const data = await onUpload(file, (pct) => {
          setProgress(pct);
          if (pct >= 100) setStatus("parsing");
        });
        setParsedData(data);
        setStatus("preview");
      } catch (err) {
        setError(
          err?.message ||
            "Something went wrong while uploading your resume. Please try again."
        );
        setStatus("error");
      }
    },
    [onUpload, validate]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
    setFileName("");
    setParsedData(null);
  }, []);

  return { status, progress, error, fileName, parsedData, upload, reset };
}