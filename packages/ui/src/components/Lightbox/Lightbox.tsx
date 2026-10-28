'use client';

import { useEffect, useRef, useState, useCallback, useId } from 'react';
import type { KeyboardEvent, TouchEvent } from 'react';

export interface LightboxItem {
  id?: string;
  url: string;
  alt?: string;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface LightboxProps {
  open: boolean;
  onClose: () => void;
  items: LightboxItem[];
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * Lightbox Component
 *
 * Accessible full-screen image viewer built on the native HTML5 <dialog>:
 * - Escape key to close
 * - ArrowLeft / ArrowRight navigation
 * - Focus saving and restoration to the opener element
 * - Mobile touch swipe gestures
 * - Caption and "N of M" counter text
 * - 44px minimum touch targets and focus rings
 */
export function Lightbox({
  open,
  onClose,
  items,
  currentIndex: controlledIndex,
  onIndexChange,
  ariaLabel = 'Image lightbox',
  className = '',
}: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const labelId = useId();

  const [internalIndex, setInternalIndex] = useState(0);
  const activeIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;

  const setActiveIndex = useCallback(
    (newIndex: number) => {
      if (items.length === 0) return;
      const clamped = (newIndex + items.length) % items.length;
      if (onIndexChange) {
        onIndexChange(clamped);
      } else {
        setInternalIndex(clamped);
      }
    },
    [items.length, onIndexChange]
  );

  // Sync internal index when controlled index updates
  useEffect(() => {
    if (controlledIndex !== undefined) {
      setInternalIndex(controlledIndex);
    }
  }, [controlledIndex]);

  // Handle native <dialog> opening, closing, and focus return
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      openerRef.current = document.activeElement as HTMLElement | null;
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
      openerRef.current?.focus();
    }
  }, [open]);

  // Handle native cancel event (triggered by Escape key in <dialog>)
  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
    e.preventDefault();
    onClose();
  };

  // Keyboard navigation: Escape, ArrowLeft, ArrowRight
  const handleKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveIndex(activeIndex - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveIndex(activeIndex + 1);
    }
  };

  // Touch swipe handling
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    const firstTouch = e.touches[0];
    if (firstTouch) {
      touchStartXRef.current = firstTouch.clientX;
    }
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;
    const firstTouch = e.changedTouches[0];
    if (!firstTouch) return;

    const diff = firstTouch.clientX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (diff > 50) {
      // Swiped right -> go to previous
      setActiveIndex(activeIndex - 1);
    } else if (diff < -50) {
      // Swiped left -> go to next
      setActiveIndex(activeIndex + 1);
    }
  };

  if (!open && items.length === 0) return null;

  const currentItem = items[activeIndex];
  const safeAlt = currentItem?.alt || `Image ${activeIndex + 1}`;
  const caption = currentItem?.caption || null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onKeyDown={handleKeyDown}
      aria-labelledby={labelId}
      className={`fixed inset-0 m-auto p-space-4 md:p-space-6 bg-surface-solid rounded-lg border border-border shadow-lg max-w-4xl w-[92vw] max-h-[90vh] z-modal backdrop:bg-ink/80 focus:outline-none ${className}`}
    >
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative flex flex-col items-center justify-between w-full h-full max-h-[84vh]"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between w-full mb-space-3">
          <span id={labelId} className="text-small font-medium text-fg-muted">
            {items.length > 0 ? `${activeIndex + 1} of ${items.length}` : ariaLabel}
          </span>

          {/* 44px minimum touch target Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image lightbox"
            className="min-w-touch min-h-touch flex items-center justify-center rounded-sm bg-surface hover:bg-surface-light text-fg border border-border focus-ring transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Image Viewport with Zero-Shift Aspect Ratio Box */}
        <div className="relative w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden rounded-md bg-surface border border-border">
          {currentItem && (
            <img
              src={currentItem.url}
              alt={safeAlt}
              className="max-h-full max-w-full object-contain select-none"
              width={currentItem.width || 1200}
              height={currentItem.height || 900}
            />
          )}
        </div>

        {/* Optional Caption */}
        {caption && (
          <p className="text-caption text-fg-muted text-center mt-space-2 px-space-2 max-w-measure">
            {caption}
          </p>
        )}

        {/* Navigation Controls */}
        {items.length > 1 && (
          <div className="flex items-center justify-between w-full mt-space-4">
            <button
              type="button"
              onClick={() => setActiveIndex(activeIndex - 1)}
              aria-label="Previous image"
              className="min-w-touch min-h-touch px-space-4 rounded-sm bg-surface hover:bg-surface-light text-fg text-small font-medium border border-border focus-ring transition-colors"
            >
              ← Previous
            </button>

            <span className="text-caption text-fg-muted">
              {activeIndex + 1} of {items.length}
            </span>

            <button
              type="button"
              onClick={() => setActiveIndex(activeIndex + 1)}
              aria-label="Next image"
              className="min-w-touch min-h-touch px-space-4 rounded-sm bg-surface hover:bg-surface-light text-fg text-small font-medium border border-border focus-ring transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
