import { useState, useEffect, useCallback } from 'react';
import {
  FinishId,
  FinishDefinition,
  FINISH_DEFINITIONS,
  FINISH_LIST,
} from './hero-3d.config';

// Global singleton listener for finish state across components without full re-mounts
let currentFinishId: FinishId = 'chrome';
const listeners = new Set<(finishId: FinishId) => void>();

function setGlobalFinish(id: FinishId) {
  if (currentFinishId === id) return;
  currentFinishId = id;
  listeners.forEach((listener) => listener(id));
}

export function useFinish() {
  const [activeFinishId, setActiveId] = useState<FinishId>(currentFinishId);

  useEffect(() => {
    const handleChange = (id: FinishId) => setActiveId(id);
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const selectFinish = useCallback((id: FinishId) => {
    setGlobalFinish(id);
  }, []);

  const activeFinish: FinishDefinition = FINISH_DEFINITIONS[activeFinishId] || FINISH_DEFINITIONS.chrome;

  return {
    activeFinishId,
    activeFinish,
    selectFinish,
    finishes: FINISH_LIST,
  };
}
