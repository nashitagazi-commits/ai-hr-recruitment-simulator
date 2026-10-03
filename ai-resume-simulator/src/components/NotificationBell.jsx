import { useEffect, useState } from "react"
import { getNotifications, markNotificationRead } from "../Services/settingsService"

function formatTime(value) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString()
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [updatingId, setUpdatingId] = useState(null)

  async function loadNotifications() {
    setLoading(true)
    setError("")
    try {
      setNotifications(await getNotifications())
    } catch (requestError) {
      setError(requestError.message || "Unable to load notifications.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isCurrent = true
    getNotifications()
      .then((items) => {
        if (isCurrent) setNotifications(items)
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.message || "Unable to load notifications.")
      })
      .finally(() => {
        if (isCurrent) setLoading(false)
      })
    return () => { isCurrent = false }
  }, [])

  async function handleMarkRead(notification) {
    if (notification.read || notification.is_read) return
    setUpdatingId(notification.id)
    setError("")
    try {
      await markNotificationRead(notification.id)
      setNotifications((items) => items.map((item) => item.id === notification.id
        ? { ...item, read: true, is_read: true }
        : item))
    } catch (requestError) {
      setError(requestError.message || "Unable to update this notification.")
    } finally {
      setUpdatingId(null)
    }
  }

  const unreadCount = notifications.filter((item) => !item.read && !item.is_read).length

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={() => {
          const nextOpen = !open
          setOpen(nextOpen)
          if (nextOpen) loadNotifications()
        }}
        className="relative grid size-10 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
        </svg>
        {unreadCount > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-rose-600" />}
      </button>

      {open && (
        <section aria-label="Notifications" className="absolute right-0 top-12 z-30 w-[min(22rem,calc(100vw-2rem))] border border-slate-200 bg-white shadow-xl">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
            <button type="button" onClick={loadNotifications} disabled={loading} className="text-xs font-medium text-emerald-800 hover:underline disabled:opacity-50">
              Refresh
            </button>
          </header>
          {error && <p role="alert" className="mx-4 mt-3 rounded-sm bg-rose-50 p-2 text-xs text-rose-800">{error}</p>}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p role="status" className="px-4 py-6 text-sm text-slate-500">Loading notifications...</p>
            ) : notifications.length === 0 && !error ? (
              <p className="px-4 py-6 text-sm text-slate-500">You're all caught up.</p>
            ) : (
              notifications.map((notification) => {
                const read = notification.read || notification.is_read
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleMarkRead(notification)}
                    disabled={read || updatingId === notification.id}
                    className={`block w-full border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50 disabled:cursor-default ${read ? "" : "bg-emerald-50/50"}`}
                  >
                    <span className="flex items-start gap-2">
                      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${read ? "bg-slate-300" : "bg-emerald-700"}`} />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-900">{notification.title || notification.message || "Status update"}</span>
                        {notification.title && notification.message && <span className="mt-1 block text-xs leading-5 text-slate-600">{notification.message}</span>}
                        <span className="mt-1 block text-[11px] text-slate-500">{formatTime(notification.created_at || notification.createdAt)}</span>
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </section>
      )}
    </div>
  )
}
