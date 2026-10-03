import { createContext, useState } from "react"

export const AuthContext = createContext(null)

function readStoredAuth() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token")
  const userStorage = localStorage.getItem("user") ? localStorage : sessionStorage
  const storedUser = userStorage.getItem("user")

  if (!token || !storedUser) {
    localStorage.removeItem("token")
    sessionStorage.removeItem("token")
    return null
  }

  try {
    return { token, user: JSON.parse(storedUser) }
  } catch {
    localStorage.removeItem("token")
    sessionStorage.removeItem("token")
    userStorage.removeItem("user")
    return null
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth)

  const login = (user, token, rememberMe) => {
    const storage = rememberMe ? localStorage : sessionStorage
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    sessionStorage.removeItem("user")
    sessionStorage.removeItem("token")
    storage.setItem("user", JSON.stringify(user))
    localStorage.setItem("token", token)
    setAuth({ user, token })
  }

  const logout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    sessionStorage.removeItem("user")
    sessionStorage.removeItem("token")
    setAuth(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user: auth?.user ?? null,
        token: auth?.token ?? null,
        isAuthenticated: Boolean(auth?.user && auth?.token),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}