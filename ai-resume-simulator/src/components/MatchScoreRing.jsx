function MatchScoreRing({ score }) {
  const value = Math.max(
    0,
    Math.min(100, Number(score) || 0)
  );

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-36 w-36">
        <svg
          className="h-full w-full -rotate-90"
          viewBox="0 0 120 120"
        >
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-primary-100"
          />

          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            className="text-primary-600 transition-all duration-500"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-secondary-700">
            {value}%
          </span>

          <span className="text-xs text-secondary-500">
            Match
          </span>
        </div>
      </div>

      <p className="mt-2 text-sm font-medium text-secondary-500">
        Overall Match Score
      </p>
    </div>
  );
}

export default MatchScoreRing;