import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Briefcase,
  CheckCircle2,
  UserRound,
  ArrowRight,
} from "lucide-react";

import {
  getCandidateProfile,
  getCandidateApplications,
} from "../Services/candidateService";

import ApplicationCard from "../components/ApplicationCard";
import MatchScoreRing from "../components/MatchScoreRing";

function CandidateDashboard() {
  const [candidate, setCandidate] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [profileData, applicationData] = await Promise.all([
          getCandidateProfile(),
          getCandidateApplications(),
        ]);

        setCandidate(profileData);
        setApplications(applicationData);
      } catch (err) {
        setError("Unable to load dashboard information.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-secondary-500">
        Loading candidate dashboard...
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  const interviewedCount = applications.filter(
    (application) =>
      application.status === "Interviewed" ||
      application.status === "Result"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-700">
              Candidate Dashboard
            </h1>

            <p className="mt-2 text-secondary-500">
              Welcome back, {candidate?.name}!
            </p>
          </div>

          <Link
            to="/candidate-profile"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-3 font-semibold text-white hover:bg-primary-700"
          >
            <UserRound size={18} />
            My Profile
          </Link>
        </div>

        {/* Overview */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">

          {/* Total Applications */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary-50 p-3 text-primary-600">
                <Briefcase size={24} />
              </div>

              <h2 className="font-semibold text-secondary-600">
                Total Applications
              </h2>
            </div>

            <p className="text-4xl font-bold text-secondary-700">
              {applications.length}
            </p>

            <p className="mt-2 text-sm text-secondary-500">
              Jobs you have applied for
            </p>
          </div>

          {/* Interview Progress */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-3 text-green-600">
                <CheckCircle2 size={24} />
              </div>

              <h2 className="font-semibold text-secondary-600">
                Reached Interview
              </h2>
            </div>

            <p className="text-4xl font-bold text-secondary-700">
              {interviewedCount}
            </p>

            <p className="mt-2 text-sm text-secondary-500">
              Applications reaching the interview stage
            </p>
          </div>

          {/* Overall Match Score */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <MatchScoreRing
              score={candidate?.overallMatchScore ?? 0}
            />
          </div>
        </div>

        {/* Applications */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-secondary-700">
              My Applications
            </h2>

            <p className="mt-1 text-sm text-secondary-500">
              Track the progress of your job applications.
            </p>
          </div>

          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            Explore Jobs
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="space-y-5">
          {applications.length > 0 ? (
            applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
              />
            ))
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <p className="text-secondary-500">
                You have not applied for any jobs yet.
              </p>

              <Link
                to="/jobs"
                className="mt-4 inline-block font-semibold text-primary-600"
              >
                Browse Jobs
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CandidateDashboard;