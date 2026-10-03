import api from "./api";

export const loginUser = async (email, password, rememberMe = false) => {
  const res = await api.post("/auth/login", { email, password, remember_me: rememberMe });
  return res.data;
};

export const registerUser = async (name, email, password, role) => {
  const res = await api.post("/auth/signup", { name, email, password, role: String(role).toLowerCase() });
  return res.data;
};

export const signupUser = async (userData) => {
  const { name, fullName, email, password, role } = userData;
  return registerUser(name || fullName, email, password, role);
};

export const forgotPassword = async (email) => {
  const res = await api.post("/auth/forgot-password", { email });
  return res.data;
};
