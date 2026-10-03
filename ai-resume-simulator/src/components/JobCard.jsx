import { Link } from "react-router-dom";
import {
  MapPin,
  Building2,
  ArrowRight,
} from "lucide-react";

import Card from "./Card";
import Badge from "./Badge";
import MatchScore from "./MatchScore";

function JobCard({ job }) {
  return (
    <Card className="h-full border border-gray-100 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex h-full flex-col">

        {/* TITLE + MATCH */}
        <div className="flex items-start justify-between gap-4">

          <div>
            <h2 className="text-lg font-bold text-secondary-700">
              {job.title}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-secondary-500">

              <span className="inline-flex items-center gap-1.5">
                <Building2 size={16} />
                {job.company}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <MapPin size={16} />
                {job.location}
              </span>

            </div>
          </div>

          <MatchScore score={job.matchScore} />

        </div>

        {/* SKILLS */}
        <div className="mt-5 flex flex-wrap gap-2">

          {job.skills.map((skill) => (
            <Badge
              key={skill}
              variant="blue"
            >
              {skill}
            </Badge>
          ))}

        </div>

        {/* DESCRIPTION */}
        <p className="mt-5 line-clamp-2 text-sm leading-6 text-secondary-500">
          {job.description}
        </p>

        {/* DETAILS BUTTON */}
        <div className="mt-auto pt-5">

          <Link
            to={`/jobs/${job.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            View Details

            <ArrowRight size={16} />

          </Link>

        </div>

      </div>

    </Card>
  );
}

export default JobCard;