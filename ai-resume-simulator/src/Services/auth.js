import api from "./api";

// call after login/signup response
function saveSession({ access_token, user }, remember = true) {
  const store = remember ? localStorage : sessionStorage;
  store.setItem("token", access_token);
  localStorage.setItem("user", JSON.stringify(user));
  return user;
}

export const signup = async ({ name, email, password, role }) =>
  saveSession((await api.post("/auth/signup", { name, email, password, role })).data);

export const login = async ({ email, password, remember_me }) =>
  saveSession((await api.post("/auth/login", { email, password, remember_me })).data, remember_me);

export const logout = () => {
  localStorage.clear();
  sessionStorage.clear();
};

export const getCurrentUser = () => JSON.parse(localStorage.getItem("user") || "null");
export const isAuthenticated = () => !!(localStorage.getItem("token") || sessionStorage.getItem("token"));

// where to send the user after login
export const homeForRole = (role) => (role === "recruiter" ? "/recruiter-dashboard" : "/candidate-dashboard");

export const forgotPassword = (email) => api.post("/auth/forgot-password", { email }).then((r) => r.data);
export const resetPassword = (token, new_password) =>
  api.post("/auth/reset-password", { token, new_password }).then((r) => r.data);
export const changePassword = (current_password, new_password) =>
  api.post("/users/change-password", { current_password, new_password }).then((r) => r.data);
