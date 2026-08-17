/**
 * Componente reutilizable: Card
 *
 * Contenedor con sombra, borde y bordes redondeados.
 * Base para mostrar resultados de consulta y formularios.
 */

import { type HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export default function Card({ elevated = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-2xl border border-gray-100 p-6',
        elevated ? 'shadow-lg' : 'shadow-sm',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
