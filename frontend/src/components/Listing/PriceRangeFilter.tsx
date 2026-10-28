'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PRICE_STEP_RUPEES,
  DEFAULT_MIN_PRICE_RUPEES,
  DEFAULT_MAX_PRICE_RUPEES,
  rupeesToPaiseString,
  paiseToRupees,
} from '../../lib/filters';

export interface PriceRangeFilterProps {
  currentMinPaise?: number;
  currentMaxPaise?: number;
  minBoundRupees?: number;
  maxBoundRupees?: number;
  onChange: (minPaise: number | undefined, maxPaise: number | undefined) => void;
}

export function PriceRangeFilter({
  currentMinPaise,
  currentMaxPaise,
  minBoundRupees = DEFAULT_MIN_PRICE_RUPEES,
  maxBoundRupees = DEFAULT_MAX_PRICE_RUPEES,
  onChange,
}: PriceRangeFilterProps) {
  // Local state in whole rupees for smooth dragging without firing requests per pixel
  const [minRupees, setMinRupees] = useState<number>(() =>
    currentMinPaise !== undefined ? paiseToRupees(currentMinPaise) : minBoundRupees
  );
  const [maxRupees, setMaxRupees] = useState<number>(() =>
    currentMaxPaise !== undefined ? paiseToRupees(currentMaxPaise) : maxBoundRupees
  );

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCommittedRef = useRef<string>('');

  // Sync if URL searchParams change externally (e.g. back button or chip removal)
  useEffect(() => {
    const nextMin = currentMinPaise !== undefined ? paiseToRupees(currentMinPaise) : minBoundRupees;
    const nextMax = currentMaxPaise !== undefined ? paiseToRupees(currentMaxPaise) : maxBoundRupees;
    setMinRupees(nextMin);
    setMaxRupees(nextMax);
    lastCommittedRef.current = `${nextMin}-${nextMax}`;
  }, [currentMinPaise, currentMaxPaise, minBoundRupees, maxBoundRupees]);

  // Commit value to parent (URL state) in integer paise
  const commitChange = useCallback(
    (minVal: number, maxVal: number) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      const key = `${minVal}-${maxVal}`;
      if (key === lastCommittedRef.current) return;
      lastCommittedRef.current = key;

      const minPaise =
        minVal > minBoundRupees ? parseInt(rupeesToPaiseString(minVal), 10) : undefined;
      const maxPaise =
        maxVal < maxBoundRupees ? parseInt(rupeesToPaiseString(maxVal), 10) : undefined;

      onChange(minPaise, maxPaise);
    },
    [minBoundRupees, maxBoundRupees, onChange]
  );

  // Trigger 400ms debounce while dragging
  const scheduleDebounce = (newMin: number, newMax: number) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      commitChange(newMin, newMax);
    }, 400);
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), maxRupees - PRICE_STEP_RUPEES);
    setMinRupees(val);
    scheduleDebounce(val, maxRupees);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), minRupees + PRICE_STEP_RUPEES);
    setMaxRupees(val);
    scheduleDebounce(minRupees, val);
  };

  // Immediate commit on slider release (mouse up or touch end)
  const handleRelease = () => {
    commitChange(minRupees, maxRupees);
  };

  return (
    <div className="flex flex-col gap-space-3">
      {/* Readouts in whole rupees */}
      <div className="flex items-center justify-between text-small font-medium text-fg">
        <span>₹{minRupees.toLocaleString('en-IN')}</span>
        <span className="text-text-muted font-normal text-caption">to</span>
        <span>₹{maxRupees.toLocaleString('en-IN')}</span>
      </div>

      {/* Minimum Range Slider */}
      <div className="flex flex-col gap-space-1">
        <label htmlFor="min-price-slider" className="sr-only">
          Minimum price in rupees
        </label>
        <input
          id="min-price-slider"
          type="range"
          min={minBoundRupees}
          max={maxBoundRupees}
          step={PRICE_STEP_RUPEES}
          value={minRupees}
          onChange={handleMinChange}
          onMouseUp={handleRelease}
          onTouchEnd={handleRelease}
          className="w-full h-2 bg-surface rounded-pill appearance-none cursor-pointer accent-primary focus-ring"
        />
      </div>

      {/* Maximum Range Slider */}
      <div className="flex flex-col gap-space-1">
        <label htmlFor="max-price-slider" className="sr-only">
          Maximum price in rupees
        </label>
        <input
          id="max-price-slider"
          type="range"
          min={minBoundRupees}
          max={maxBoundRupees}
          step={PRICE_STEP_RUPEES}
          value={maxRupees}
          onChange={handleMaxChange}
          onMouseUp={handleRelease}
          onTouchEnd={handleRelease}
          className="w-full h-2 bg-surface rounded-pill appearance-none cursor-pointer accent-primary focus-ring"
        />
      </div>

      <div className="flex justify-between text-caption text-text-muted">
        <span>₹{minBoundRupees.toLocaleString('en-IN')}</span>
        <span>₹{maxBoundRupees.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}
