import { useState } from "react"
import { Link } from "react-router-dom"
import { signupUser } from "../Services/authServices"

function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const getPasswordStrength = (value) => {
    const criteria = [value.length >= 8, /[A-Z]/.test(value), /[a-z]/.test(value), /[0-9]/.test(value), /[^A-Za-z0-9]/.test(value)]
    const score = criteria.filter(Boolean).length
    return score >= 4 ? "strong" : score >= 2 ? "medium" : "weak"
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (!name.trim()) return setError("Please enter your full name.")
    if (!isValidEmail(email)) return setError("Please enter a valid email address.")
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return setError("Use at least 8 characters with uppercase, lowercase, and a number.")
    }
    if (password !== confirmPassword) return setError("Passwords do not match.")
    if (!role) return setError("Please select Candidate or Recruiter.")

    try {
      setLoading(true)
      await signupUser({ name: name.trim(), email: email.trim(), password, role })
      setSuccess("Your account has been created. You can now log in.")
    } catch (requestError) {
      setError(requestError.message || "Unable to create your account. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">

      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">

        <h1 className="text-3xl font-bold text-center">
          Create Account
        </h1>

        <p className="text-gray-700 text-center mt-4">
          Join AI HR Recruitment
        </p>
        {error && <div role="alert" className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        {success && <div role="status" className="mt-6 rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</div>}

        <form onSubmit={handleSubmit} className="mt-6">

  <div>
    <label className="block text-sm font-medium text-gray-700">
      Full Name
    </label>

    <input
  type="text"
  autoComplete="name"
  required
  placeholder="Enter your full name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
    />
  </div>
  <div className="mt-4">


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

</div>
<div className="mt-4">

  <label className="block text-sm font-medium text-gray-700">
    Password
  </label>

  <input
  type="password"
  autoComplete="new-password"
  minLength={8}
  required
  placeholder="Create a password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"


/>
{password && (
  <p className="mt-2 text-sm">
    Password strength:{" "}
    <span className="font-semibold">
      {getPasswordStrength(password)}
    </span>
  </p>
)}
<div className="mt-4">

  <label className="block text-sm font-medium text-gray-700">
    Confirm Password
  </label>

  <input
    type="password"
    autoComplete="new-password"
    minLength={8}
    required
    placeholder="Confirm your password"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"

  />

</div>

</div>
<div className="mt-4">

  <div className="mt-2 flex gap-6">

    <label className="flex items-center gap-2">
      <input
  type="radio"
  name="role"
  value="candidate"
  required
  checked={role === "candidate"}
  onChange={(e) => setRole(e.target.value)}
/>
      Candidate
    </label>

    <label className="flex items-center gap-2">
    <input
  type="radio"
  name="role"
  value="recruiter"
  checked={role === "recruiter"}
  onChange={(e) => setRole(e.target.value)}
/>
      Recruiter
    </label>

  </div>

</div>
<button
  type="submit"
  disabled={loading || Boolean(success)}
  className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
>
  {loading ? "Creating account..." : "Create Account"}
</button>
<p className="mt-6 text-center text-sm text-gray-600">
  Already have an account?{" "}
  <Link
  to="/login"
  className="font-semibold text-blue-600 hover:text-blue-700"
>
  Login
</Link>
</p>

</form>
        
      </div>

    </div>
  )
}

export default Register