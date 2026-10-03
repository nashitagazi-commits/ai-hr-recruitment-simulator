import { useState } from "react"
import { Link } from "react-router-dom"
import { forgotPassword } from "../Services/authServices"

function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.")
      return
    }

    try {
      setLoading(true)
      await forgotPassword(email.trim())
      setSent(true)
    } catch (requestError) {
      setError(requestError.message || "Unable to send a reset link. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">

      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">

        {!sent ? (
          <>
            <h1 className="text-3xl font-bold text-center">
              Forgot Password?
            </h1>

            <p className="mt-2 text-center text-gray-500">
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="mt-6">

              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>

              <input
                type="email"
                autoComplete="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />

              {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

            </form>
          </>
        ) : (
          <div className="text-center">

            <h1 className="text-3xl font-bold">
              Reset Link Sent
            </h1>

            <p className="mt-3 text-gray-600">
              If an account exists for {email}, a password reset link
              has been sent.
            </p>

            <Link to="/login" className="mt-6 inline-block font-medium text-blue-600 hover:text-blue-700">
              Return to login
            </Link>

          </div>
        )}

      </div>

    </div>
  )
}

export default ForgotPassword