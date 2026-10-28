'use client';

import React from 'react';

export type CheckoutStep = 1 | 2 | 3;

export interface CheckoutStepperProps {
  currentStep: CheckoutStep;
  onStepClick?: (step: CheckoutStep) => void;
  canNavigateToStep?: (step: CheckoutStep) => boolean;
  className?: string;
}

const STEPS = [
  { step: 1 as CheckoutStep, label: 'Contact', description: 'Name & contact details' },
  { step: 2 as CheckoutStep, label: 'Delivery', description: 'Address & postal code' },
  { step: 3 as CheckoutStep, label: 'Review & Pay', description: 'Verification & gateway' },
];

export function CheckoutStepper({
  currentStep,
  onStepClick,
  canNavigateToStep,
  className = '',
}: CheckoutStepperProps) {
  return (
    <nav aria-label="Checkout progress" className={`w-full ${className}`}>
      {/* Mobile Stepper Header: Compact Progress */}
      <div className="md:hidden flex flex-col gap-space-2 mb-space-4">
        <div className="flex items-center justify-between text-caption font-medium">
          <span className="text-primary uppercase tracking-wider font-semibold">
            Step {currentStep} of 3
          </span>
          <span className="text-fg font-medium">
            {STEPS[currentStep - 1]?.label}
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div
          className="w-full h-1.5 bg-surface rounded-full overflow-hidden"
          role="progressbar"
          aria-label="Checkout progress"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuetext={`Step ${currentStep} of 3: ${STEPS[currentStep - 1]?.label}`}
        >
          <div
            className="h-full bg-primary transition-all duration-base ease-out"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop Stepper: Horizontal Step Trail */}
      <ol className="hidden md:flex items-center justify-between w-full border-b border-border pb-space-6">
        {STEPS.map((s, index) => {
          const isCompleted = currentStep > s.step;
          const isCurrent = currentStep === s.step;
          const isClickable = canNavigateToStep ? canNavigateToStep(s.step) : isCompleted;

          return (
            <li key={s.step} className="flex-1 flex items-center">
              <button
                type="button"
                disabled={!isClickable && !isCurrent}
                onClick={() => isClickable && onStepClick?.(s.step)}
                className={`flex items-center gap-space-3 group text-left transition-colors focus-ring rounded-sm p-space-1 ${
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {/* Step Circle */}
                <span
                  className={`w-space-8 h-space-8 rounded-pill flex items-center justify-center text-small font-semibold transition-all shrink-0 ${
                    isCompleted
                      ? 'bg-primary text-on-primary'
                      : isCurrent
                      ? 'border-2 border-primary text-primary bg-primary-tint/30'
                      : 'border border-border text-fg-muted bg-surface'
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="w-space-4 h-space-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    s.step
                  )}
                </span>

                {/* Step Labels */}
                <div className="flex flex-col">
                  <span
                    className={`text-small font-medium ${
                      isCurrent
                        ? 'text-primary font-semibold'
                        : isCompleted
                        ? 'text-fg group-hover:text-primary'
                        : 'text-fg-muted'
                    }`}
                  >
                    {s.label}
                  </span>
                  <span className="text-caption text-fg-muted line-clamp-1">
                    {s.description}
                  </span>
                </div>
              </button>

              {/* Connecting Divider */}
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-space-4 transition-colors ${
                    isCompleted ? 'bg-primary' : 'bg-border'
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
