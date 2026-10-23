'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { Spinner } from '../Spinner';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  duration?: number; // In ms. 0 means stays until dismissed.
}

export interface ToastItem {
  id: string;
  type: ToastType;
  message: React.ReactNode;
  title?: string;
  duration: number;
  loading?: boolean;
}

interface ToastContextValue {
  toasts: ToastItem[];
  show: (type: ToastType, message: React.ReactNode, options?: ToastOptions) => string;
  success: (message: React.ReactNode, options?: ToastOptions) => string;
  error: (message: React.ReactNode, options?: ToastOptions) => string;
  warning: (message: React.ReactNode, options?: ToastOptions) => string;
  info: (message: React.ReactNode, options?: ToastOptions) => string;
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: React.ReactNode;
      success: React.ReactNode | ((data: T) => React.ReactNode);
      error: React.ReactNode | ((err: unknown) => React.ReactNode);
    },
    options?: ToastOptions
  ) => Promise<T>;
  dismiss: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCount = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  const show = useCallback(
    (type: ToastType, message: React.ReactNode, options: ToastOptions = {}) => {
      const id = `toast-${++toastCount}`;
      // Errors stay until dismissed (duration 0). Others default to 5000ms.
      const defaultDuration = type === 'error' ? 0 : 5000;
      const duration = options.duration !== undefined ? options.duration : defaultDuration;

      const newToast: ToastItem = {
        id,
        type,
        message,
        title: options.title,
        duration,
      };

      setToasts(prev => [...prev, newToast]);
      return id;
    },
    []
  );

  const success = useCallback(
    (message: React.ReactNode, options?: ToastOptions) => show('success', message, options),
    [show]
  );

  const error = useCallback(
    (message: React.ReactNode, options?: ToastOptions) => show('error', message, options),
    [show]
  );

  const warning = useCallback(
    (message: React.ReactNode, options?: ToastOptions) => show('warning', message, options),
    [show]
  );

  const info = useCallback(
    (message: React.ReactNode, options?: ToastOptions) => show('info', message, options),
    [show]
  );

  const promise = useCallback(
    async <T,>(
      promiseToRun: Promise<T>,
      messages: {
        loading: React.ReactNode;
        success: React.ReactNode | ((data: T) => React.ReactNode);
        error: React.ReactNode | ((err: unknown) => React.ReactNode);
      },
      options?: ToastOptions
    ): Promise<T> => {
      const id = `toast-${++toastCount}`;
      // Show loading toast (stays until promise settles)
      setToasts(prev => [
        ...prev,
        {
          id,
          type: 'info',
          message: messages.loading,
          title: options?.title,
          duration: 0,
          loading: true,
        },
      ]);

      try {
        const result = await promiseToRun;
        const successMessage =
          typeof messages.success === 'function' ? messages.success(result) : messages.success;

        setToasts(prev =>
          prev.map(t =>
            t.id === id
              ? {
                  ...t,
                  type: 'success',
                  message: successMessage,
                  duration: options?.duration !== undefined ? options.duration : 5000,
                  loading: false,
                }
              : t
          )
        );
        return result;
      } catch (err: unknown) {
        const errorMessage =
          typeof messages.error === 'function' ? messages.error(err) : messages.error;

        setToasts(prev =>
          prev.map(t =>
            t.id === id
              ? {
                  ...t,
                  type: 'error',
                  message: errorMessage,
                  duration: 0, // Errors stay until dismissed
                  loading: false,
                }
              : t
          )
        );
        throw err;
      }
    },
    []
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        show,
        success,
        error,
        warning,
        info,
        promise,
        dismiss,
        clear,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const ToastCard: React.FC<{
  toast: ToastItem;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  const { id, type, message, title, duration, loading } = toast;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(duration);
  const isPausedRef = useRef<boolean>(false);
  const isHoveredRef = useRef<boolean>(false);
  const isFocusedRef = useRef<boolean>(false);
  const prevLoadingRef = useRef<boolean | undefined>(loading);
  const isMountedRef = useRef<boolean>(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (timeToWait: number) => {
      clearTimer();
      if (timeToWait <= 0) return;
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        onDismissRef.current(id);
      }, timeToWait);
    },
    [id, clearTimer]
  );

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimer();
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    }
    isPausedRef.current = true;
  }, [clearTimer]);

  const resumeTimer = useCallback(() => {
    if (isHoveredRef.current || isFocusedRef.current) {
      return;
    }
    isPausedRef.current = false;
    if (remainingTimeRef.current > 0) {
      startTimer(remainingTimeRef.current);
    }
  }, [startTimer]);

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
    pauseTimer();
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    resumeTimer();
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
    pauseTimer();
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    isFocusedRef.current = false;
    resumeTimer();
  };

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      if (!loading && duration > 0) {
        remainingTimeRef.current = duration;
        isPausedRef.current = false;
        startTimer(duration);
      }
    } else {
      // Reinitialise timer state if toast transitions from loading to settled (success / error)
      if (prevLoadingRef.current && !loading) {
        clearTimer();
        remainingTimeRef.current = duration;
        startTimeRef.current = Date.now();

        if (isHoveredRef.current || isFocusedRef.current) {
          isPausedRef.current = true;
        } else if (duration > 0) {
          isPausedRef.current = false;
          startTimer(duration);
        }
      }
    }
    prevLoadingRef.current = loading;
  }, [loading, duration, startTimer, clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  const typeConfig: Record<
    ToastType,
    { border: string; bg: string; iconColor: string; defaultTitle: string }
  > = {
    success: {
      border: 'border-success',
      bg: 'bg-surface-solid',
      iconColor: 'text-success',
      defaultTitle: 'Success',
    },
    error: {
      border: 'border-error',
      bg: 'bg-surface-solid',
      iconColor: 'text-error',
      defaultTitle: 'Error',
    },
    warning: {
      border: 'border-warning',
      bg: 'bg-surface-solid',
      iconColor: 'text-warning',
      defaultTitle: 'Warning',
    },
    info: {
      border: 'border-info',
      bg: 'bg-surface-solid',
      iconColor: 'text-info',
      defaultTitle: 'Information',
    },
  };

  const current = typeConfig[type];

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`pointer-events-auto flex items-start gap-space-3 p-space-4 rounded-md border shadow-md w-full max-w-sm ${current.bg} ${current.border} transition-all`}
    >
      <div className={`shrink-0 mt-space-1 ${current.iconColor}`}>
        {loading ? (
          <Spinner size="sm" />
        ) : type === 'success' ? (
          <svg className="w-space-5 h-space-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : type === 'error' ? (
          <svg className="w-space-5 h-space-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : type === 'warning' ? (
          <svg className="w-space-5 h-space-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ) : (
          <svg className="w-space-5 h-space-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-small font-medium text-fg">
          {title || current.defaultTitle}
        </div>
        <div className="text-caption text-fg-muted mt-space-1 break-words">
          {message}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        className="touch-target -mr-space-2 -mt-space-2 p-space-2 text-fg-muted hover:text-primary focus-ring rounded-pill shrink-0 inline-flex items-center justify-center"
      >
        <svg className="w-space-4 h-space-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  const politeToasts = toasts.filter(t => t.type !== 'error');
  const assertiveToasts = toasts.filter(t => t.type === 'error');

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed bottom-space-4 right-space-4 z-toast flex flex-col gap-space-2 max-w-sm w-full pointer-events-none px-space-3"
    >
      {/* Assertive live region for errors */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="false"
        className="flex flex-col gap-space-2 w-full"
      >
        {assertiveToasts.map(toast => (
          <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </div>

      {/* Polite live region for info, success, warning */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        className="flex flex-col gap-space-2 w-full"
      >
        {politeToasts.map(toast => (
          <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  );
};
