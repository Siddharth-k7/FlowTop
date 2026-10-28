import React from 'react';
import { useFinish } from './useFinish';
import { Check } from 'lucide-react';

export const FinishSwatches: React.FC = () => {
  const { activeFinishId, activeFinish, selectFinish, finishes } = useFinish();

  return (
    <div className="w-full max-w-sm flex flex-col items-start gap-2.5">
      {/* Finish Swatch Buttons Row */}
      <div
        role="group"
        aria-label="Bathfitting Architectural Finish Selection"
        className="glass-panel px-3 py-2 rounded-token-full border border-border-subtle shadow-subtle flex items-center gap-2.5 sm:gap-3"
      >
        {finishes.map((finish) => {
          const isSelected = activeFinishId === finish.id;

          return (
            <button
              key={finish.id}
              type="button"
              onClick={() => selectFinish(finish.id)}
              aria-pressed={isSelected}
              aria-label={`Select ${finish.name} finish`}
              className={`relative group w-8 h-8 sm:w-9 sm:h-9 rounded-token-full flex items-center justify-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-purple-deep focus-visible:ring-offset-2 ${
                isSelected
                  ? 'ring-2 ring-purple-deep scale-105 shadow-subtle'
                  : 'hover:scale-105 opacity-85 hover:opacity-100 ring-1 ring-border-medium'
              }`}
            >
              {/* Visual Swatch Disc */}
              <span
                className="w-full h-full rounded-token-full shadow-inner flex items-center justify-center transition-transform"
                style={{
                  backgroundColor: finish.swatchHex,
                  border: `1.5px solid ${finish.swatchBorderHex}`,
                }}
              >
                {isSelected && (
                  <Check
                    className={`w-3.5 h-3.5 ${
                      finish.id === 'matte-black' ? 'text-white' : 'text-ink'
                    }`}
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                )}
              </span>

              {/* Clean Tooltip Positioned Above Button */}
              <span className="sr-only sm:not-sr-only pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 px-2 py-0.5 rounded-token-sm bg-ink text-surface-white text-[10px] font-medium tracking-tight whitespace-nowrap z-20 shadow-floating">
                {finish.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Finish Label & Architectural Specification */}
      <div className="text-left transition-all duration-200 min-h-[28px] flex flex-col items-start">
        <p className="text-xs font-semibold text-ink tracking-tight flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-token-full bg-purple-deep" />
          <span>{activeFinish.name}</span>
          <span className="text-ink-subtle font-normal">— {activeFinish.subtitle}</span>
        </p>
      </div>
    </div>
  );
};
