import { Routes, Route, Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../Hooks/useAuth"

import Login from "../pages/Login"
import ForgotPassword from "../pages/ForgotPassword"
import Register from "../pages/Register"
import HRCopilot from "../pages/HRCopilot"
import Interview from "../pages/Interview"
import JobMatching from "../pages/JobMatching"
import JobDetails from "../pages/JobDetails"
import Ranking from "../pages/Ranking"
import CandidateDashboard from "../pages/CandidateDashboard"
import CandidateProfile from "../pages/CandidateProfile"
import Settings from "../pages/Settings"
import AppShell from "../AppShell"
import UploadResume from "../pages/UploadResume"
import PostJob from "../pages/PostJob"

function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function HomeRedirect() {
  const { user } = useAuth()
  const role = String(user?.role || "").toLowerCase()
  const target = role === "candidate" ? "/candidate-dashboard" : role === "recruiter" ? "/recruiter-dashboard" : "/hr-copilot"
  return <Navigate to={target} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/signup"
        element={<Register />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/hr-copilot" element={<HRCopilot />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/recruiter-dashboard" element={<Ranking />} />
          <Route path="/interview/:candidateId" element={<Interview />} />
          <Route path="/jobs" element={<JobMatching />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/candidate-dashboard" element={<CandidateDashboard />} />
          <Route path="/candidate-profile" element={<CandidateProfile />} />
          <Route path="/upload-resume" element={<UploadResume />} />
          <Route path="/post-job" element={<PostJob />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes
