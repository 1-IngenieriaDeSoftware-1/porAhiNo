'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  kind?: ToastKind;
  durationMs?: number;
}

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
  leaving: boolean;
  durationMs: number;
}

interface ToastContextValue {
  toast: (message: string, options?: ToastOptions) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const KIND_META: Record<
  ToastKind,
  { label: string; accent: string; iconBg: string; iconColor: string; bar: string }
> = {
  success: {
    label: 'Éxito',
    accent: 'border-l-success',
    iconBg: 'bg-success/15',
    iconColor: 'text-success',
    bar: 'bg-success',
  },
  error: {
    label: 'Error',
    accent: 'border-l-danger',
    iconBg: 'bg-danger/15',
    iconColor: 'text-danger',
    bar: 'bg-danger',
  },
  info: {
    label: 'Aviso',
    accent: 'border-l-primary-600',
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-700',
    bar: 'bg-primary-600',
  },
  warning: {
    label: 'Atención',
    accent: 'border-l-warning',
    iconBg: 'bg-warning/15',
    iconColor: 'text-warning',
    bar: 'bg-warning',
  },
};

const FADE_MS = 380;
const DEFAULT_DURATION_MS = 3000;

function ToastIcon({ kind }: { kind: ToastKind }) {
  const common = 'h-[18px] w-[18px]';
  if (kind === 'success') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 13l4 4L19 7"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === 'error') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 8v5m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (kind === 'warning') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 9v4m0 4h.01M10.3 4.2L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 4.2a2 2 0 00-3.4 0z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16v-5m0-4h.01M12 3a9 9 0 100 18 9 9 0 000-18z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function toToastText(message: unknown): string {
  if (typeof message === 'string' && message.trim()) return message;
  if (message == null) return 'Notificación';
  try {
    return String(message);
  } catch {
    return 'Notificación';
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    const existing = timersRef.current.get(id);
    if (existing) clearTimeout(existing);
    const removeTimer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, FADE_MS);
    timersRef.current.set(id, removeTimer);
  }, []);

  const toast = useCallback(
    (message: string, options?: ToastOptions) => {
      const id = ++idRef.current;
      const kind = options?.kind ?? 'info';
      const durationMs = options?.durationMs ?? DEFAULT_DURATION_MS;
      const text = toToastText(message);
      setToasts((prev) => [...prev.slice(-4), { id, message: text, kind, leaving: false, durationMs }]);
      const timer = setTimeout(() => dismiss(id), durationMs);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message: string) => toast(message, { kind: 'success' }),
      error: (message: string) => toast(message, { kind: 'error' }),
      info: (message: string) => toast(message, { kind: 'info' }),
      warning: (message: string) => toast(message, { kind: 'warning' }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed top-0 right-0 z-[100] flex w-full max-w-[420px] flex-col items-end gap-3 p-4 sm:p-5"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((item) => {
          const meta = KIND_META[item.kind];
          return (
            <div
              key={item.id}
              role="status"
              className={`toast-item border-l-[3px] ${meta.accent} ${
                item.leaving ? 'animate-toast-out' : 'animate-toast-in'
              }`}
              style={{ ['--toast-duration' as string]: `${item.durationMs}ms` }}
            >
              <div className="flex items-start gap-3 px-4 pb-3.5 pt-3.5">
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.iconBg} ${meta.iconColor}`}
                >
                  <ToastIcon kind={item.kind} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                    {meta.label}
                  </p>
                  <p className="mt-0.5 text-sm font-medium leading-snug text-ink-900">{item.message}</p>
                </div>
                <button
                  type="button"
                  className="pointer-events-auto -mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
                  aria-label="Cerrar notificación"
                  onClick={() => dismiss(item.id)}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              {!item.leaving && (
                <div className="toast-progress-track" aria-hidden>
                  <div className={`toast-progress-bar ${meta.bar}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return ctx;
}
