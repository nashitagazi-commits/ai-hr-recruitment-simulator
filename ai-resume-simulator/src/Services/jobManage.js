import api from "./api";

// Recruiter: edit or delete one of their own jobs
export const updateJob = (id, job) => api.put(`/jobs/${id}`, job).then((r) => r.data);
export const deleteJob = (id, force = false) => api.delete(`/jobs/${id}`, { params: { force } }).then((r) => r.data);
