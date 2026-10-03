import { apiRequest } from "./apiClient"

export async function getNotifications() {
  const data = await apiRequest("/api/notifications")
  const list = Array.isArray(data) ? data : data?.items
  return (Array.isArray(list) ? list : []).map((n) => ({
    ...n,
    title: n.title ?? n.message,
    createdAt: n.createdAt ?? n.created_at,
    read: !!n.read,
  }))
}

export function markNotificationRead(id) {
  return apiRequest(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "POST" })
}

export function markAllNotificationsRead() {
  return apiRequest("/api/notifications/read-all", { method: "POST" })
}

export async function getNotificationPreferences() {
  const data = await apiRequest("/api/users/notification-prefs")
  return data || {}
}

// Backend stores exactly three switches: email, interview, status
export function updateNotificationPreferences(preferences) {
  return apiRequest("/api/users/notification-prefs", {
    method: "PUT",
    body: {
      email: preferences?.email ?? true,
      interview: preferences?.interview ?? true,
      status: preferences?.status ?? true,
    },
  })
}

export function updatePassword(currentPassword, newPassword) {
  return apiRequest("/api/users/change-password", {
    method: "POST",
    body: { current_password: currentPassword, new_password: newPassword },
  })
}
