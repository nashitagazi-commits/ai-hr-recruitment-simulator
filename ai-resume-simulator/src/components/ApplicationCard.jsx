import { Link } from "react-router-dom";
import { Building2, MapPin, ArrowRight } from "lucide-react";

import ApplicationStepper from "./ApplicationStepper";

function ApplicationCard({ application }) {
  const canInterview = application.status === "Applied" || application.status === "Screened";
  const finished = application.status === "Interviewed" || application.status === "Result";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-secondary-700">
            {application.title}
          </h3>

          <div className="mt-2 flex flex-wrap gap-4 text-sm text-secondary-500">
            <span className="flex items-center gap-2">
              <Building2 size={16} />
              {application.company}
            </span>

            <span className="flex items-center gap-2">
              <MapPin size={16} />
              {application.location}
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-primary-50 px-4 py-2 text-center">
          <p className="text-xs text-secondary-500">Job Match</p>

          <p className="text-xl font-bold text-primary-700">
            {application.matchScore}%
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-gray-100 pt-5">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-secondary-700">
            Application Progress
          </h4>

          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            {application.status}
          </span>
        </div>

        <ApplicationStepper currentStatus={application.status} />
      </div>

      {finished && application.aiScore !== null && application.aiScore !== undefined && (
        <p className="mt-4 text-sm text-secondary-600">
          Interview score: <span className="font-bold text-primary-700">{Math.round(application.aiScore)}</span>
          {application.decision ? ` - ${application.decision}` : ""}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-end gap-5">
        {canInterview && (
          <Link
            to={`/interview/${application.id}`}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            {application.status === "Applied" ? "Start Interview" : "Continue Interview"}
          </Link>
        )}

        <Link
          to={`/jobs/${application.jobId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
        >
          View Job
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export default ApplicationCard;
