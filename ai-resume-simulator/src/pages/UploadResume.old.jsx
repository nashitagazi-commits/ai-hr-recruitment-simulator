import { useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { useResumeUpload } from "../Hooks/useResumeUpload";

/**
 * UploadResume — /upload-resume
 * ------------------------------------------------------------------
 * Wire this up to the real backend by passing an `onUpload` prop:
 *
 *   const handleUpload = (file, onProgress) => new Promise((resolve, reject) => {
 *     const xhr = new XMLHttpRequest();
 *     xhr.open("POST", "/api/resume/upload");
 *     xhr.upload.onprogress = (e) => {
 *       if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
 *     };
 *     xhr.onload = () => {
 *       if (xhr.status >= 200 && xhr.status < 300) {
 *         resolve(JSON.parse(xhr.responseText)); // { name, skills, experience, education }
 *       } else {
 *         reject(new Error("Upload failed. Please try again."));
 *       }
 *     };
 *     xhr.onerror = () => reject(new Error("Network error during upload."));
 *     const formData = new FormData();
 *     formData.append("resume", file);
 *     xhr.send(formData);
 *   });
 *
 *   <UploadResume onUpload={handleUpload} onConfirm={(data) => navigate("/jobs")} />
 *
 * Until the backend endpoint exists, this renders with a built-in
 * mock upload so the whole flow (drag/drop → progress → parsing →
 * preview) is testable on its own.
 */
export default function UploadResume({ onUpload, onConfirm }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const { status, progress, error, fileName, parsedData, upload, reset } =
    useResumeUpload(onUpload ? { onUpload } : undefined);

  const handleFiles = (fileList) => {
    const file = fileList?.[0];
    if (file) upload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const isBusy = status === "uploading" || status === "parsing";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Upload your resume</h1>
        <p className="text-sm text-slate-500">
          We'll pull out your skills and experience automatically.
        </p>
      </div>

      {/* Drop zone — hidden once we have a file in flight or previewed */}
      {(status === "idle" || status === "error") && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition ${
            isDragging
              ? "border-indigo-400 bg-indigo-50"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <UploadCloud size={32} className="text-indigo-500" />
          <p className="text-sm font-medium text-slate-700">
            Drag & drop your resume here
          </p>
          <p className="text-xs text-slate-400">or</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Browse file
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <p className="text-xs text-slate-400">PDF only, up to 5MB</p>
        </div>
      )}

      {/* Validation / upload error */}
      {status === "error" && error && (
        <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Uploading / parsing */}
      {isBusy && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <FileText size={20} className="shrink-0 text-indigo-500" />
            <p className="truncate text-sm font-medium text-slate-700">{fileName}</p>
          </div>

          {status === "uploading" && (
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-slate-400">{progress}%</p>
            </div>
          )}

          {status === "parsing" && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin text-indigo-500" />
              Parsing your resume...
            </div>
          )}
        </div>
      )}

      {/* Preview after parsing completes */}
      {status === "preview" && parsedData && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2 text-emerald-600">
            <CheckCircle2 size={18} />
            <p className="text-sm font-medium">Resume parsed successfully</p>
          </div>

          <dl className="grid grid-cols-3 gap-y-3 text-sm">
            <dt className="col-span-1 text-slate-400">Name</dt>
            <dd className="col-span-2 text-slate-700">{parsedData.name}</dd>

            <dt className="col-span-1 text-slate-400">Skills</dt>
            <dd className="col-span-2 flex flex-wrap gap-1.5">
              {parsedData.skills?.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600"
                >
                  {skill}
                </span>
              ))}
            </dd>

            <dt className="col-span-1 text-slate-400">Experience</dt>
            <dd className="col-span-2 text-slate-700">{parsedData.experience}</dd>

            <dt className="col-span-1 text-slate-400">Education</dt>
            <dd className="col-span-2 text-slate-700">{parsedData.education}</dd>
          </dl>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onConfirm?.(parsedData)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Confirm & Continue
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1 text-sm text-slate-400 transition hover:text-slate-600"
            >
              <X size={14} /> Choose a different file
            </button>
          </div>
        </div>
      )}

      {/* Let the user pick a different file after an error too */}
      {status === "error" && (
        <button
          type="button"
          onClick={reset}
          className="self-start text-sm text-slate-400 transition hover:text-slate-600"
        >
          Try a different file
        </button>
      )}
    </div>
  );
}