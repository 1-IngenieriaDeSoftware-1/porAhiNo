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

const KIND: Record<
  ToastKind,
  { accent: string; iconWrap: string; progress: string }
> = {
  success: {
    accent: '#059669',
    iconWrap: 'bg-emerald-50 text-emerald-600',
    progress: 'bg-emerald-500',
  },
  error: {
    accent: '#dc2626',
    iconWrap: 'bg-red-50 text-red-600',
    progress: 'bg-red-500',
  },
  info: {
    accent: '#345665',
    iconWrap: 'bg-slate-100 text-slate-700',
    progress: 'bg-slate-600',
  },
  warning: {
    accent: '#d97706',
    iconWrap: 'bg-amber-50 text-amber-600',
    progress: 'bg-amber-500',
  },
};

const FADE_MS = 320;
const DEFAULT_DURATION_MS = 3000;

function ToastIcon({ kind }: { kind: ToastKind }) {
  if (kind === 'success') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === 'error') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M15 9l-6 6m0-6l6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === 'warning') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 16v-5m0-4h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
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
      setToasts((prev) => [...prev.slice(-3), { id, message: text, kind, leaving: false, durationMs }]);
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
      <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
        {toasts.map((item) => {
          const meta = KIND[item.kind];
          return (
            <div
              key={item.id}
              role="status"
              className={`toast-card ${item.leaving ? 'toast-card--out' : 'toast-card--in'}`}
              style={{ borderLeftColor: meta.accent, ['--toast-duration' as string]: `${item.durationMs}ms` }}
            >
              <div className="toast-card__body">
                <span className={`toast-card__icon ${meta.iconWrap}`}>
                  <ToastIcon kind={item.kind} />
                </span>
                <p className="toast-card__msg">{item.message}</p>
                <button
                  type="button"
                  className="toast-card__close"
                  aria-label="Cerrar notificación"
                  onClick={() => dismiss(item.id)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              {!item.leaving && (
                <div className="toast-card__track" aria-hidden>
                  <div className={`toast-card__bar ${meta.progress}`} />
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
