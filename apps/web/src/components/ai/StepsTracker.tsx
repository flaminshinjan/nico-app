import { motion } from "framer-motion";
import type { Step } from "@/context/ChatContext";

type StepsTrackerProps = {
  steps: Step[];
};

function DoneIcon() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className="w-4 h-4 flex items-center justify-center flex-shrink-0"
      style={{ filter: "drop-shadow(0 0 6px rgba(74,222,128,0.3))" }}
    >
      <svg
        className="w-4 h-4 text-accent-success"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="m5 13 4 4L19 7"
        />
      </svg>
    </motion.div>
  );
}

function ActiveIcon() {
  return <div className="spinner" />;
}

function PendingIcon() {
  return (
    <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
      <div className="w-1.5 h-1.5 rounded-full bg-content-tertiary" />
    </div>
  );
}

export function StepsTracker({ steps }: StepsTrackerProps) {
  return (
    <div className="flex flex-col gap-1.5 border-l-2 border-line pl-3 py-1">
      {steps.map((step, i) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.2 }}
          className="flex items-center gap-2"
        >
          {step.status === "done" ? (
            <DoneIcon />
          ) : step.status === "active" ? (
            <ActiveIcon />
          ) : (
            <PendingIcon />
          )}
          <span
            className={`text-xs font-mono ${
              step.status === "done"
                ? "text-content-secondary"
                : step.status === "active"
                  ? "text-content-primary"
                  : "text-content-tertiary"
            }`}
          >
            {step.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
