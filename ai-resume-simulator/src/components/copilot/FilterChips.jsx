// src/components/copilot/FilterChips.jsx
// Quick filters shown above the chat: skill (multi), score (single), location (single).

const GROUPS = [
  { key: "skills", label: "Skill", options: ["Python", "React", "Java", "SQL", "Machine Learning"] },
  { key: "minScore", label: "Score", options: [70, 80, 90], format: (v) => `${v}+` },
  { key: "location", label: "Location", options: ["Remote", "Bangalore", "Chennai", "Hyderabad"] },
];

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
        active
          ? "border-primary-600 bg-primary-600 text-white"
          : "border-slate-300 bg-white text-slate-600 hover:border-primary-500 hover:text-primary-700"
      }`}
    >
      {children}
    </button>
  );
}

export default function FilterChips({ filters, onToggle, onClear }) {
  const hasActive = filters.skills.length > 0 || filters.minScore != null || filters.location != null;

  return (
    <div className="space-y-2 border-b border-slate-200 bg-white px-4 py-3">
      {GROUPS.map(({ key, label, options, format }) => (
        <div key={key} className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {options.map((opt) => {
              const active = key === "skills" ? filters.skills.includes(opt) : filters[key] === opt;
              return (
                <Chip key={opt} active={active} onClick={() => onToggle(key, opt)}>
                  {format ? format(opt) : opt}
                </Chip>
              );
            })}
          </div>
        </div>
      ))}
      {hasActive && (
        <button type="button" onClick={onClear} className="text-xs font-medium text-primary-600 hover:underline">
          Clear filters
        </button>
      )}
    </div>
  );
}
