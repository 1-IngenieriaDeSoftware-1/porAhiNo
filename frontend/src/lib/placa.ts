/**
 * Validación de placa colombiana (AC-001, AC-002).
 * Contrato igual al backend `app.core.placa`.
 */

export const PLACA_REGEX = /^[A-Z]{3}[0-9]{2}[A-Z0-9]$/;
export const PLACA_MENSAJE_ERROR =
  'Formato de placa inválido. Use formato colombiano: ABC123 o ABC12D';

export function formatPlaca(placa: string): string {
  return placa.toUpperCase().replace(/[\s-]+/g, '');
}

export function validarPlaca(placa: string): boolean {
  return PLACA_REGEX.test(formatPlaca(placa));
}
