'use client';

import React, { useEffect, useRef, useId } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  busy?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const maxWidthClasses = {
  sm: 'md:max-w-md',
  md: 'md:max-w-lg',
  lg: 'md:max-w-2xl',
  xl: 'md:max-w-4xl',
  full: 'md:max-w-5xl',
};

export const Modal = React.forwardRef<HTMLDialogElement, ModalProps>(
  (
    {
      open,
      onClose,
      title,
      description,
      busy = false,
      children,
      footer,
      maxWidth = 'md',
      className = '',
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLDialogElement | null>(null);
    const openerRef = useRef<HTMLElement | null>(null);
    const id = useId();

    const titleId = `${id}-title`;
    const descId = description ? `${id}-desc` : undefined;

    // Attach both refs
    const setRef = (node: HTMLDialogElement | null) => {
      internalRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    useEffect(() => {
      const dialog = internalRef.current;
      if (!dialog) return;

      if (open) {
        // Save current active element to restore focus when closed
        openerRef.current = document.activeElement as HTMLElement | null;

        if (!dialog.open) {
          dialog.showModal();
        }

        // Lock body scroll
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
          document.body.style.overflow = originalOverflow;
          if (dialog.open) {
            dialog.close();
          }
          // Return focus to opener
          openerRef.current?.focus();
        };
      } else {
        if (dialog.open) {
          dialog.close();
        }
        openerRef.current?.focus();
        return undefined;
      }
    }, [open]);

    // Handle native cancel event (Escape key)
    const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
      e.preventDefault();
      if (!busy) {
        onClose();
      }
    };

    // Close on backdrop click (clicking the dialog itself rather than content inside)
    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === internalRef.current && !busy) {
        onClose();
      }
    };

    return (
      <dialog
        ref={setRef}
        aria-labelledby={titleId}
        aria-describedby={descId}
        aria-busy={busy ? 'true' : undefined}
        onCancel={handleCancel}
        onClick={handleBackdropClick}
        className={[
          'fixed p-0 border border-border shadow-lg bg-surface-solid text-primary',
          'backdrop:bg-ink/60 backdrop:backdrop-blur-sm',
          // Mobile bottom sheet: anchored to bottom, full width, rounded top
          'max-md:m-0 max-md:mt-auto max-md:bottom-0 max-md:w-full max-md:max-h-[90vh] max-md:rounded-b-none max-md:rounded-t-lg',
          // Desktop centered modal
          'md:m-auto md:w-full md:rounded-md md:max-h-[85vh]',
          maxWidthClasses[maxWidth],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="flex flex-col h-full max-h-[inherit] overflow-hidden">
          {/* Header */}
          <div className="p-space-4 border-b border-border flex items-start justify-between gap-space-3 shrink-0">
            <div>
              <h2 id={titleId} className="text-title font-medium text-primary">
                {title}
              </h2>
              {description && (
                <p id={descId} className="text-small text-muted mt-space-1">
                  {description}
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              aria-label="Close dialog"
              className="touch-target text-muted hover:text-primary focus-ring rounded-pill p-space-2 disabled:opacity-40 disabled:cursor-not-allowed -mr-space-2 -mt-space-2"
            >
              <svg
                className="w-space-5 h-space-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-space-4 overflow-y-auto flex-1 text-body text-primary">
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div className="p-space-4 border-t border-border bg-surface/40 flex items-center justify-end gap-space-3 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </dialog>
    );
  }
);

Modal.displayName = 'Modal';
