'use client';

import React, { useEffect, useRef, useId } from 'react';

export type DrawerPosition = 'left' | 'right' | 'bottom';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  position?: DrawerPosition;
  busy?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Drawer = React.forwardRef<HTMLDialogElement, DrawerProps>(
  (
    {
      open,
      onClose,
      title,
      description,
      position = 'right',
      busy = false,
      children,
      footer,
      className = '',
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLDialogElement | null>(null);
    const openerRef = useRef<HTMLElement | null>(null);
    const id = useId();

    const titleId = `${id}-drawer-title`;
    const descId = description ? `${id}-drawer-desc` : undefined;

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
        openerRef.current = document.activeElement as HTMLElement | null;

        if (!dialog.open) {
          dialog.showModal();
        }

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
          document.body.style.overflow = originalOverflow;
          if (dialog.open) {
            dialog.close();
          }
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

    const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
      e.preventDefault();
      if (!busy) {
        onClose();
      }
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === internalRef.current && !busy) {
        onClose();
      }
    };

    const positionClasses: Record<DrawerPosition, string> = {
      left: 'fixed top-0 bottom-0 left-0 m-0 h-full max-h-none w-full max-w-md rounded-r-lg rounded-l-none border-r border-border shadow-lg animate-in slide-in-from-left',
      right:
        'fixed top-0 bottom-0 right-0 m-0 h-full max-h-none w-full max-w-md rounded-l-lg rounded-r-none border-l border-border shadow-lg animate-in slide-in-from-right',
      bottom:
        'fixed bottom-0 left-0 right-0 m-0 w-full max-h-dialog rounded-t-lg rounded-b-none border-t border-border shadow-lg animate-in slide-in-from-bottom',
    };

    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- Native dialog backdrop click handles outside dismiss; keyboard dismiss is handled by Escape via onCancel
      <dialog
        ref={setRef}
        aria-labelledby={titleId}
        aria-describedby={descId}
        aria-busy={busy ? 'true' : undefined}
        onCancel={handleCancel}
        onClick={handleBackdropClick}
        className={[
          'p-0 bg-surface-solid text-fg backdrop:bg-ink/60 backdrop:backdrop-blur-sm overflow-hidden',
          positionClasses[position],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-space-4 border-b border-border flex items-start justify-between gap-space-3 shrink-0">
            <div>
              <h2 id={titleId} className="text-title font-medium text-fg">
                {title}
              </h2>
              {description && (
                <p id={descId} className="text-small text-fg-muted mt-space-1">
                  {description}
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              aria-label="Close drawer"
              className="touch-target text-fg-muted hover:text-primary focus-ring rounded-pill p-space-2 disabled:opacity-40 disabled:cursor-not-allowed -mr-space-2 -mt-space-2"
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
          <div className="p-space-4 overflow-y-auto flex-1 text-body text-fg">
            {children}
          </div>

          {/* Footer */}
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

Drawer.displayName = 'Drawer';
