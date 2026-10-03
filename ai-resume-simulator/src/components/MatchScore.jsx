function MatchScore({ score }) {
  const value = Math.max(
    0,
    Math.min(100, Number(score) || 0)
  );

  return (
    <div className="min-w-28">
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-secondary-500">
          Match
        </span>

        <span className="text-sm font-bold text-primary-700">
          {value}%
        </span>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-primary-100"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={`Job match score: ${value}%`}
      >
        <div
          className="h-full rounded-full bg-primary-600 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default MatchScore;