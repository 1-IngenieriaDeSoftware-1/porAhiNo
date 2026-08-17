/**
 * Utilidades generales del frontend
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases de Tailwind evitando conflictos.
 * Uso: cn('px-4 py-2', isActive && 'bg-blue-500')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formatea una placa a mayusculas y sin espacios.
 * Ejemplo: 'abc 123' -> 'ABC123'
 */
export function formatPlaca(placa: string): string {
  return placa.toUpperCase().replace(/\s+/g, '');
}

/**
 * Valida el formato de placa colombiana.
 * Formato valido: 3 letras + 3 caracteres (digito o letra)
 * Ejemplos validos: ABC123, ABC12D
 */
export function validarPlaca(placa: string): boolean {
  const regex = /^[A-Z]{3}[0-9]{2}[A-Z0-9]$/;
  return regex.test(formatPlaca(placa));
}

/**
 * Obtiene la fecha/hora actual en zona horaria Colombia (America/Bogota).
 */
export function getFechaHoraColombia(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' })
  );
}

/**
 * Formatea una fecha para mostrar al usuario colombiano.
 * Ejemplo: '2024-06-15T10:30:00' -> 'sabado, 15 de junio de 2024, 10:30'
 */
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
