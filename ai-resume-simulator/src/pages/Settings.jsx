import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../Hooks/useAuth"
import { getNotificationPreferences, updateNotificationPreferences, updatePassword } from "../Services/settingsService"

const DEFAULT_PREFERENCES = { email: true, in_app: true, interview_updates: true }

function normalizePreferences(data) {
  return {
    email: data.email ?? data.email_enabled ?? DEFAULT_PREFERENCES.email,
    in_app: data.in_app ?? data.in_app_enabled ?? DEFAULT_PREFERENCES.in_app,
    interview_updates: data.interview_updates ?? DEFAULT_PREFERENCES.interview_updates,
  }
}

export default function Settings() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)
  const [preferencesLoading, setPreferencesLoading] = useState(true)
  const [preferencesSaving, setPreferencesSaving] = useState(false)
  const [preferencesError, setPreferencesError] = useState("")
  const [preferencesMessage, setPreferencesMessage] = useState("")
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")

  async function loadPreferences() {
    setPreferencesLoading(true)
    setPreferencesError("")
    try {
      const data = await getNotificationPreferences()
      setPreferences(normalizePreferences(data))
    } catch (error) {
      setPreferencesError(error.message || "Unable to load notification preferences.")
    } finally {
      setPreferencesLoading(false)
    }
  }

  useEffect(() => {
    let isCurrent = true
    getNotificationPreferences()
      .then((data) => {
        if (isCurrent) setPreferences(normalizePreferences(data))
      })
      .catch((error) => {
        if (isCurrent) setPreferencesError(error.message || "Unable to load notification preferences.")
      })
      .finally(() => {
        if (isCurrent) setPreferencesLoading(false)
      })
    return () => { isCurrent = false }
  }, [])

  function setPreference(key, value) {
    setPreferences((current) => ({ ...current, [key]: value }))
    setPreferencesMessage("")
  }

  async function savePreferences(event) {
    event.preventDefault()
    setPreferencesSaving(true)
    setPreferencesError("")
    setPreferencesMessage("")
    try {
      await updateNotificationPreferences(preferences)
      setPreferencesMessage("Notification preferences saved.")
    } catch (error) {
      setPreferencesError(error.message || "Unable to save notification preferences.")
    } finally {
      setPreferencesSaving(false)
    }
  }

  async function changePassword(event) {
    event.preventDefault()
    setPasswordError("")
    setPasswordMessage("")
    if (passwords.next.length < 8) {
      setPasswordError("Use at least 8 characters for your new password.")
      return
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError("The new passwords do not match.")
      return
    }

    setPasswordSaving(true)
    try {
      await updatePassword(passwords.current, passwords.next)
      setPasswords({ current: "", next: "", confirm: "" })
      setPasswordMessage("Password changed successfully.")
    } catch (error) {
      setPasswordError(error.message || "Unable to change your password.")
    } finally {
      setPasswordSaving(false)
    }
  }

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-7 border-b border-slate-200 pb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Account</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">Manage your security and notification preferences.</p>
      </div>

      <section aria-labelledby="password-heading" className="border-b border-slate-200 pb-8">
        <h2 id="password-heading" className="text-base font-semibold text-slate-900">Change password</h2>
        <p className="mt-1 text-sm text-slate-600">Choose a strong password you don’t use elsewhere.</p>
        {passwordError && <p role="alert" className="mt-4 rounded-sm bg-rose-50 p-3 text-sm text-rose-800">{passwordError}</p>}
        {passwordMessage && <p role="status" className="mt-4 rounded-sm bg-emerald-50 p-3 text-sm text-emerald-900">{passwordMessage}</p>}
        <form onSubmit={changePassword} className="mt-5 grid gap-4 sm:max-w-xl">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">Current password
            <input required autoComplete="current-password" type="password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} className="rounded-sm border border-slate-300 bg-white px-3 py-2.5 font-normal focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">New password
            <input required minLength={8} autoComplete="new-password" type="password" value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} className="rounded-sm border border-slate-300 bg-white px-3 py-2.5 font-normal focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">Confirm new password
            <input required minLength={8} autoComplete="new-password" type="password" value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} className="rounded-sm border border-slate-300 bg-white px-3 py-2.5 font-normal focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
          </label>
          <div><button disabled={passwordSaving} className="rounded-sm bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60">{passwordSaving ? "Updating..." : "Update password"}</button></div>
        </form>
      </section>

      <section aria-labelledby="notifications-heading" className="border-b border-slate-200 py-8">
        <h2 id="notifications-heading" className="text-base font-semibold text-slate-900">Notification preferences</h2>
        <p className="mt-1 text-sm text-slate-600">Choose which hiring updates you receive.</p>
        {preferencesError && <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-sm bg-rose-50 p-3 text-sm text-rose-800"><span>{preferencesError}</span><button type="button" onClick={loadPreferences} disabled={preferencesLoading} className="font-semibold underline disabled:opacity-50">Retry</button></div>}
        {preferencesMessage && <p role="status" className="mt-4 rounded-sm bg-emerald-50 p-3 text-sm text-emerald-900">{preferencesMessage}</p>}
        {preferencesLoading ? <p role="status" className="mt-5 text-sm text-slate-500">Loading preferences...</p> : (
          <form onSubmit={savePreferences} className="mt-5">
            <div className="divide-y divide-slate-100 border-y border-slate-200">
              {[
                ["email", "Email notifications", "Receive hiring activity by email."],
                ["in_app", "In-app notifications", "Show status updates in the notification menu."],
                ["interview_updates", "Interview updates", "Get notified when interviews are scheduled or changed."],
              ].map(([key, title, description]) => (
                <label key={key} className="flex cursor-pointer items-center justify-between gap-4 py-4">
                  <span><span className="block text-sm font-medium text-slate-800">{title}</span><span className="mt-0.5 block text-sm text-slate-500">{description}</span></span>
                  <input type="checkbox" checked={Boolean(preferences[key])} onChange={(event) => setPreference(key, event.target.checked)} className="size-4 shrink-0 accent-emerald-800" />
                </label>
              ))}
            </div>
            <button disabled={preferencesSaving} className="mt-5 rounded-sm bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-60">{preferencesSaving ? "Saving..." : "Save preferences"}</button>
          </form>
        )}
      </section>

      <section aria-labelledby="session-heading" className="py-8">
        <h2 id="session-heading" className="text-base font-semibold text-slate-900">Session</h2>
        <p className="mt-1 text-sm text-slate-600">Sign out of this account on this device.</p>
        <button type="button" onClick={handleLogout} className="mt-4 rounded-sm border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Log out</button>
      </section>
    </div>
  )
}
