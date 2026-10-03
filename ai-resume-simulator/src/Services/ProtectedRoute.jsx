import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated, getCurrentUser, homeForRole } from "./auth";

// usage in routes:
// <Route element={<ProtectedRoute role="candidate" />}> <Route path="/jobs" element={<Jobs />} /> </Route>
export default function ProtectedRoute({ role }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  const user = getCurrentUser();
  if (role && user?.role !== role) return <Navigate to={homeForRole(user?.role)} replace />;
  return <Outlet />;
}
