import api from "./api";

export const getCandidates = (jobId, filters = {}) =>
  api.get(`/recruiter/jobs/${jobId}/candidates`, { params: filters }).then((r) => r.data);
export const getCandidateDetail = (applicationId) => api.get(`/recruiter/applications/${applicationId}`).then((r) => r.data);
export const getInterviewTranscript = (applicationId) =>
  api.get(`/recruiter/applications/${applicationId}/interview`).then((r) => r.data);
export const compareCandidates = (ids) => api.get("/recruiter/compare", { params: { ids: ids.join(",") } }).then((r) => r.data);
export const setDecision = (applicationId, decision) =>
  api.post(`/recruiter/applications/${applicationId}/decision`, { decision }).then((r) => r.data);

export const exportCsv = async (jobId) => {
  const res = await api.get(`/recruiter/jobs/${jobId}/export`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `candidates_job_${jobId}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
