import api from "./api";

export const getNotifications = () => api.get("/notifications").then((r) => r.data); // { unread_count, items[] }
export const markAllRead = () => api.post("/notifications/read-all").then((r) => r.data);
export const markRead = (id) => api.post(`/notifications/${id}/read`).then((r) => r.data);
export const getNotifPrefs = () => api.get("/users/notification-prefs").then((r) => r.data);
export const saveNotifPrefs = (prefs) => api.put("/users/notification-prefs", prefs).then((r) => r.data);
