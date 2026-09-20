import React, { useState, useEffect } from 'react';
import { HiCheckCircle } from 'react-icons/hi';

const steps = [
  'Understanding requirements',
  'Designing architecture',
  'Planning database',
  'Designing APIs',
  'Finalizing blueprint'
];

export default function GenerationStepper({ isGenerating }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 3800);

    return () => clearInterval(interval);
  }, [isGenerating]);

  if (!isGenerating) return null;

  return (
    <div 
      role="status" 
      aria-live="polite"
      className="w-full max-w-md mx-auto my-6 p-4 rounded-xl border border-zinc-200 bg-white shadow-xs text-left animate-fade-in"
    >
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-zinc-900"></span>
          </span>
          <span className="text-xs font-semibold text-zinc-900">Generating Blueprint...</span>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">
          Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
        </span>
      </div>

      <div className="mt-3 space-y-2.5">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div key={step} className="flex items-center gap-2.5">
              {isCompleted ? (
                <HiCheckCircle className="w-4 h-4 text-zinc-900 flex-shrink-0" />
              ) : isActive ? (
                <div className="flex h-4 w-4 items-center justify-center flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-zinc-900 animate-pulse" />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full border border-zinc-300 flex-shrink-0" />
              )}

              <span
                className={`text-xs ${
                  isCompleted
                    ? 'text-zinc-700 font-medium'
                    : isActive
                    ? 'text-zinc-950 font-semibold'
                    : 'text-zinc-400'
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
