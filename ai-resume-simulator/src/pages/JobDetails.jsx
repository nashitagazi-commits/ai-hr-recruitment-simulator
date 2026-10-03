import { useEffect, useState } from "react";
import { ArrowLeft, Building2, MapPin, Send } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Button from "../components/Button";
import Badge from "../components/Badge";
import Card from "../components/Card";
import MatchScore from "../components/MatchScore";

import { getJobById, applyToJob } from "../Services/jobsService";
import { getErrorMessage } from "../Services/api";

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyMsg, setApplyMsg] = useState(null); // { type: "success" | "error", text, needsResume }

  useEffect(() => {
    let cancelled = false;

    async function loadJob() {
      setLoading(true);
      setLoadError("");
      try {
        const result = await getJobById(id);
        if (!cancelled) setJob(result);
      } catch (err) {
        if (!cancelled) setLoadError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadJob();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-100 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="h-6 w-28 animate-pulse rounded bg-gray-200" />
          <div className="mt-6 h-40 animate-pulse rounded-xl bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  if (loadError || !job) {
    return (
      <div className="min-h-screen bg-secondary-100 px-4 py-16">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-2xl font-bold text-secondary-700">
            {loadError ? "Could not load this job" : "Job not found"}
          </h1>
          <p className="mt-2 text-secondary-500">
            {loadError || "The job you are looking for may have been removed or is unavailable."}
          </p>
          <Link
            to="/jobs"
            className="mt-6 inline-flex rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white hover:bg-primary-700"
          >
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  const handleApply = async () => {
    if (applying || job.applied) return;
    setApplying(true);
    setApplyMsg(null);
    try {
      await applyToJob(job.id);
      setJob({ ...job, applied: true });
      setApplyMsg({ type: "success", text: "Application submitted! Taking you to your dashboard..." });
      setTimeout(() => navigate("/candidate-dashboard"), 1200);
    } catch (err) {
      const text = getErrorMessage(err);
      setApplyMsg({ type: "error", text, needsResume: /resume/i.test(text) });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-secondary-700 hover:text-primary-700"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <Card className="mt-5 overflow-hidden p-0">
          {/* JOB HEADER */}
          <div className="border-b border-gray-100 p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-secondary-700">{job.title}</h1>

                <div className="mt-3 flex flex-wrap gap-4 text-sm text-secondary-500">
                  <span className="inline-flex items-center gap-2">
                    <Building2 size={17} />
                    {job.company}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={17} />
                    {job.location}
                  </span>
                </div>
              </div>

              <div className="w-full rounded-xl bg-primary-50 p-4 lg:w-64">
                <MatchScore score={job.matchScore} />
                <p className="mt-2 text-xs leading-5 text-secondary-500">
                  Match between your resume and this job's required skills.
                </p>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_280px]">
            <div>
              <section>
                <h2 className="text-xl font-bold text-secondary-700">Job Description</h2>
                <p className="mt-3 text-sm leading-7 text-secondary-500">{job.description}</p>
              </section>

              <section className="mt-8">
                <h2 className="text-xl font-bold text-secondary-700">Requirements</h2>
                <ul className="mt-4 space-y-3">
                  {job.requirements.map((requirement) => (
                    <li key={requirement} className="flex gap-3 text-sm leading-6 text-secondary-500">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-600" />
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <aside className="rounded-xl border border-gray-100 bg-gray-50 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary-500">
                Required Skills
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <Badge key={skill} variant="blue">
                    {skill}
                  </Badge>
                ))}
              </div>

              <div className="mt-6">
                {job.applied ? (
                  <div className="rounded-lg bg-green-50 p-3 text-center text-sm font-semibold text-green-700">
                    You have applied for this job
                    <Link to="/candidate-dashboard" className="mt-1 block font-medium text-primary-600 hover:text-primary-700">
                      Go to dashboard
                    </Link>
                  </div>
                ) : (
                  <Button onClick={handleApply} disabled={applying}>
                    <span className="inline-flex items-center gap-2">
                      <Send size={16} />
                      {applying ? "Applying..." : "Apply Now"}
                    </span>
                  </Button>
                )}

                {applyMsg && (
                  <div
                    role={applyMsg.type === "error" ? "alert" : "status"}
                    className={`mt-3 rounded-lg p-3 text-sm ${
                      applyMsg.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
                    }`}
                  >
                    {applyMsg.text}
                    {applyMsg.needsResume && (
                      <Link to="/upload-resume" className="mt-1 block font-semibold underline">
                        Upload your resume
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default JobDetails;
