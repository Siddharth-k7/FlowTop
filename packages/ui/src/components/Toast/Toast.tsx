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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(duration);
  const isPausedRef = useRef<boolean>(false);

  const startTimer = useCallback(() => {
    if (duration <= 0) return;
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismiss(id);
    }, remainingTimeRef.current);
  }, [duration, id, onDismiss]);

  const pauseTimer = () => {
    if (duration <= 0 || !timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    isPausedRef.current = true;
  };

  const resumeTimer = () => {
    if (duration <= 0 || !isPausedRef.current) return;
    isPausedRef.current = false;
    startTimer();
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startTimer]);

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
  const isAlert = type === 'error' || type === 'warning';

  return (
    <div
      role={isAlert ? 'alert' : 'status'}
      aria-live={isAlert ? 'assertive' : 'polite'}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      className={`pointer-events-auto flex items-start gap-space-3 p-space-4 rounded-md border shadow-md w-full max-w-sm ${current.bg} ${current.border} transition-all`}
    >
      <div className={`shrink-0 mt-0.5 ${current.iconColor}`}>
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
        <h4 className="text-small font-medium text-primary">
          {title || current.defaultTitle}
        </h4>
        <div className="text-caption text-muted mt-space-1 break-words">
          {message}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        className="touch-target -mr-space-2 -mt-space-2 p-space-2 text-muted hover:text-primary focus-ring rounded-pill shrink-0 inline-flex items-center justify-center"
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
  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed bottom-space-4 right-space-4 z-toast flex flex-col gap-space-2 max-w-sm w-full pointer-events-none px-space-3"
    >
      {toasts.map(toast => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
