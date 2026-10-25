/**
 * Utilidades generales del frontend
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatPlaca, validarPlaca } from '@/lib/placa';

export { formatPlaca, validarPlaca };

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function getFechaHoraColombia(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
}

export function formatFechaHora(dateStr: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  }).format(new Date(dateStr));
}

/** Normaliza `detail` de FastAPI (string | lista de errores) a texto seguro para UI. */
export function formatApiDetail(detail: unknown, fallback: string): string {
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg: unknown }).msg);
        }
        return null;
      })
      .filter((v): v is string => Boolean(v));
    if (parts.length) return parts.join(', ');
  }
  return fallback;
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { detail?: unknown } } };
  return formatApiDetail(axiosErr.response?.data?.detail, fallback);
}
