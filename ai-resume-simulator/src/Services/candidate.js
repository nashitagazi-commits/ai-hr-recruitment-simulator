import api from "./api";

export const getDashboard = () => api.get("/candidate/dashboard").then((r) => r.data);
export const getProfile = () => api.get("/candidate/profile").then((r) => r.data);
export const updateProfile = (data) => api.put("/candidate/profile", data).then((r) => r.data);
