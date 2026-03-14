import type { Step } from "@/context/ChatContext";

type StepsTrackerProps = {
  steps: Step[];
};

function DoneIcon() {
  return (
    <svg
      className="h-4 w-4 text-green-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="m5 13 4 4L19 7"
      />
    </svg>
  );
}

function ActiveIcon() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-slate-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 12a8 8 0 0 0-8-8"
      />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg
      className="h-4 w-4 text-slate-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="7" strokeWidth={2} />
    </svg>
  );
}

export function StepsTracker({ steps }: StepsTrackerProps) {
  return (
    <div className="flex flex-col gap-2 py-1">
      {steps.map((step) => (
        <div key={step.id} className="flex items-center gap-2">
          {step.status === "done" ? (
            <DoneIcon />
          ) : step.status === "active" ? (
            <ActiveIcon />
          ) : (
            <PendingIcon />
          )}
          <div
            className={`text-sm ${
              step.status === "done"
                ? "text-slate-500"
                : step.status === "active"
                  ? "font-medium text-slate-800"
                  : "text-slate-400"
            }`}
          >
            {step.label}
          </div>
        </div>
      ))}
    </div>
  );
}
