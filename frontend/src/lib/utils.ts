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
