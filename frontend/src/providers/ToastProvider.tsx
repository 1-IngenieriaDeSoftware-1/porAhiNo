'use client';

import {
  createContext,
  useCallback,
  useContext,
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
}

interface ToastContextValue {
  toast: (message: string, options?: ToastOptions) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const KIND_STYLES: Record<ToastKind, string> = {
  success: 'bg-success-light/95 border-success/30 text-success-dark',
  error: 'bg-danger-light/95 border-danger/30 text-danger-dark',
  info: 'bg-primary-50/95 border-primary-200 text-primary-800',
  warning: 'bg-warning-light/95 border-warning/30 text-warning-dark',
};

const KIND_LABEL: Record<ToastKind, string> = {
  success: 'Éxito',
  error: 'Error',
  info: 'Aviso',
  warning: 'Atención',
};

const FADE_MS = 400;
const DEFAULT_DURATION_MS = 3000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

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
      setToasts((prev) => [...prev, { id, message, kind, leaving: false }]);
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
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-end gap-2 p-4 sm:p-6"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`toast-item ${KIND_STYLES[item.kind]} ${
              item.leaving ? 'animate-toast-out' : 'animate-toast-in'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  {KIND_LABEL[item.kind]}
                </p>
                <p className="text-sm font-medium leading-snug mt-0.5">{item.message}</p>
              </div>
              <button
                type="button"
                className="pointer-events-auto -mr-1 -mt-0.5 rounded-lg px-2 py-1 text-sm opacity-60 hover:opacity-100"
                aria-label="Cerrar notificación"
                onClick={() => dismiss(item.id)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
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
