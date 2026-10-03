import api from "./api";

export const getJobs = (filters = {}) => api.get("/jobs", { params: filters }).then((r) => r.data);
export const getJob = (id) => api.get(`/jobs/${id}`).then((r) => r.data);
export const applyToJob = (id) => api.post(`/jobs/${id}/apply`).then((r) => r.data);
export const createJob = (job) => api.post("/jobs", job).then((r) => r.data);
export const getMyJobs = () => api.get("/jobs/mine").then((r) => r.data);
