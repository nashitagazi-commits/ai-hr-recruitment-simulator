import api from "./api";

// onProgress receives 0-100 -> feeds the progress bar
export const uploadResume = (file, onProgress) => {
  const form = new FormData();
  form.append("file", file); // field name MUST be "file"
  return api
    .post("/resume/upload", form, {
      onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded * 100) / e.total)),
    })
    .then((r) => r.data); // { resume_id, parsed: {name, skills, experience, education, experience_years} }
};

export const confirmResume = (resumeId, edits) => api.post(`/resume/${resumeId}/confirm`, edits || null).then((r) => r.data);
export const getMyResume = () => api.get("/resume/me").then((r) => r.data);
