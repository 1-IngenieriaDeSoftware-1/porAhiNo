/**
 * Componente: Navbar
 *
 * Barra de navegación principal. Responsive (hamburger en móvil).
 * Links: Consultar | Mis Vehículos | Admin (solo admins) | Login
 *
 * TODO: Conectar con AuthContext para mostrar/ocultar links según rol
 */

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm" role="navigation" aria-label="Navegación principal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" id="nav-brand" className="flex items-center gap-2">
            <span className="text-2xl">🚗</span>
            <span className="font-bold text-primary-700 text-lg">porAhiNo</span>
          </Link>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/consulta" id="nav-consulta" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
              Consultar
            </Link>
            <Link href="/vehiculos" id="nav-vehiculos" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
              Mis Vehículos
            </Link>
            {/* TODO: Mostrar solo si rol === 'admin' */}
            <Link href="/admin" id="nav-admin" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
              Admin
            </Link>
            <Link href="/auth/login" id="nav-login" className="btn-primary py-2 px-4">
              Iniciar sesión
            </Link>
          </div>

          {/* TODO: Hamburger menu para móvil */}
          <button id="nav-hamburger" className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100" aria-label="Abrir menú">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
