const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "")

export async function apiRequest(path, { method = "GET", body, signal } = {}) {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token")
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
      signal,
    })
  } catch (err) {
    if (err.name === "AbortError") throw err
    throw new Error("Cannot reach server. Is the backend running?")
  }

  if (!response.ok) {
    if (response.status === 401 && !path.includes("/auth/")) {
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = "/login"
    }
    let message = `Request failed (${response.status}). Please try again.`
    try {
      const payload = await response.json()
      const d = payload.detail
      if (typeof d === "string") message = d
      else if (Array.isArray(d)) message = d.map((e) => String(e.msg || "").replace("Value error, ", "")).join(", ")
      else if (payload.message) message = payload.message
    } catch {
      // keep the status-based message when the server sends no JSON body
    }
    throw new Error(message)
  }

  if (response.status === 204) return null
  const contentType = response.headers.get("content-type") || ""
  return contentType.includes("application/json") ? response.json() : null
}
