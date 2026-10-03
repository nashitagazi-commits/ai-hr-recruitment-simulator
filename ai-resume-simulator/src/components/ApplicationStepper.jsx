const stages = [
  "Applied",
  "Screened",
  "Interviewed",
  "Result",
];

function ApplicationStepper({ currentStatus }) {
  const currentIndex = stages.indexOf(currentStatus);

  return (
    <div className="w-full py-4">
      <div className="flex items-center">
        {stages.map((stage, index) => {
          const completed = index <= currentIndex;

          return (
            <div
              key={stage}
              className="flex flex-1 items-center"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                    completed
                      ? "border-primary-600 bg-primary-600 text-white"
                      : "border-gray-300 bg-white text-secondary-400"
                  }`}
                >
                  {index + 1}
                </div>

                <span
                  className={`mt-2 whitespace-nowrap text-xs font-medium ${
                    completed
                      ? "text-primary-700"
                      : "text-secondary-400"
                  }`}
                >
                  {stage}
                </span>
              </div>

              {index < stages.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 ${
                    index < currentIndex
                      ? "bg-primary-600"
                      : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ApplicationStepper;