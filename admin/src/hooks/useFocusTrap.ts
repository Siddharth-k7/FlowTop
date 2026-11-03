'use client';
import { useEffect, type RefObject } from 'react';

const FOCUSABLE = 'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])';

/**
 * While `active`: focus moves into `ref`, Tab and Shift+Tab cycle inside it, Escape calls
 * `onEscape`. On deactivate, focus goes back to the element that had it before.
 * Used by the mobile drawer. Same behaviour MediaPicker had before it moved to the ui Modal.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const prev = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const focusable = () => Array.from(node?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((e) => !e.hasAttribute('disabled'));
    focusable()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onEscape(); return; }
      if (e.key !== 'Tab') return;
      const f = focusable(); const first = f[0]; const last = f[f.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && (document.activeElement === first || !node?.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !node?.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus(); };
  }, [ref, active, onEscape]);
}
