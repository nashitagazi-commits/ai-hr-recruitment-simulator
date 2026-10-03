import axios from "axios";

const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL) ||
  "http://localhost:8000";

const api = axios.create({ baseURL: `${BASE_URL}/api` });

// attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// token expired/invalid -> back to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthCall = err.config?.url?.includes("/auth/login") || err.config?.url?.includes("/auth/signup");
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// turn any error into a readable message for your Toast / error states
export function getErrorMessage(err) {
  const d = err.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((e) => e.msg.replace("Value error, ", "")).join(", ");
  if (err.code === "ERR_NETWORK") return "Cannot reach server. Is the backend running?";
  return "Something went wrong. Please try again.";
}

export default api;
