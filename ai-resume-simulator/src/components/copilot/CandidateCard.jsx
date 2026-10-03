// src/components/copilot/CandidateCard.jsx
// Result card shown inside AI replies: name, score, key skills.
import Badge from "../Badge";

const scoreColor = (s) => (s >= 85 ? "text-emerald-600" : s >= 70 ? "text-amber-600" : "text-rose-600");

function ScoreRing({ score, size = 56 }) {
  const r = 22;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(Math.max(score, 0), 100) / 100);
  return (
    <div className={`relative shrink-0 ${scoreColor(score)}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 56 56" className="-rotate-90" width={size} height={size} aria-hidden="true">
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="5" className="stroke-slate-200" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">{score}</span>
    </div>
  );
}

export default function CandidateCard({ candidate, rank, onView }) {
  const { name, score, skills = [], location, experience_years, summary } = candidate;
  const visibleSkills = skills.slice(0, 4);
  const extra = skills.length - visibleSkills.length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <ScoreRing score={score} />
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-semibold text-slate-900">
            {rank != null && <span className="mr-1 text-slate-400">#{rank}</span>}
            {name}
          </h4>
          <p className="text-xs text-slate-500">
            {[location, experience_years != null && `${experience_years} yrs exp`].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {summary && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{summary}</p>}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {visibleSkills.map((skill) => (
          <Badge key={skill}>{skill}</Badge>
        ))}
        {extra > 0 && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">+{extra}</span>
        )}
      </div>

      {onView && (
        <button
          type="button"
          onClick={() => onView(candidate)}
          className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus-visible:underline"
        >
          View profile →
        </button>
      )}
    </div>
  );
}
