import { type ReactNode } from 'react';

interface Step {
  title: string;
  description?: string;
  content: ReactNode;
}

interface WorkflowStepperProps {
  steps: Step[];
  activeStep: number;
  onStepClick: (index: number) => void;
}

export function WorkflowStepper({ steps, activeStep, onStepClick }: WorkflowStepperProps) {
  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const isActive = i === activeStep;
        const isDone = i < activeStep;

        return (
          <div key={i} className="relative">
            <button
              type="button"
              onClick={() => onStepClick(i)}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${
                isActive
                  ? 'border-gray-900 bg-gray-50'
                  : isDone
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  isDone ? 'bg-green-500 text-white' : isActive ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {isDone ? '✓' : i + 1}
                </span>
                <span className="text-sm font-semibold text-gray-900">{step.title}</span>
              </div>
              {step.description && (
                <p className="mt-1 ml-8 text-xs text-gray-500">{step.description}</p>
              )}
            </button>

            {isActive && (
              <div className="mt-2 ml-3 pl-5 border-l-2 border-gray-200">
                {step.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
